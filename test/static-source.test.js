'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const HTML = read('index.html');
const CSS = read('styles.css');
const JS = read('app.js');

/** Strip // and /* *\/ comments so guards match code, not prose about code. */
function stripJsComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');
}

test('no inline event handler attributes anywhere', () => {
  // Every one of these would force script-src 'unsafe-inline' in a CSP.
  const inHtml = [...HTML.matchAll(/\son[a-z]+\s*=\s*["']/gi)].map(m => m[0].trim());
  assert.deepEqual(inHtml, [], 'index.html must bind events from app.js');

  const inJs = [...stripJsComments(JS).matchAll(/\son[a-z]+\s*=\s*["']/gi)].map(m => m[0].trim());
  assert.deepEqual(inJs, [], 'rendered templates must not emit inline handlers');
});

test('the site makes no network requests, as the demo banner claims', () => {
  const code = stripJsComments(JS);
  for (const api of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'import(']) {
    assert.equal(code.includes(api), false,
      `${api} contradicts the disclosure that no external service is contacted`);
  }
});

test('third-party subresources are limited to a known allow-list', () => {
  // Every origin the browser is told to FETCH from. Footer hyperlinks are not
  // subresources and are excluded. Adding an origin here should be a conscious
  // supply-chain decision, which is the point of failing this test by default.
  //
  // The list is EMPTY, and that is the whole point: dropping the Google Fonts
  // @import left the page with no third-party subresource at all, so nothing
  // outside this repository can change what a visitor executes. That is also
  // the precondition for a Content-Security-Policy without a font/style
  // exemption. Do not add an entry here to make a failure go away.
  const ALLOWED = [];

  const origins = new Set();
  for (const [source, name] of [[CSS, 'styles.css'], [HTML, 'index.html']]) {
    const importRe = /@import\s+url\(["']?(https?:\/\/[^"')]+)/g;
    const linkRe = /<(?:link|script|img|iframe|source)\b[^>]*?(?:href|src)\s*=\s*["'](https?:\/\/[^"']+)/gi;
    for (const re of [importRe, linkRe]) {
      for (const m of source.matchAll(re)) origins.add(new URL(m[1]).host + ` (${name})`);
    }
  }

  const unexpected = [...origins].filter(o => !ALLOWED.some(a => o.startsWith(a)));
  assert.deepEqual(unexpected, [], 'unexpected third-party origin');
});

test('external links are not exposed to reverse tabnabbing', () => {
  const anchors = [...HTML.matchAll(/<a\b[^>]*>/gi)].map(m => m[0]);
  const offenders = anchors.filter(
    a => /target\s*=\s*["']_blank["']/i.test(a) && !/rel\s*=\s*["'][^"']*noopener/i.test(a)
  );
  assert.deepEqual(offenders, [], 'target="_blank" requires rel="noopener"');
});

test('app.js parses and declares no duplicate top-level function', () => {
  const names = [...JS.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const seen = new Set();
  const duplicates = names.filter(n => (seen.has(n) ? true : (seen.add(n), false)));
  assert.deepEqual(duplicates, [], 'a later declaration would silently shadow an earlier one');
});

test('no function is called that is never declared', () => {
  // Catches the class of breakage from deleting a function but leaving a call
  // site behind (e.g. initAuditQuiz() after the quiz refactor).
  const code = stripJsComments(JS);
  const declared = new Set([
    ...[...code.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]),
    ...[...code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g)].map(m => m[1])
  ]);

  // Calls to bare `initSomething()` / `renderSomething()` are ours by convention.
  const called = new Set(
    [...code.matchAll(/(?:^|[^.\w$])((?:init|render|show|handle|bind|update|draw|animate)[A-Za-z0-9_$]*)\s*\(/g)]
      .map(m => m[1])
  );

  const undeclared = [...called].filter(n => !declared.has(n));
  assert.deepEqual(undeclared, [], 'call sites with no matching declaration');
});

test('every render function is invoked from setLanguage', () => {
  // The recurring bug in this codebase: content built in JavaScript rather than
  // behind a data-i18n attribute stays in the previous language after a switch,
  // because setLanguage() has no way to reach it. It has now happened to the
  // quiz, the CVE list, the header scanner, the phishing inspector and the
  // dark-web panel. This is the structural guard against the next one.
  const code = stripJsComments(JS);

  const setLang = /function setLanguage\(lang\) \{[\s\S]*?\n\}/.exec(code);
  assert.ok(setLang, 'setLanguage(lang) should be a top-level function');

  const renders = [...code.matchAll(/^function (render[A-Za-z0-9_$]*)\s*\(/gm)].map(m => m[1]);
  assert.ok(renders.length >= 8, `expected a render function per tool, found ${renders.length}`);

  const missing = renders.filter(name => !setLang[0].includes(`${name}()`));
  assert.deepEqual(missing, [],
    'a render function setLanguage does not call will be left in the previous language');
});

test('localStorage is only touched inside the guarded storage helper', () => {
  // Access THROWS, rather than returning null, in Safari private browsing and
  // under "block all cookies". The first such read used to be the opening
  // statement of app.js, so it took the whole page down before anything bound.
  const code = stripJsComments(JS);

  const helper = /const storage = \{[\s\S]*?\n\};/.exec(code);
  assert.ok(helper, 'the storage helper should exist');
  assert.match(helper[0], /try \{[\s\S]*catch/, 'and it should be the thing doing the catching');

  const elsewhere = code.replace(helper[0], '');
  assert.doesNotMatch(elsewhere, /\blocalStorage\b/,
    'unguarded localStorage access — route it through storage.get / storage.set');
});

test('no user-facing message is hardcoded in a template', () => {
  // Failure and status paths translate too. These are the strings that were left
  // in English when the rest of the UI was localised.
  const code = stripJsComments(JS);
  for (const phrase of ['Error computing hash', 'Switched to ${newTheme} mode']) {
    assert.equal(code.includes(phrase), false, `${phrase} belongs in TRANSLATIONS`);
  }
});

test('the tab title and social description do not advertise a live service', () => {
  // These two travel: they are what a search result, a chat unfurl and a browser
  // tab show, none of which render the in-page demo banner. They previously
  // promised "live threat vectors" and a "Defense Portal", so the page read as an
  // operational security service everywhere except on the page itself.
  const head = HTML.slice(0, HTML.indexOf('</head>'));
  const title = /<title>([^<]*)<\/title>/.exec(head);
  const desc = /<meta\s+name="description"\s+content="([^"]*)"/.exec(head);

  assert.ok(title, '<title> exists');
  assert.ok(desc, 'a description meta tag exists');

  for (const [what, text] of [['title', title[1]], ['description', desc[1]]]) {
    assert.doesNotMatch(text, /\blive\b|real-?time|即時|monitoring platform/i,
      `the ${what} claims a capability the site does not have`);
    assert.match(text, /demo|simulated|示範|模擬/i,
      `the ${what} must say that this is a demo with simulated data`);
  }
});

test('index.html tags are balanced for the containers the app writes into', () => {
  const count = (re) => (HTML.match(re) || []).length;
  assert.equal(count(/<div\b/g), count(/<\/div>/g), '<div> balance');
  assert.equal(count(/<section\b/g), count(/<\/section>/g), '<section> balance');
  assert.equal(count(/<aside\b/g), count(/<\/aside>/g), '<aside> balance');
  assert.equal(count(/<form\b/g), count(/<\/form>/g), '<form> balance');
  assert.equal(count(/<main\b/g), count(/<\/main>/g), '<main> balance');
});

test('every element app.js writes into exists in index.html', () => {
  const ids = new Set([...HTML.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  // Ids created by a render live inside a template string, not in index.html.
  const renderedIds = new Set([...JS.matchAll(/\bid="([^"$]+)"/g)].map(m => m[1]));

  const looked = [...JS.matchAll(/getElementById\(\s*'([^']+)'\s*\)/g)].map(m => m[1]);
  const missing = [...new Set(looked)].filter(id => !ids.has(id) && !renderedIds.has(id));
  assert.deepEqual(missing, [], 'getElementById targets present in neither index.html nor a template');
});

test('the toast container is announced to assistive technology', () => {
  const match = /<div[^>]*id="toastContainer"[^>]*>/.exec(HTML);
  assert.ok(match, 'toast container exists');
  assert.match(match[0], /role="status"/);
  assert.match(match[0], /aria-live="polite"/);
});

test('the simulated-data banner is present and rendered before the tools', () => {
  const bannerAt = HTML.indexOf('class="demo-banner"');
  const mainAt = HTML.indexOf('<main');
  assert.notEqual(bannerAt, -1, 'demo banner exists');
  assert.ok(bannerAt < mainAt, 'banner must precede <main> so it is seen first');
  assert.match(HTML.slice(bannerAt, bannerAt + 400), /data-i18n="demoBanner"/);
});

test('every tool panel carries a disclosure note', () => {
  const notes = (HTML.match(/class="demo-note"/g) || []).length;
  assert.ok(notes >= 5, `expected a note per tool panel plus the CVE section, found ${notes}`);
});

test('every test file is listed in the npm test script', () => {
  // The script names files explicitly rather than passing a glob, because glob
  // expansion in `node --test` is not available on every supported Node
  // version. This guard is what keeps that list from going stale.
  const pkg = JSON.parse(read('package.json'));
  const files = fs.readdirSync(path.join(ROOT, 'test'))
    .filter(f => f.endsWith('.test.js'))
    .sort();

  const missing = files.filter(f => !pkg.scripts.test.includes(`test/${f}`));
  assert.deepEqual(missing, [], 'add these to the "test" script in package.json');
});
