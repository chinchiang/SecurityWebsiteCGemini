'use strict';

/**
 * The header scanner, the phishing inspector and the dark-web panel each built
 * their entire result inside the form's submit listener. Nothing in that markup
 * carries a data-i18n attribute, so setLanguage() could not touch it: after
 * pressing Scan and then switching language, the header, the score label, every
 * check description, the risk verdict and the breach records all stayed in the
 * previous language until the button was pressed again.
 *
 * Each tool is now state + render + bind, and setLanguage() calls all three
 * renders. These tests pin both directions: that a switch repaints the result,
 * and that repainting does not change the VERDICT — the two languages must
 * agree on the score, the risk tier and the breach outcome.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app.js');

/** Wire up a tool's form and input, then submit `value` and run the timers. */
function submit(app, dom, { form, input, value, init }) {
  const formEl = dom.getById(form);
  const inputEl = dom.getById(input);
  init();
  inputEl.value = value;
  formEl.dispatch('submit');
  return formEl;
}

/* ----------------------------- Tool 1: headers ---------------------------- */

test('a header scan result follows a language switch', () => {
  const { app, dom, flushTimers } = loadApp();
  const grid = dom.getById('headerChecksGrid');
  const label = dom.getById('headerScoreLabel');

  app.setLanguage('zh-TW');
  submit(app, dom, {
    form: 'headerScanForm', input: 'domainInput',
    value: 'example.com', init: () => app.initHeaderScanner()
  });
  flushTimers();

  assert.match(grid.innerHTML, /作用：強制瀏覽器僅以 HTTPS 連線/, 'Chinese descriptions missing');
  assert.match(label.textContent, /示範值/);

  app.setLanguage('en');
  assert.match(grid.innerHTML, /forces browsers to connect over HTTPS only/,
    'the switch left the check descriptions in Chinese');
  assert.doesNotMatch(grid.innerHTML, /作用：/, 'Chinese descriptions should be gone');
  assert.match(label.textContent, /DEMO VALUE/);
});

test('the header score is identical in both languages', () => {
  const { app, dom, flushTimers } = loadApp();
  const scoreNum = dom.getById('headerScoreNumber');
  const grid = dom.getById('headerChecksGrid');

  app.setLanguage('en');
  submit(app, dom, {
    form: 'headerScanForm', input: 'domainInput',
    value: 'my-bank.example', init: () => app.initHeaderScanner()
  });
  flushTimers();

  const inEnglish = scoreNum.textContent;
  assert.equal(inEnglish, '96 / 100', 'the "bank" branch of the illustrative grade');

  app.setLanguage('zh-TW');
  // Both halves matter. Without the first, this test passes on a build that
  // never repaints at all — the score is trivially unchanged when nothing
  // re-renders. Without the second, a repaint is free to recompute a different
  // number for the same domain.
  assert.match(grid.innerHTML, /作用：/, 'the panel did not repaint');
  assert.equal(scoreNum.textContent, inEnglish,
    'the score is recomputed on render, so it must not drift between languages');
});

test('the header panel stays hidden until a scan has been run', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('headerResultsContainer');

  app.setLanguage('en');
  app.setLanguage('zh-TW');
  assert.equal(container.style.display, 'none',
    'a language switch must not reveal a result the visitor never asked for');
  assert.equal(dom.getById('headerChecksGrid').innerHTML, '');
});

test('an empty domain neither renders nor records state', () => {
  const { app, dom, flushTimers } = loadApp();
  // index.html ships the container with an inline display:none, and a scan that
  // never happened must leave it that way.
  const container = dom.getById('headerResultsContainer');
  container.style.display = 'none';

  submit(app, dom, {
    form: 'headerScanForm', input: 'domainInput',
    value: '   ', init: () => app.initHeaderScanner()
  });
  flushTimers();

  assert.equal(app.headerScanDomain, '');
  assert.equal(container.style.display, 'none');
  assert.equal(dom.getById('headerChecksGrid').innerHTML, '');
});

/* ---------------------------- Tool 3: phishing ---------------------------- */

test('a phishing verdict follows a language switch', () => {
  const { app, dom } = loadApp();
  const results = dom.getById('phishingResults');

  app.setLanguage('zh-TW');
  submit(app, dom, {
    form: 'phishingForm', input: 'phishingUrlInput',
    value: 'http://login-paypal-verify.top/signin', init: () => app.initPhishingInspector()
  });

  assert.match(results.innerHTML, /網址拆解分析/);
  assert.match(results.innerHTML, /高風險極危險/);

  app.setLanguage('en');
  assert.match(results.innerHTML, /URL Breakdown/, 'the switch left the panel in Chinese');
  assert.match(results.innerHTML, /HIGH DANGER/);
  assert.doesNotMatch(results.innerHTML, /網址拆解分析/);
});

test('the risk tier and its colour are language-independent', () => {
  // The tier used to BE the translated display string, and the colour was chosen
  // by substring-matching it for 'HIGH' or '高'. Rewording either translation
  // would have turned every high-risk verdict amber with nothing to catch it.
  const { app, dom } = loadApp();
  const results = dom.getById('phishingResults');

  app.setLanguage('en');
  submit(app, dom, {
    form: 'phishingForm', input: 'phishingUrlInput',
    value: 'http://192.168.1.1/login', init: () => app.initPhishingInspector()
  });

  assert.equal(app.phishingFindings.tier, 'high');
  assert.match(results.innerHTML, /var\(--accent-rose\)/);

  app.setLanguage('zh-TW');
  assert.equal(app.phishingFindings.tier, 'high', 'the switch must not re-derive the verdict');
  assert.match(results.innerHTML, /var\(--accent-rose\)/, 'the high-risk colour was lost');
});

test('inspectUrl grades the documented heuristics', () => {
  const { app } = loadApp();
  const tierOf = url => app.inspectUrl(new URL(url)).tier;

  assert.equal(tierOf('https://example.com/'), 'low');
  assert.equal(tierOf('http://1.2.3.4/'), 'high', 'a raw IP host');
  assert.equal(tierOf('http://login-paypal.xyz/'), 'high', 'a keyword plus a suspicious TLD');
  assert.equal(tierOf('https://accounts.google.com/'), 'suspicious',
    'a known false positive, disclosed in notePhishing rather than hidden');
  assert.equal(tierOf('https://a-b-c-d.example.net/'), 'suspicious', 'hyphen density alone');
});

test('every phishing tier has a translation and a distinct colour', () => {
  const { app } = loadApp();
  const tiers = Object.values(app.PHISHING_TIERS);
  assert.equal(tiers.length, 3);

  for (const lang of ['zh-TW', 'en']) {
    for (const { key } of tiers) {
      assert.ok(app.TRANSLATIONS[lang][key], `${lang}.${key} is missing`);
    }
  }
  assert.equal(new Set(tiers.map(t => t.colour)).size, 3, 'each tier needs its own colour');
});

// The two escaping tests below pass on the pre-refactor code as well: it escaped
// correctly, it just never rendered a second time. They are forward guards, kept
// because moving the interpolation into a function called on every language
// switch is exactly the kind of change that loses an escapeHtml call.
test('a hostile hostname is escaped on every render, not just the first', () => {
  const { app, dom } = loadApp();
  const results = dom.getById('phishingResults');

  // new URL() permits `"` inside a hostname, so the parsed host is not safe.
  submit(app, dom, {
    form: 'phishingForm', input: 'phishingUrlInput',
    value: 'http://ex"onmouseover="alert(1)/', init: () => app.initPhishingInspector()
  });

  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    // The assertion is about the quote, not the word: `onmouseover=` survives as
    // inert text, and that is fine. What must not survive is the `"` that would
    // close the surrounding attribute and turn the rest into one.
    assert.doesNotMatch(results.innerHTML, /ex"/,
      `the hostname reached the markup unescaped in ${lang}`);
    assert.match(results.innerHTML, /ex&quot;onmouseover=&quot;alert\(1\)/,
      `the hostname should be present but escaped in ${lang}`);
  }
});

test('an unparseable URL leaves the panel untouched', () => {
  const { app, dom } = loadApp();

  submit(app, dom, {
    form: 'phishingForm', input: 'phishingUrlInput',
    value: 'http://', init: () => app.initPhishingInspector()
  });

  assert.equal(app.phishingFindings, null);
  assert.equal(dom.getById('phishingResults').innerHTML, '');
});

/* ---------------------------- Tool 4: dark web ---------------------------- */

test('a dark-web result follows a language switch', () => {
  const { app, dom, flushTimers } = loadApp();
  const results = dom.getById('darkwebResults');

  app.setLanguage('zh-TW');
  submit(app, dom, {
    form: 'darkwebForm', input: 'darkwebEmailInput',
    value: 'admin@example.com', init: () => app.initDarkWebChecker()
  });
  flushTimers();

  assert.match(results.innerHTML, /示範情境：虛構的 2 筆外洩紀錄/);

  app.setLanguage('en');
  assert.match(results.innerHTML, /SAMPLE SCENARIO: 2 FICTIONAL RECORDS/,
    'the switch left the breach records in Chinese');
  assert.doesNotMatch(results.innerHTML, /示範情境/);
});

test('the breach verdict is identical in both languages', () => {
  const { app, dom, flushTimers } = loadApp();
  const results = dom.getById('darkwebResults');

  // Odd length and no keyword: the stub's "clean" branch.
  submit(app, dom, {
    form: 'darkwebForm', input: 'darkwebEmailInput',
    value: 'ab@ex.io', init: () => app.initDarkWebChecker()
  });
  flushTimers();

  const clean = app.darkwebIsBreached(app.darkwebQuery);
  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    assert.equal(app.darkwebIsBreached(app.darkwebQuery), clean,
      'the verdict must be a pure function of the query, not of the language');
    assert.match(results.innerHTML, /demo-note demo-note-inline/,
      `the simulated-data notice is missing in ${lang}`);
  }
});

test('the dark-web query is escaped on every render', () => {
  const { app, dom, flushTimers } = loadApp();
  const results = dom.getById('darkwebResults');

  submit(app, dom, {
    form: 'darkwebForm', input: 'darkwebEmailInput',
    value: '<img src=x onerror=alert(1)>', init: () => app.initDarkWebChecker()
  });
  flushTimers();

  for (const lang of ['en', 'zh-TW']) {
    app.setLanguage(lang);
    // As above: `onerror=` as inert text is harmless; an unescaped `<` is not.
    assert.doesNotMatch(results.innerHTML, /<img/, `the query reached the markup in ${lang}`);
    assert.match(results.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/,
      `the query should be present but escaped in ${lang}`);
  }
});

test('the dark-web panel stays hidden until a search has been run', () => {
  const { app, dom } = loadApp();
  app.setLanguage('en');
  assert.equal(dom.getById('darkwebResults').style.display, 'none');
  assert.equal(dom.getById('darkwebResults').innerHTML, '');
});
