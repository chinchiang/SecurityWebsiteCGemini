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

// Same idea for markup, but shared: test/presentation.test.js strips the same
// file for the same reason. See the helper for why it is a scanner and not a
// regex. The test below stays here, next to the guards that depend on it.
const { stripHtmlComments } = require('./helpers/markup.js');

const MARKUP = stripHtmlComments(HTML);

test('stripHtmlComments leaves no comment text for a guard to read', () => {
  // Two guards below decide what index.html "still contains" from this output,
  // so a stripper that lets prose through quietly weakens both of them.
  const cases = [
    ['<a><!-- style="x" --><b>', '<a><b>', 'a comment between elements'],
    ['<a><!-- p --><!-- q --><b>', '<a><b>', 'adjacent comments'],
    ['<a><!-- outer <!-- inner --><b>', '<a><b>', 'a second <!-- inside a comment'],
    ['<a><!-- one --> <!-- two', '<a> ', 'an unterminated comment ends the document'],
    // HTML's abrupt-closing rule would end this comment at the `>`. Reading it
    // as unterminated strips more than a browser would, never less, which is the
    // safe direction for something a guard then searches.
    ['<a><!--><b>', '<a>', 'an abrupt <!-->'],
    ['<a><b>', '<a><b>', 'markup with no comment at all']
  ];

  for (const [input, expected, why] of cases) {
    assert.equal(stripHtmlComments(input), expected, why);
  }

  // The property that actually matters, stated directly.
  for (const [input, , why] of cases) {
    assert.doesNotMatch(stripHtmlComments(input), /<!--/, `residual <!-- after ${why}`);
  }
});

test('no inline event handler attributes anywhere', () => {
  // Every one of these would force script-src 'unsafe-inline' in a CSP.
  const inHtml = [...HTML.matchAll(/\son[a-z]+\s*=\s*["']/gi)].map(m => m[0].trim());
  assert.deepEqual(inHtml, [], 'index.html must bind events from app.js');

  const inJs = [...stripJsComments(JS).matchAll(/\son[a-z]+\s*=\s*["']/gi)].map(m => m[0].trim());
  assert.deepEqual(inJs, [], 'rendered templates must not emit inline handlers');
});

test('a Content-Security-Policy is declared before anything it governs', () => {
  const head = HTML.slice(0, HTML.indexOf('</head>'));
  const meta = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"\s*>/.exec(head);
  assert.ok(meta, 'a <meta http-equiv="Content-Security-Policy"> belongs in <head>');

  // A policy that appears after a subresource does not govern that subresource,
  // so position is part of the guarantee, not a style preference.
  const firstSubresource = HTML.search(/<(?:link|script|img|iframe|source)\b/i);
  assert.ok(meta.index < firstSubresource,
    'the policy must precede the first element that fetches something');

  const directives = new Map(
    meta[1].split(';').map(d => d.trim()).filter(Boolean).map(d => {
      const [name, ...values] = d.split(/\s+/);
      return [name, values];
    })
  );

  // Nothing is fetched that this repository does not ship, so everything a
  // directive does not name explicitly should fall through to a closed default.
  assert.deepEqual(directives.get('default-src'), ["'none'"],
    "default-src 'none' is what makes the unnamed directives safe");

  // The reason the inline onsubmit/onclick attributes were removed in 14f8abd.
  // Putting either keyword back would hand an injected string a way to execute.
  const scriptSrc = directives.get('script-src') || [];
  assert.deepEqual(scriptSrc, ["'self'"], "script-src must stay exactly 'self'");
  for (const keyword of ["'unsafe-inline'", "'unsafe-eval'"]) {
    assert.equal(scriptSrc.includes(keyword), false, `script-src must not allow ${keyword}`);
  }

  assert.deepEqual(directives.get('base-uri'), ["'none'"],
    'base-uri must be closed so injected markup cannot re-root every relative URL');

  // All four forms preventDefault(); a submission that navigates is a bug.
  assert.deepEqual(directives.get('form-action'), ["'none'"], "form-action must be 'none'");

  // Silently ignored in a meta policy. Naming it would imply a clickjacking
  // protection the page does not have; that needs a response header.
  assert.equal(directives.has('frame-ancestors'), false,
    'frame-ancestors does nothing in a <meta> policy — do not imply otherwise');
});

test('the Content-Security-Policy permits everything index.html actually loads', () => {
  const meta = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"\s*>/.exec(HTML);
  assert.ok(meta, 'the policy exists');
  const policy = meta[1];

  // script-src 'self' blocks an inline block as surely as an inline attribute,
  // and the failure is silent: the page simply loses that behaviour.
  const inlineScripts = [...MARKUP.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].map(m => m[0]);
  assert.deepEqual(inlineScripts, [], "an inline <script> cannot run under script-src 'self'");

  // The favicon is an inlined SVG, which is an image source as far as CSP is
  // concerned. Without data: the tab shows the browser's default icon.
  if (/\b(?:href|src)="data:image/i.test(MARKUP)) {
    assert.match(policy, /img-src[^;]*\bdata:/,
      'index.html inlines an image as a data: URI, so img-src must allow data:');
  }

  // The concession is load-bearing only while the markup carries style="".
  // If this branch ever stops running, style-src can be tightened to 'self'.
  if (/\sstyle="/.test(MARKUP)) {
    assert.match(policy, /style-src[^;]*'unsafe-inline'/,
      "inline style attributes require 'unsafe-inline' in style-src");
  }
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

// Comments stripped: the block above the social tags discusses `<title>` and
// `<meta name="description">` by name, and the extraction below would otherwise
// read the prose about a tag instead of the tag.
const HEAD = MARKUP.slice(0, MARKUP.indexOf('</head>'));

/** The content of a <meta> in the head, by property= or name=. */
const meta = key => {
  const m = new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`).exec(HEAD);
  return m ? m[1] : null;
};

test('nothing that travels with the link advertises a live service', () => {
  // These are what a search result, a chat unfurl and a browser tab show, none of
  // which render the in-page demo banner. The title and description previously
  // promised "live threat vectors" and a "Defense Portal", so the page read as an
  // operational security service everywhere except on the page itself — and the
  // og:* tags are the same claim again, to a different set of readers.
  const title = /<title>([^<]*)<\/title>/.exec(HEAD);
  assert.ok(title, '<title> exists');

  const travelling = [
    ['title', title[1]],
    ['description', meta('description')],
    ['og:title', meta('og:title')],
    ['og:description', meta('og:description')],
    ['og:site_name', meta('og:site_name')],
    ['og:image:alt', meta('og:image:alt')]
  ];

  for (const [what, text] of travelling) {
    assert.ok(text, `${what} is missing`);
    assert.doesNotMatch(text, /\blive\b|real-?time|即時|monitoring platform/i,
      `the ${what} claims a capability the site does not have`);
    assert.match(text, /demo|simulated|示範|模擬/i,
      `the ${what} must say that this is a demo with simulated data`);
  }
});

test('the social tags are one wording, not a second one to keep honest', () => {
  // A preview card is the copy most likely to be forgotten when the disclosure is
  // reworded, because nothing on the page displays it. Keeping it byte-identical
  // to the title and description means there is only ever one sentence to fix.
  const title = /<title>([^<]*)<\/title>/.exec(HEAD)[1];
  assert.equal(meta('og:title'), title, 'og:title has drifted from <title>');
  assert.equal(meta('og:description'), meta('description'),
    'og:description has drifted from the description meta');
});

test('the social tags use the attribute name their vocabulary requires', () => {
  // og:* is read from property= and twitter:* from name=. A swapped attribute is
  // not an error anywhere: the tag is simply ignored, and the card falls back to
  // whatever the client would have guessed.
  const offenders = [];
  let examined = 0;

  for (const [tag, attrName, key] of HEAD.matchAll(/<meta\s+(property|name)="((?:og|twitter):[\w:]+)"/g)) {
    examined++;
    const wanted = key.startsWith('og:') ? 'property' : 'name';
    if (attrName !== wanted) offenders.push(`${key} uses ${attrName}=, not ${wanted}=`);
  }

  assert.ok(examined >= 10, `only ${examined} social tags were examined`);
  assert.deepEqual(offenders, []);
});

/**
 * The pixel size out of a JPEG's frame header, so the declared og:image
 * dimensions are checked against the file rather than against another
 * declaration. A JPEG after the two-byte SOI is a run of segments: 0xFF, a
 * marker, then a 16-bit big-endian length that counts itself. The frame headers
 * SOF0–SOF15 (0xC0–0xCF, less the three markers in that range that are not frame
 * headers) carry height and then width, which is the order that catches a
 * transposed pair.
 */
function jpegSize(buf) {
  const NO_LENGTH = new Set([0x01, 0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9]);

  for (let i = 2; i + 9 < buf.length;) {
    if (buf[i] !== 0xFF) { i++; continue; }        // fill bytes between segments
    const marker = buf[i + 1];

    if (marker >= 0xC0 && marker <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += NO_LENGTH.has(marker) ? 2 : 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('no frame header found: is this a JPEG?');
}

test('the card points at a picture this repo actually publishes', () => {
  // Open Graph has no relative form, so these are the one place in the page that
  // hardcodes its own origin, and the one place that can silently come to name
  // someone else's file.
  const SITE = 'https://chinchiang.github.io/SecurityWebsiteCGemini/';
  const url = meta('og:url');
  const image = meta('og:image');

  assert.equal(url, SITE, 'og:url should be the page this repo publishes');
  assert.ok(image && image.startsWith(SITE),
    `og:image should live under ${SITE}, got ${image}`);

  // And the file has to be in the repo, or the card is a broken image.
  const relative = image.slice(SITE.length);
  assert.ok(fs.existsSync(path.join(ROOT, relative)), `${relative} is not in the repo`);
  assert.ok(MARKUP.includes(`src="${relative}"`),
    'the card should show the image the page itself shows');

  // The declared size is a promise about the bytes: a client that trusts a wrong
  // one reserves the wrong box and then reflows, or crops the card.
  const { width, height } = jpegSize(fs.readFileSync(path.join(ROOT, relative)));
  assert.equal(Number(meta('og:image:width')), width);
  assert.equal(Number(meta('og:image:height')), height);

  // Below 600x315 no client will render a large-image card at all, which is the
  // format twitter:card asks for.
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.ok(width >= 600 && height >= 315, `${width}x${height} is too small for a large card`);
});

test('both languages the page ships are declared to the unfurl', () => {
  // The toggle switches language at this one URL, so a card in either language is
  // a correct rendering of it.
  assert.equal(meta('og:locale'), 'zh_TW');
  assert.equal(meta('og:locale:alternate'), 'en_US');
  assert.match(MARKUP, /<html lang="zh-TW"/, 'og:locale should agree with the document');
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

test('every button says what kind of button it is', () => {
  // A <button> with no type attribute is type="submit". 9813238 fixed that for
  // index.html and stopped there, so the three buttons the quiz writes from a
  // template kept the default — including the option buttons, where pressing
  // Enter is the ordinary way to answer.
  //
  // The damage is latent rather than live: #quizWizard is a <div>, and the four
  // real forms all preventDefault. Latent is not fixed. The failure mode is a
  // submit that reloads the page and silently discards the audit in progress,
  // and it arrives the moment the wizard is moved inside a <form> — by which
  // point nothing connects the reload to a missing attribute three years old.
  const offenders = [];
  let examined = 0;

  for (const [source, where] of [[MARKUP, 'index.html'], [stripJsComments(JS), 'app.js templates']]) {
    for (const [tag] of source.matchAll(/<button\b[^>]*>/g)) {
      examined++;
      if (!/\btype="(?:button|submit|reset)"/.test(tag)) offenders.push(`${where}: ${tag.trim()}`);
    }
  }

  assert.ok(examined > 15, `only ${examined} buttons were examined`);
  assert.deepEqual(offenders, [], 'these default to type="submit"');
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
