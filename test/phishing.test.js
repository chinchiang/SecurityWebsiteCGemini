'use strict';

/**
 * The URL inspector's heuristics used to be three: a raw-IP host, a hyphen
 * count, and a substring search for nine keywords across the whole host. That
 * last one is why accounts.google.com read as suspicious, and it missed every
 * attack that does not spell its lure in ASCII.
 *
 * These tests cover what replaced it: punycode decoding, mixed-script and
 * ASCII-lookalike detection, userinfo bait, an eTLD+1-aware brand check, and the
 * path/query. Several of them assert a NEGATIVE — that an ordinary domain, and a
 * legitimately non-Latin one, do not get flagged — because a checker that shouts
 * at everything is worth no more than one that shouts at nothing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app.js');

/** Inspect a URL string the way the submit handler does. */
function inspect(app, url) {
  return app.inspectUrl(new URL(app.hasExplicitScheme(url) ? url : `http://${url}`));
}

/** The signal ids raised for a URL. */
function signalsFor(app, url) {
  return inspect(app, url).signals.map(signal => signal.id);
}

/* ------------------------------ punycode decode --------------------------- */

test('punycodeDecodeLabel matches a reference implementation', () => {
  const { app } = loadApp();

  // Known answers, each cross-checked against Node's built-in punycode module
  // rather than transcribed from memory. The module is deprecated and this page
  // ships no dependencies, which is why the decoder in app.js exists at all —
  // but it is still the right thing to have checked these against.
  //
  // The first is RFC 3492's Arabic sample; the rest are the hosts the homograph
  // tests below rely on.
  assert.equal(app.punycodeDecodeLabel('xn--egbpdaj6bu4bxfgehfvwxn'), 'ليهمابتكلموشعربي؟');
  assert.equal(app.punycodeDecodeLabel('xn--pple-43d'), 'аpple', 'Cyrillic а + pple');
  assert.equal(app.punycodeDecodeLabel('xn--80ak6aa92e'), 'аррӏе', 'apple, entirely in Cyrillic');
  assert.equal(app.punycodeDecodeLabel('xn--u9j1hkb2esd9693bo4b'), '日本のショップ');
  assert.equal(app.punycodeDecodeLabel('xn--d-uga0v4h'), 'łódź');
  assert.equal(app.punycodeDecodeLabel('xn--maji-zr8a'), 'ↆmaji');
});

test('a malformed punycode label is reported rather than thrown', () => {
  const { app } = loadApp();

  // '!' is not a base-36 digit; a bare prefix encodes nothing; a truncated
  // delta runs off the end of the input. None of these may throw, because the
  // caller treats a bad label as a finding and carries on.
  assert.equal(app.punycodeDecodeLabel('xn--!!!'), null);
  assert.equal(app.punycodeDecodeLabel('xn--'), null);
  assert.equal(app.punycodeDecodeLabel('xn--zzzzzzzzzzzzzzzzzzzzzzzz'), null,
    'a delta that runs past the last code point');

  // 'xn--a-' is not malformed punycode — it is a basic-only label, and decoding
  // it to 'a' is correct. It is invalid as an IDNA A-label, which is a different
  // rule and not this function's job.
  assert.equal(app.punycodeDecodeLabel('xn--a-'), 'a');

  const result = app.decodePunycodeHost('xn--!!!.example.com');
  assert.deepEqual(result.undecodable, ['xn--!!!']);
  assert.equal(result.decoded, 'xn--!!!.example.com', 'an undecodable label is left as-is');
});

test('decodePunycodeHost only touches the xn-- labels', () => {
  const { app } = loadApp();
  const result = app.decodePunycodeHost('www.xn--pple-43d.com');

  assert.equal(result.decoded, 'www.аpple.com');
  assert.equal(result.hadPunycode, true);
  assert.deepEqual(result.undecodable, []);

  const plain = app.decodePunycodeHost('www.example.com');
  assert.equal(plain.decoded, 'www.example.com');
  assert.equal(plain.hadPunycode, false);
});

/* --------------------------- scripts and lookalikes ----------------------- */

test('mixed-script detection follows UTS #39, not "any two scripts"', () => {
  const { app } = loadApp();
  const mixed = label => app.isMixedScriptLabel(app.scriptsIn(label));

  assert.equal(mixed('pаypal'), true, 'Latin + Cyrillic');
  assert.equal(mixed('paypaι'), true, 'Latin + Greek');

  assert.equal(mixed('paypal'), false, 'Latin alone');
  assert.equal(mixed('райпал'), false, 'Cyrillic alone is not mixed');
  assert.equal(mixed('日本のショップ'), false,
    'Japanese legitimately mixes Han, Hiragana and Katakana');
  assert.equal(mixed('漢字한글'), false, 'Korean legitimately mixes Han and Hangul');
});

test('confusableSkeleton separates attack lookalikes from ordinary diacritics', () => {
  const { app } = loadApp();

  const cyrillic = app.confusableSkeleton('аpple.com');
  assert.equal(cyrillic.skeleton, 'apple.com', 'the Cyrillic а reads as a');
  assert.deepEqual(cyrillic.crossScript, ['а'], 'and is reported as cross-script');

  // Polish is spelled with these. They still fold for the "renders as" display,
  // but they must not be treated as evidence of an attack.
  const polish = app.confusableSkeleton('łódź.pl');
  assert.equal(polish.skeleton, 'lodz.pl');
  assert.deepEqual(polish.crossScript, [], 'Latin diacritics are not an attack signal');
});

test('invisible and bidirectional characters are shown as code points', () => {
  const { app } = loadApp();

  // Rendered raw, an RLO would reorder this page's own text, not just the host.
  assert.equal(app.visualiseHost('evil‮moc.lapyap'), 'evil<U+202E>moc.lapyap');
  assert.equal(app.visualiseHost('pay​pal.com'), 'pay<U+200B>pal.com');
  assert.equal(app.visualiseHost('example.com'), 'example.com', 'ordinary hosts pass through');
});

/* ------------------------------- eTLD+1 ----------------------------------- */

test('registrableDomain handles multi-label suffixes and IP literals', () => {
  const { app } = loadApp();

  assert.equal(app.registrableDomain('www.example.com'), 'example.com');
  assert.equal(app.registrableDomain('example.com'), 'example.com');
  assert.equal(app.registrableDomain('pay.example.co.uk'), 'example.co.uk',
    'co.uk is a public suffix, so the eTLD+1 has three labels');
  assert.equal(app.registrableDomain('a.b.c.example.com.tw'), 'example.com.tw');
  assert.equal(app.registrableDomain('localhost'), 'localhost');

  // Taking the last two labels of an IP would report the eTLD+1 of 1.2.3.4
  // as "3.4", which then appeared in the panel as if it meant something.
  assert.equal(app.registrableDomain('1.2.3.4'), '1.2.3.4');
  assert.equal(app.registrableDomain('[::1]'), '[::1]');
});

test('isIpHost recognises both families, including obfuscated IPv4', () => {
  const { app } = loadApp();

  assert.equal(app.isIpHost('192.168.1.1'), true);
  assert.equal(app.isIpHost('[::1]'), true);
  assert.equal(app.isIpHost('example.com'), false);

  // The browser normalises a decimal or hexadecimal IPv4 back to dotted quad
  // before this code sees it, so the plain check is enough.
  assert.equal(new URL('http://3232235777/').hostname, '192.168.1.1');
  assert.equal(inspect(app, 'http://3232235777/').tier, 'high');
});

/* ------------------------------ the verdicts ------------------------------ */

test('a homograph domain is flagged, and named as the brand it imitates', () => {
  const { app } = loadApp();

  // Cyrillic а + "pple". The ASCII form is what new URL() hands over, so
  // nothing here is detectable without decoding first.
  const findings = inspect(app, 'https://аpple.com/');
  assert.equal(findings.host, 'xn--pple-43d.com');
  assert.equal(findings.displayHost, 'аpple.com');
  assert.equal(findings.tier, 'high');

  const ids = findings.signals.map(signal => signal.id);
  assert.ok(ids.includes('punycode'), 'the encoding itself is surfaced');
  assert.ok(ids.includes('mixedScript'), 'Latin + Cyrillic in one label');
  assert.ok(ids.includes('asciiLookalike'), 'it reads as ASCII');
  assert.ok(ids.includes('confusableBrand'), 'and what it reads as is apple.com');

  const lookalike = findings.signals.find(signal => signal.id === 'asciiLookalike');
  assert.equal(lookalike.data.skeleton, 'apple.com');
});

test('a whole-script homograph is caught even though nothing is mixed', () => {
  const { app } = loadApp();

  // Every letter is Cyrillic, so the mixed-script check cannot fire. The
  // skeleton is what gives it away.
  const findings = inspect(app, 'https://xn--80ak6aa92e.com/');
  const ids = findings.signals.map(signal => signal.id);

  assert.equal(findings.tier, 'high');
  assert.equal(ids.includes('mixedScript'), false, 'single-script by construction');
  assert.ok(ids.includes('asciiLookalike'));
  assert.ok(ids.includes('confusableBrand'));
});

test('userinfo bait is reported against the host the browser will use', () => {
  const { app } = loadApp();

  const findings = inspect(app, 'http://accounts.google.com@evil.top/signin');
  const userinfo = findings.signals.find(signal => signal.id === 'userinfo');

  assert.equal(findings.host, 'evil.top', 'the browser connects here');
  assert.ok(userinfo, 'the @ bait must be called out, not silently dropped');
  assert.equal(userinfo.data.user, 'accounts.google.com');
  assert.equal(findings.tier, 'high');
});

test('a brand in a subdomain of an unrelated domain is an impersonation', () => {
  const { app } = loadApp();

  const findings = inspect(app, 'https://paypal.com.evil.top/login');
  const brand = findings.signals.find(signal => signal.id === 'brandMismatch');

  assert.ok(brand);
  assert.equal(brand.data.brand, 'paypal');
  assert.equal(brand.data.registrable, 'evil.top',
    'the message must name who actually owns the domain');
  assert.equal(findings.tier, 'high');
});

test('a brand keyword on the brand\'s own domain raises nothing', () => {
  const { app } = loadApp();

  // The regression this whole rewrite was for. Every one of these is ordinary.
  const ordinary = [
    'https://accounts.google.com/',
    'https://mail.google.com/',
    'https://signin.live.com/',
    'https://github.com/anthropics',
    'https://support.apple.com/en-us/HT201220',
    'https://www.paypal.com/signin',

    // A country variant of a brand domain. Listing every ccTLD a brand uses is
    // hopeless, so the rule is that the registrable domain LEADS with the brand.
    'https://www.amazon.co.jp/dp/B000000',

    // Microsoft's own sign-in host. A substring search for 'microsoft' matched
    // 'microsoftonline' and called this a high-danger impersonation of Microsoft.
    'https://login.microsoftonline.com/common/oauth2/authorize',

    // Valve's own store, caught by the trusted-domain list rather than by the
    // leading-label rule: 'steampowered' does not equal 'steam'.
    'https://store.steampowered.com/app/1/',

    // Lure words in a subdomain are just subdomain names, which is why the lure
    // check is scoped to the registrable domain.
    'https://secure.bank.example.com/',
    'https://login.example.com/',

    'https://www.gov.uk/browse/benefits',
    'https://www.bbc.co.uk/news',
    'https://zh.wikipedia.org/wiki/資訊安全'
  ];

  for (const url of ordinary) {
    assert.deepEqual(signalsFor(app, url), [], `${url} should raise no signal`);
    assert.equal(inspect(app, url).tier, 'low');
  }
});

test('token matching still catches a brand welded to something else', () => {
  const { app } = loadApp();

  // The other half of the trade-off. Tokens split on anything that is not a
  // Latin letter, so digits and hyphens do not hide the brand — and the leading
  // label is compared whole, so paypal2024 is not read as paypal's own domain.
  for (const url of ['https://paypal2024.top/', 'https://paypal-secure.example.net/',
    'https://secure.paypal.example.net/', 'https://apple-id-verify.example.org/']) {
    const brand = inspect(app, url).signals.find(signal => signal.id === 'brandMismatch');
    assert.ok(brand, `${url} should be reported as an impersonation`);
  }

  // And the documented miss: a brand concatenated into a longer word is not a
  // token, so it is not found. Stated here so the limit is deliberate.
  assert.equal(
    inspect(app, 'https://mypaypalsupport.example.net/').signals
      .some(signal => signal.id === 'brandMismatch'),
    false,
    'a concatenation is a known miss of token matching, not a passing test by luck'
  );
});

test('a legitimate non-Latin domain is noted but not condemned', () => {
  const { app } = loadApp();

  // Polish and Japanese domains are IDNs, which is worth showing the visitor.
  // What they must not be is 'high' — that is the false-positive failure mode,
  // and it is the reason Latin diacritics are kept out of the lookalike map.
  for (const url of ['https://łódź.pl/', 'https://日本のショップ.jp/']) {
    const findings = inspect(app, url);
    assert.deepEqual(findings.signals.map(signal => signal.id), ['punycode'],
      `${url} should only be reported as an IDN`);
    assert.equal(findings.tier, 'suspicious', 'informational, not dangerous');
  }
});

test('the path and query are inspected, not just the host', () => {
  const { app } = loadApp();

  assert.ok(signalsFor(app, 'https://cdn.example.com/update/setup.exe').includes('dangerousFile'));
  assert.ok(signalsFor(app, 'https://example.com/files/invoice.zip').includes('dangerousFile'));
  assert.ok(signalsFor(app, 'https://example.com/?next=https://paypal.com/login').includes('embeddedUrl'));

  // Percent-encoded, because that is how a redirect target is actually passed.
  assert.ok(signalsFor(app, 'https://example.com/r?u=https%3A%2F%2Fpaypal.com%2F').includes('embeddedUrl'));

  assert.deepEqual(signalsFor(app, 'https://example.com/products/index.html'), [],
    'an ordinary path raises nothing');
});

test('a scheme that is not http(s) is a finding rather than a parse accident', () => {
  const { app } = loadApp();

  const findings = inspect(app, 'javascript:alert(1)');
  const scheme = findings.signals.find(signal => signal.id === 'scheme');

  assert.ok(scheme, 'javascript: must be flagged');
  assert.equal(scheme.data.scheme, 'javascript:');
  assert.equal(findings.tier, 'high');
});

test('a bare host beginning with "http" is not mistaken for a scheme', () => {
  const { app } = loadApp();

  // The old check was rawUrl.startsWith('http'), so httpbin.org was handed to
  // new URL() with no scheme and rejected as an invalid URL.
  assert.equal(app.hasExplicitScheme('httpbin.org'), false);
  assert.equal(app.hasExplicitScheme('httpd.apache.org'), false);
  assert.equal(app.hasExplicitScheme('localhost:8080'), false, 'that is a port, not a scheme');

  assert.equal(app.hasExplicitScheme('http://example.com'), true);
  assert.equal(app.hasExplicitScheme('HTTPS://example.com'), true);
  assert.equal(app.hasExplicitScheme('javascript:alert(1)'), true);

  assert.equal(inspect(app, 'httpbin.org').host, 'httpbin.org');
});

/* ------------------------------- the model -------------------------------- */

test('hyphen density is counted on the decoded host, not the encoding', () => {
  const { app } = loadApp();

  // xn--pple-43d.com contains three hyphens that punycode wrote, not the
  // attacker. Counting the encoded form invented a signal out of the encoding.
  const findings = inspect(app, 'https://аpple.com/');
  assert.equal(findings.hyphens, 0);
  assert.equal(findings.signals.map(signal => signal.id).includes('hyphens'), false);

  assert.equal(inspect(app, 'https://a-b-c-d.example.net/').hyphens, 3);
});

test('the score is the sum of the signal weights, and the tier follows it', () => {
  const { app } = loadApp();

  for (const url of ['https://example.com/', 'http://login-paypal.xyz/',
    'https://аpple.com/', 'https://a-b-c-d.example.net/']) {
    const findings = inspect(app, url);
    const expected = findings.signals.reduce(
      (total, signal) => total + app.phishingSignalWeight(signal), 0);

    assert.equal(findings.score, expected, `${url}: score must equal the weights`);

    const floor = app.PHISHING_TIER_FLOORS.find(entry => findings.score >= entry.min);
    assert.equal(findings.tier, floor.tier, `${url}: tier must follow the score`);
  }
});

test('every signal has a message in both languages', () => {
  const { app } = loadApp();
  const ids = Object.keys(app.PHISHING_SIGNALS);

  assert.ok(ids.length >= 10, `expected the full signal table, found ${ids.length}`);

  for (const lang of ['zh-TW', 'en']) {
    for (const id of ids) {
      const key = app.PHISHING_SIGNALS[id].key;
      assert.ok(app.TRANSLATIONS[lang][key], `${lang}.${key} is missing`);
    }
  }
});

test('a signal message leaves no placeholder unfilled in either language', () => {
  const { app } = loadApp();

  // Every URL below is chosen to raise a different signal, so between them they
  // exercise most of the templates. A '{host}' left on screen is the failure the
  // password panel already shipped once.
  const urls = [
    'http://1.2.3.4/', 'http://user@evil.top/', 'javascript:alert(1)',
    'https://аpple.com/', 'http://login-paypal.xyz/', 'https://a-b-c-d.example.net/',
    'https://example.com/setup.exe', 'https://example.com/?u=https://paypal.com/',
    'https://example.com:8443/'
  ];

  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    for (const url of urls) {
      for (const signal of inspect(app, url).signals) {
        const text = app.phishingSignalText(signal);
        assert.ok(text.length > 0, `${lang}: ${signal.id} rendered empty`);
        assert.doesNotMatch(text, /\{[a-z]+\}/,
          `${lang}: ${signal.id} left a placeholder in: ${text}`);
      }
    }
  }
});

// This one passes against the pre-rewrite app.js too — that code escaped
// correctly, it just had far less user input to escape. It is a forward guard,
// kept because the rewrite moved interpolation into phishingSignalText(), which
// is exactly the kind of move that loses an escapeHtml call.
test('a hostile value inside a signal message is escaped', () => {
  const { app, dom } = loadApp();

  // new URL() permits a double quote in a hostname, and the userinfo message
  // interpolates the username as well as the host.
  const form = dom.getById('phishingForm');
  const input = dom.getById('phishingUrlInput');
  app.initPhishingInspector();
  input.value = 'http://a"onmouseover="alert(1)@ex"ample.top/';
  form.dispatch('submit');

  const results = dom.getById('phishingResults');
  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    assert.doesNotMatch(results.innerHTML, /="alert\(1\)/,
      `an unescaped quote reached the markup in ${lang}`);
    assert.match(results.innerHTML, /&quot;/, `the value should survive escaped in ${lang}`);
  }
});

test('an invisible character in a host is flagged and never rendered raw', () => {
  const { app } = loadApp();

  // What this repository ships is the inspector, and it is duck-typed on a
  // parsed URL. Whether a runtime's parser hands the host over first is not
  // ours to assert: Node 22 rejects both the raw form (http://<RLO>evil…) and
  // its punycode equivalent (xn--evil-yd7a) under UTS #46, and Node 24 accepts
  // the punycode one. This test used to require the rejection, which pinned
  // the stricter parser, tested nothing in app.js, and turned a runner upgrade
  // into a red suite. A more permissive parser is the case the signal exists
  // for, so assert what happens when the host does reach the inspector.
  for (const hostname of ['evil‮.example.com', 'xn--evil-yd7a.example.com']) {
    const findings = app.inspectUrl({
      hostname,
      protocol: 'http:',
      username: '', password: '', port: '', pathname: '/', search: ''
    });

    const invisible = findings.signals.find(signal => signal.id === 'invisible');
    assert.ok(invisible, `the override must be reported for ${hostname}`);
    assert.equal(invisible.data.chars, 'U+202E');

    // The display path is the part that matters even when the signal is not
    // reachable: an RLO rendered raw reorders this page's own text, not just
    // the host, so it is replaced with its code point before it can reach
    // innerHTML.
    assert.equal(findings.displayHost, 'evil<U+202E>.example.com');
    assert.doesNotMatch(app.phishingSignalText(invisible), /‮/);
  }

  // On a parser that accepts it, the encoded form arrives as an ordinary ASCII
  // host; being recognised as punycode is the only thing that makes the RLO
  // inside it visible at all.
  const encoded = app.inspectUrl({
    hostname: 'xn--evil-yd7a.example.com',
    protocol: 'http:',
    username: '', password: '', port: '', pathname: '/', search: ''
  });
  assert.ok(encoded.signals.some(signal => signal.id === 'punycode'),
    'an encoded host must be decoded before it is judged');
});

test('the whole panel repaints on a language switch, signals included', () => {
  const { app, dom } = loadApp();
  const form = dom.getById('phishingForm');
  const input = dom.getById('phishingUrlInput');

  app.setLanguage('zh-TW');
  app.initPhishingInspector();
  input.value = 'http://accounts.google.com@paypal.secure-login.evil.top/verify';
  form.dispatch('submit');

  const results = dom.getById('phishingResults');
  const before = app.phishingFindings.score;

  assert.match(results.innerHTML, /註冊網域 \(eTLD\+1\)/, 'Chinese row label missing');
  assert.match(results.innerHTML, /誘餌/, 'Chinese signal text missing');
  assert.match(results.innerHTML, /加權分數/, 'Chinese score label missing');

  app.setLanguage('en');
  assert.match(results.innerHTML, /Registrable domain \(eTLD\+1\)/,
    'the switch left the row labels in Chinese');
  assert.match(results.innerHTML, /bait for the reader/, 'signal text stayed in Chinese');
  assert.match(results.innerHTML, /Weighted score/);
  assert.doesNotMatch(results.innerHTML, /註冊網域/);
  assert.doesNotMatch(results.innerHTML, /誘餌/);

  assert.equal(app.phishingFindings.score, before, 'a repaint must not re-derive the verdict');
});
