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
  const ALLOWED = ['fonts.googleapis.com'];

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
