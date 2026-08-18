'use strict';

/**
 * The password panel used to score `length x log2(charset)`, which is only valid
 * for a uniformly random string. It rated "Password123!" as Strong and
 * "aaaaaaaaaaaaaaaaaaaa" as 94 bits, and it printed hardcoded Chinese crack
 * times ("4.2 分鐘") in both languages regardless of the score.
 *
 * These tests pin the behaviour that replaced it. Thresholds are stated in bits
 * so a failure says which direction the model moved.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadApp, readSource } = require('./helpers/load-app.js');

const VERY_WEAK_CEILING = 28;   // the first tier boundary in strengthTier()

function bitsOf(app, password) {
  return app.estimatePasswordStrength(password).bits;
}

test('the estimator is exposed as a standalone function', () => {
  const { app } = loadApp();
  assert.equal(typeof app.estimatePasswordStrength, 'function');
  assert.equal(typeof app.crackTimeSeconds, 'function');
  assert.equal(typeof app.formatCrackTime, 'function');
});

test('an empty password scores zero without throwing', () => {
  const { app } = loadApp();
  const result = app.estimatePasswordStrength('');
  assert.equal(result.bits, 0);
  assert.deepEqual(result.segments, []);
});

test('the most common passwords in the world are rated very weak', () => {
  const { app } = loadApp();
  for (const password of ['password', '123456', 'qwerty', 'letmein', 'iloveyou', 'admin']) {
    const bits = bitsOf(app, password);
    assert.ok(bits < 12, `${password} scored ${bits.toFixed(1)} bits; it costs an attacker a handful of guesses`);
  }
});

test('Password123! is very weak, not strong', () => {
  // The exact case the old disclosure banner had to apologise for.
  const { app } = loadApp();
  const bits = bitsOf(app, 'Password123!');
  assert.ok(bits < VERY_WEAK_CEILING,
    `scored ${bits.toFixed(1)} bits; the old length x log2(charset) formula gave 78`);
  assert.equal(app.strengthTier(bits).key, 'p2RatingVeryWeak');
});

test('length from repetition earns almost nothing', () => {
  const { app } = loadApp();
  const repeated = bitsOf(app, 'aaaaaaaaaaaaaaaaaaaa');           // 20 characters
  const shortRandom = bitsOf(app, 'x7$Kp2');                      // 6 characters
  assert.ok(repeated < 20, `20 identical characters scored ${repeated.toFixed(1)} bits`);
  assert.ok(repeated < shortRandom,
    `a 20-character repeat (${repeated.toFixed(1)}) must not beat 6 random characters (${shortRandom.toFixed(1)})`);
});

test('a repeated multi-character unit is not credited per repetition', () => {
  const { app } = loadApp();
  const unit = bitsOf(app, 'ab$9');
  const fivefold = bitsOf(app, 'ab$9ab$9ab$9ab$9ab$9');
  assert.ok(fivefold < unit + 6,
    `repeating a unit five times added ${(fivefold - unit).toFixed(1)} bits; it should add only the repeat count`);
});

test('leet substitution buys the user very little', () => {
  const { app } = loadApp();
  const plain = bitsOf(app, 'password');
  const leet = bitsOf(app, 'P@ssw0rd');
  assert.ok(leet < VERY_WEAK_CEILING, `P@ssw0rd scored ${leet.toFixed(1)} bits`);
  assert.ok(leet - plain < 10,
    `substitutions added ${(leet - plain).toFixed(1)} bits; every cracker applies them by rule`);
});

test('keyboard walks and character sequences are recognised', () => {
  const { app } = loadApp();
  for (const password of ['qwertyuiop', 'asdfgh', 'abcdefgh', '12345678', '987654321']) {
    const bits = bitsOf(app, password);
    assert.ok(bits < VERY_WEAK_CEILING, `${password} scored ${bits.toFixed(1)} bits`);
  }
});

test('a trailing year adds roughly nothing', () => {
  const { app } = loadApp();
  const bare = bitsOf(app, 'monkey');
  const dated = bitsOf(app, 'monkey2024');
  assert.ok(dated - bare < 14,
    `appending 2024 added ${(dated - bare).toFixed(1)} bits; brute force over 4 digits would be 13`);
});

test('completing a word into a dictionary entry lowers the score', () => {
  // Counter-intuitive but correct, and a property the old formula could not
  // express: "passwor" has to be brute-forced, "password" is guess number one.
  const { app } = loadApp();
  assert.ok(bitsOf(app, 'password') < bitsOf(app, 'passwor'),
    'a known word must be cheaper than an unknown string of the same shape');
});

test('a long random password is rated very strong', () => {
  const { app } = loadApp();
  const bits = bitsOf(app, '9f3Kd8sPq2mZx7Lw4Tn6');
  assert.ok(bits > 100, `scored ${bits.toFixed(1)} bits; 20 characters over ~62 symbols is ~119`);
  assert.equal(app.strengthTier(bits).key, 'p2RatingVeryStrong');
});

test('a long passphrase is rated very strong', () => {
  const { app } = loadApp();
  const bits = bitsOf(app, 'correct horse battery staple');
  assert.equal(app.strengthTier(bits).key, 'p2RatingVeryStrong');
});

test('the segment breakdown covers the whole password exactly once', () => {
  const { app } = loadApp();
  for (const password of ['Password123!', 'summer2024!!', 'aaaa1234qwer', 'x']) {
    const { segments } = app.estimatePasswordStrength(password);
    assert.equal(segments.map(s => s.token).join(''), password.slice(0, 64),
      `segments for ${password} must reassemble it`);
  }
});

test('every tier band is reachable and ordered', () => {
  const { app } = loadApp();
  const keys = [0, 20, 30, 50, 70, 120].map(bits => app.strengthTier(bits).key);
  assert.deepEqual(keys, [
    'p2RatingVeryWeak', 'p2RatingVeryWeak', 'p2RatingWeak',
    'p2RatingModerate', 'p2RatingStrong', 'p2RatingVeryStrong'
  ]);
});

test('the cloud fleet always cracks faster than the GPU cluster', () => {
  const { app } = loadApp();
  assert.ok(app.ATTACK_RATES.cloudBotnet > app.ATTACK_RATES.gpuCluster);
  for (const bits of [10, 45, 90, 200]) {
    assert.ok(
      app.crackTimeSeconds(bits, app.ATTACK_RATES.cloudBotnet) <
      app.crackTimeSeconds(bits, app.ATTACK_RATES.gpuCluster),
      `at ${bits} bits the faster attacker must report the shorter time`
    );
  }
});

test('crack time is derived from the score, not hardcoded', () => {
  const { app } = loadApp();
  app.setLanguage('en');
  const weak = app.formatCrackTime(app.crackTimeSeconds(bitsOf(app, 'password'), 1e11));
  const strong = app.formatCrackTime(app.crackTimeSeconds(bitsOf(app, '9f3Kd8sPq2mZx7Lw4Tn6'), 1e11));
  assert.match(weak, /Instantly/);
  assert.match(strong, /centuries/);
  assert.notEqual(weak, strong);
});

test('crack time is translated, in both directions', () => {
  const { app } = loadApp();
  const seconds = app.crackTimeSeconds(55, 1e11);   // a few days, so a real unit

  app.setLanguage('en');
  const english = app.formatCrackTime(seconds);
  app.setLanguage('zh-TW');
  const chinese = app.formatCrackTime(seconds);

  assert.doesNotMatch(english, /[一-鿿]/, `English output contained CJK: ${english}`);
  assert.match(chinese, /[一-鿿]/, `Chinese output contained no CJK: ${chinese}`);
  assert.notEqual(english, chinese);
});

test('every duration unit renders in both languages without a leftover placeholder', () => {
  const { app } = loadApp();
  // Spread across seconds, minutes, hours, days, months, years, centuries.
  const scores = [30, 36, 41, 46, 52, 58, 64, 75, 95, 130];
  for (const lang of ['en', 'zh-TW']) {
    app.setLanguage(lang);
    for (const bits of scores) {
      const text = app.formatCrackTime(app.crackTimeSeconds(bits, 1e11));
      assert.ok(text.length > 0, `${lang} @ ${bits} bits produced nothing`);
      assert.doesNotMatch(text, /\{n\}/, `${lang} @ ${bits} bits left the placeholder in: ${text}`);
      assert.doesNotMatch(text, /NaN|Infinity|undefined/, `${lang} @ ${bits} bits: ${text}`);
    }
  }
});

test('an absurd score does not overflow into Infinity or NaN', () => {
  const { app } = loadApp();
  app.setLanguage('en');
  const bits = bitsOf(app, 'K'.padEnd(400, 'q7$Xm2'));
  assert.ok(Number.isFinite(bits), `bits was ${bits}`);
  const text = app.formatCrackTime(app.crackTimeSeconds(bits, 1e11));
  assert.doesNotMatch(text, /NaN|Infinity/, text);
  assert.match(text, /centuries/);
});

test('a pasted novel does not hang the page', () => {
  const { app } = loadApp();
  const started = process.hrtime.bigint();
  app.estimatePasswordStrength('Qw3rty!'.repeat(600));   // 4200 characters
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(ms < 500, `took ${ms.toFixed(0)}ms; the analysis window is supposed to cap this`);
});

test('the panel repaints on a language switch', () => {
  // The rating and crack times are built in JavaScript, so they are invisible to
  // the [data-i18n] loop and used to stay in the previous language until the
  // user typed another character.
  const { app, dom } = loadApp();
  const input = dom.getById('passInput');
  const rating = dom.getById('entropyRatingText');
  const gpu = dom.getById('crackTimeGpu');

  input.value = 'Tr0ub4dor&3xK9';

  app.setLanguage('en');
  const englishRating = rating.textContent;
  const englishTime = gpu.textContent;
  assert.doesNotMatch(englishRating, /[一-鿿]/, englishRating);

  app.setLanguage('zh-TW');
  assert.notEqual(rating.textContent, englishRating, 'the rating did not follow the language');
  assert.notEqual(gpu.textContent, englishTime, 'the crack time did not follow the language');
  assert.match(rating.textContent + gpu.textContent, /[一-鿿]/);
});

test('an empty field shows a placeholder rather than a fabricated 0s', () => {
  const { app, dom } = loadApp();
  dom.getById('passInput').value = '';
  app.setLanguage('en');
  assert.equal(dom.getById('crackTimeGpu').textContent, '—');
  assert.equal(dom.getById('crackTimeCloud').textContent, '—');
  assert.equal(dom.getById('entropyRatingText').textContent, 'None');
  assert.equal(dom.getById('entropyBitsText').textContent, '0 bits');
  assert.equal(dom.getById('passCharacterCount').textContent, 0);
});

test('the meter width and character count track the input', () => {
  const { app, dom } = loadApp();
  dom.getById('passInput').value = 'Tr0ub4dor&3xK9';
  app.renderPasswordStrength();
  assert.equal(dom.getById('passCharacterCount').textContent, 14);
  assert.match(dom.getById('entropyBitsText').textContent, /^\d+\.\d bits$/);
  const width = parseInt(dom.getById('entropyBar').style.width, 10);
  assert.ok(width > 0 && width <= 100, `bar width was ${dom.getById('entropyBar').style.width}`);
});

test('no hardcoded crack-time string survives in the source', () => {
  const source = readSource();
  for (const stale of ['4.2 分鐘', '18.4 年', '3,400+ 世紀', '120+ 世紀', '< 0.01 秒']) {
    assert.ok(!source.includes(stale),
      `${stale} is a fixed string that ignored the actual score`);
  }
});

test('no quantum-resistance claim survives anywhere in the site', () => {
  // SHA-256 preimage resistance is not what a password strength meter measures,
  // and no consumer hardware in the crack-time figures is quantum.
  const files = [
    { f: 'app.js', body: readSource() },
    { f: 'index.html', body: fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8') }
  ];
  for (const { f, body } of files) {
    assert.ok(!/Quantum Resistant/i.test(body), `${f} still claims quantum resistance`);
    assert.ok(!body.includes('量子抗性'), `${f} still claims quantum resistance`);
    assert.ok(!/quantum cracking/i.test(body), `${f} still describes quantum cracking hardware`);
  }
});

test('the disclosure states the attacker model the numbers assume', () => {
  const { app } = loadApp();
  for (const lang of ['en', 'zh-TW']) {
    const note = app.TRANSLATIONS[lang].notePassword;
    assert.ok(/bcrypt|Argon2/i.test(note), `${lang} notePassword should say a slow hash changes the answer`);
    assert.ok(/offline|離線/.test(note), `${lang} notePassword should say the attack is offline`);
  }
});

test('the guess rate is stated on the labels, not left to the reader', () => {
  const { app } = loadApp();
  for (const lang of ['en', 'zh-TW']) {
    const dictionary = app.TRANSLATIONS[lang];
    assert.match(dictionary.p2GpuCluster, /10\^11/, `${lang} p2GpuCluster must state the rate`);
    assert.match(dictionary.p2CloudBotnet, /10\^13/, `${lang} p2CloudBotnet must state the rate`);
  }
});
