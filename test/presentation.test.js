'use strict';

/**
 * Motion the visitor did not ask for.
 *
 * Two animations ran forever — the pulse dot and the ticker — and the threat map
 * held an unconditional requestAnimationFrame loop. For a visitor with a
 * vestibular disorder the ticker is the worst of the three: a constant
 * horizontal drift at the top of the viewport, on every page view, with no
 * control to stop it. `prefers-reduced-motion` is how that visitor asks, and
 * nothing on the page was listening.
 *
 * It has since grown into the file for the stylesheet's other promises to a
 * visitor who is not looking at a desktop screen in the dark: the navigation
 * below 640px, the footer's claims, the printed page, and the fonts.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadApp } = require('./helpers/load-app.js');
const { stripHtmlComments } = require('./helpers/markup.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = read('styles.css');

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** The body of an at-rule, matched by counting braces rather than guessing. */
function atRuleBody(css, prelude) {
  const at = css.indexOf(prelude);
  if (at === -1) return null;

  let depth = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', at) + 1, i);
    }
  }
  return null;
}

/** Every `selector { … }` rule in a stylesheet fragment, comments stripped. */
function rules(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(m => ({ selector: m[1].trim(), body: m[2] }));
}

const REDUCED = atRuleBody(CSS, `@media ${REDUCE_QUERY}`);

test('the reduced-motion query is spelled the way browsers spell it', () => {
  // A typo here is silent in both directions: the block never matches, and no
  // browser or linter complains. Pinned as a literal in CSS and in app.js.
  assert.ok(REDUCED, `styles.css needs a @media ${REDUCE_QUERY} block`);
  assert.ok(read('app.js').includes(`'${REDUCE_QUERY}'`),
    `app.js must ask matchMedia for exactly '${REDUCE_QUERY}'`);
});

test('every animated selector is stilled under reduced motion', () => {
  // Structural rather than a list of today's animations: the next @keyframes
  // someone adds fails this test until it is given a reduced-motion answer.
  const outside = CSS.replace(REDUCED, '');
  const animated = rules(outside)
    .filter(r => /\banimation:/.test(r.body))
    .map(r => r.selector);

  assert.ok(animated.length >= 2, `expected some animated rules, found ${animated.length}`);

  const stilled = rules(REDUCED)
    .filter(r => /animation:\s*none/.test(r.body))
    .flatMap(r => r.selector.split(',').map(s => s.trim()));

  const missing = animated.filter(s => !stilled.includes(s));
  assert.deepEqual(missing, [], 'these keep animating for a visitor who asked for less motion');
});

test('nothing inside the reduced-motion block still runs forever', () => {
  assert.doesNotMatch(REDUCED, /\binfinite\b/,
    'an endless animation is the one kind reduced motion is most clearly about');
});

test('stopping the ticker does not take its content with it', () => {
  // .ticker-bar is `overflow: hidden; white-space: nowrap`, so `animation: none`
  // on its own parks the strip at translateX(0) and leaves the later headlines
  // off-screen with no way to reach them — the motion gone and the content too.
  const bar = rules(REDUCED).find(r => r.selector.split(',').some(s => s.trim() === '.ticker-bar'));
  assert.ok(bar, '.ticker-bar needs a reduced-motion rule, not just .ticker-content');
  assert.match(bar.body, /white-space:\s*normal/,
    'the headlines have to be allowed to wrap once they stop scrolling');
});

test('the dialog still closes instantly under reduced motion', () => {
  // The open/closed transition carries a deliberate 0.3s visibility delay so the
  // fade-out plays out. With the fade removed, that delay would leave a closed
  // dialog focusable for 300ms with nothing on screen to explain why.
  const overlay = rules(REDUCED).filter(r => /\.modal-overlay/.test(r.selector));
  assert.ok(overlay.length, '.modal-overlay needs a reduced-motion rule');
  assert.ok(overlay.some(r => /transition:\s*none/.test(r.body)),
    'drop the transition, or the visibility delay outlives the fade it was for');
});

/* ---- the canvas loop, which CSS cannot reach ---- */

/** Load app.js with a recording canvas and a known motion preference. */
function withCanvas(reduce) {
  const { app, dom, frames } = loadApp({ media: reduce ? { [REDUCE_QUERY]: true } : {} });
  const canvas = dom.addCanvas('threatCanvas');
  app.initThreatMapCanvas();
  return { app, dom, frames, canvas, calls: name => canvas.ctxCalls.filter(c => c.name === name) };
}

test('the threat map paints a still frame instead of looping', () => {
  const still = withCanvas(true);

  assert.equal(still.frames.requested, 0,
    'requestAnimationFrame was called: the map is still animating');

  // Stopped must not mean blank. The grid, the links between nodes and the nodes
  // themselves are all information; only the packets are motion.
  assert.ok(still.calls('clearRect').length >= 1, 'nothing was painted at all');
  assert.ok(still.calls('stroke').length > 10, 'the grid and node links are missing');
  assert.ok(still.calls('arc').length > 0, 'the nodes themselves are missing');
});

test('the threat map animates when no preference is expressed', () => {
  const moving = withCanvas(false);
  assert.equal(moving.frames.requested, 1, 'the loop should be started exactly once');

  // Nothing is painted until that first frame runs, so run it — and check the
  // loop asks for another, which is what makes it a loop rather than one frame.
  moving.frames.step();
  assert.equal(moving.frames.requested, 2, 'the loop stopped after a single frame');

  // The packets are the difference between the two renders, and the reason the
  // still frame leaves them out: frozen, they are eight dots sat on the nodes.
  const still = withCanvas(true);
  assert.ok(moving.calls('arc').length > still.calls('arc').length,
    'the animated frame should draw packets that the still frame does not');
});

test('turning the preference on mid-session stops the loop', () => {
  // Sampling it once at start-up would leave the animation running for the rest
  // of the visit, which is the case a visitor is most likely to hit: they turn
  // the setting on *because* something on the page is moving.
  const { dom, frames } = withCanvas(false);
  assert.equal(frames.requested, 1);

  dom.mediaQuery(REDUCE_QUERY).set(true);

  assert.deepEqual(frames.cancelled, [1], 'the pending frame should be cancelled');
  assert.equal(frames.requested, 1, 'and no new frame requested');
});

test('turning it back off starts the map moving again', () => {
  const { dom, frames } = withCanvas(true);
  assert.equal(frames.requested, 0);

  dom.mediaQuery(REDUCE_QUERY).set(false);
  assert.equal(frames.requested, 1, 'the loop never restarted');
});

test('a resize repaints the map while the loop is stopped', () => {
  // Setting canvas.width clears the canvas. With no loop running, nothing would
  // ever paint it again and the map would quietly go blank.
  const { dom, canvas, calls } = withCanvas(true);
  const before = calls('clearRect').length;

  canvas.parentElement.clientWidth = 400;
  dom.window.dispatch('resize');

  assert.equal(canvas.width, 400, 'the canvas should have been resized');
  assert.ok(calls('clearRect').length > before, 'the resized canvas was left blank');
});

test('the map survives a browser with no matchMedia', () => {
  // Some embedded webviews do not expose it, and this runs on load: an
  // unguarded call would take the whole page down before anything else bound.
  const { app, dom, frames } = loadApp({ matchMedia: 'missing' });
  dom.addCanvas('threatCanvas');

  app.initThreatMapCanvas();
  assert.equal(frames.requested, 1, 'with no way to ask, animate as before');
});

/* ---- the printed page ---- */

// Empty rather than null when the block is missing, so each guard below fails on
// its own assertion instead of on a TypeError from the shared parser.
const PRINT = atRuleBody(CSS, '@media print') || '';

/** Every selector the print block hides, flattened out of its comma lists. */
const printHides = () => rules(PRINT)
  .filter(r => /display:\s*none/.test(r.body))
  .flatMap(r => r.selector.split(',').map(s => s.trim()));

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
  const channels = [1, 3, 5]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('printing the report prints the report, not the whole page', () => {
  // The quiz's last screen offers to print or download "the assessment report".
  // window.print() printed the page: 7 sheets of navbar, ticker, threat map,
  // five sections of unrelated tooling and footer, with the report inside.
  assert.ok(PRINT, 'styles.css needs a @media print block');
  const hidden = printHides();

  // Hidden as a group with the printed one put back, rather than a list of the
  // other five, so a section added later cannot quietly join the printout.
  assert.ok(hidden.includes('main > section'), 'every section should start hidden');
  const shown = rules(PRINT)
    .find(r => r.selector.split(',').some(s => s.trim() === '#audit-calculator'));
  assert.ok(shown, '#audit-calculator needs putting back');
  assert.match(shown.body, /display:\s*block/);

  // The page furniture, none of which belongs on a printed report — and the two
  // controls inside the report that do nothing on paper.
  for (const sel of ['.skip-link', '.navbar', '.ticker-bar', '.demo-banner', '.footer',
    '.toast-container', '.modal-overlay', '#printReportBtn', '#restartQuizBtn']) {
    assert.ok(hidden.includes(sel), `${sel} would be printed`);
  }
});

test('the printed report is ink on paper, not white on white', () => {
  // Browsers omit background colours from a printout by default, so every colour
  // chosen against a dark surface lands on white paper. --text-primary is
  // #f8fafc: blank paper. Reading the fill operators out of the two PDFs shows
  // it — the pre-change printout drew text in `.9725 .9804 .9882 rg` on an
  // unpainted page, and that fill is absent from the printout now.
  //
  // Restating the palette is also the only fix available: the score is written
  // with an inline style="color: var(--accent-cyan)", which no stylesheet rule
  // may override, but which resolves through these variables.
  const palette = rules(PRINT).find(r => /:root/.test(r.selector));
  assert.ok(palette, 'the print block should restate the palette');
  assert.match(palette.selector, /\[data-theme="light"\]/,
    'the print palette has to beat the light theme too, not only the default one');

  const vars = new Map([...palette.body.matchAll(/(--[\w-]+):\s*([^;]+);/g)]
    .map(m => [m[1], m[2].trim()]));

  const paper = vars.get('--bg-dark');
  assert.ok(paper && luminance(paper) > 0.9, `--bg-dark should be paper white, got ${paper}`);

  let examined = 0;
  for (const [name, value] of vars) {
    if (!/^--(?:text|accent)-/.test(name)) continue;
    assert.match(value, /^#[0-9a-f]{6}$/i, `${name} should be a plain hex colour in print`);
    examined++;

    // The accents are not decoration here: the score tier is a colour, so it has
    // to survive as ink rather than as a pale wash.
    const floor = name.startsWith('--text-') ? 7 : 4.5;
    const ratio = contrast(value, paper);
    assert.ok(ratio >= floor,
      `${name} (${value}) is ${ratio.toFixed(1)}:1 on paper and needs ${floor}:1`);
  }
  assert.ok(examined >= 8, `only ${examined} print colours were examined`);
});

test('the disclosure is printed along with the report', () => {
  // A printed "security maturity assessment report" is exactly the artefact that
  // gets forwarded without the page around it, and the demo banner is not on the
  // paper. The note saying the scoring is a demonstration mapping to no
  // published framework is what has to travel with it.
  assert.equal(printHides().some(s => /\bdemo-note\b/.test(s)), false,
    'the print block must not hide the disclosure');

  const { app, dom } = loadApp();
  app.renderAuditQuiz();
  const html = dom.getById('quizWizard').innerHTML;
  const resultStep = html.slice(html.indexOf('id="quizResultStep"'));

  assert.ok(resultStep.length > 100, 'the result step should be part of the render');
  assert.match(resultStep, /class="demo-note/, 'the report itself should carry the note');
});

/* ---- navigation ---- */

// Comments stripped, because the markup explains itself: the comment next to the
// footer quotes the `<a href="#">` it replaced, and the dead-link guard below
// would otherwise find its own explanation and report it as the defect.
const HTML = stripHtmlComments(read('index.html'));

/* ---- the skip link ---- */

/** Every element in the body that a browser would stop on with Tab, in order. */
function tabStops(app) {
  // Derived from app.js's own selector rather than a second list of tags here:
  // the focus trap and this sweep have to agree on what a tab stop is.
  const tags = app.FOCUSABLE_SELECTOR.split(',')
    .map(s => s.trim())
    .filter(s => /^[a-z]/.test(s))
    .map(s => s.replace(/\[.*$/, ''));

  const body = HTML.slice(HTML.indexOf('<body'));
  const stops = [];
  for (const m of body.matchAll(new RegExp(`<(${tags.join('|')})\\b[^>]*>`, 'g'))) {
    // An <a> with no href is not focusable, and neither is anything parked at
    // tabindex="-1" — <main> is the target of the link, not a stop before it.
    if (m[1] === 'a' && !/\shref=/.test(m[0])) continue;
    if (/\btabindex="-\d/.test(m[0])) continue;
    stops.push(m[0]);
  }
  return stops;
}

/** translateY(...) in a rule body, as a number, or null if it has none. */
const translateY = body => {
  const m = /transform:\s*translateY\(\s*(-?[\d.]+)/.exec(body);
  return m ? parseFloat(m[1]) : null;
};

const zIndex = selector => {
  const rule = rules(CSS).find(r => r.selector === selector);
  assert.ok(rule, `${selector} rule exists`);
  const m = /z-index:\s*(\d+)/.exec(rule.body);
  return m ? parseInt(m[1], 10) : null;
};

test('the first thing the Tab key reaches is a way past the header', () => {
  // WCAG 2.4.1. Above the content sit the wordmark, five nav links, the language
  // and theme buttons and the emergency button: nine tab stops between the top of
  // the page and anything a visitor came for, on every visit, repeated after every
  // reload. A sighted visitor's eye skips them for free.
  const { app } = loadApp();
  const stops = tabStops(app);

  // A floor, because "the first match is the skip link" is also what an extraction
  // that matched one thing would say.
  assert.ok(stops.length >= 20, `only ${stops.length} tab stops found; the sweep is broken`);
  assert.match(stops[0], /class="skip-link"/,
    `the first tab stop is ${stops[0].trim()}, so the header has to be tabbed through`);

  const link = stops[0];
  const target = /href="#([^"]+)"/.exec(link);
  assert.ok(target, 'the skip link needs a destination');
  assert.match(link, /data-i18n="([^"]+)"/, 'the skip link must be translated like any other prose');

  // The one part of this that fails silently: a fragment link to an element that
  // cannot hold focus scrolls the page and leaves focus in the header, so the next
  // Tab returns to the nav link after the wordmark and the visitor is back where
  // they started — with the page scrolled, which makes it look like it worked.
  const targetTag = new RegExp(`<[a-z]+\\b[^>]*\\bid="${target[1]}"[^>]*>`).exec(HTML);
  assert.ok(targetTag, `the skip link points at #${target[1]}, which is on no element`);
  assert.match(targetTag[0], /tabindex="-1"/,
    `#${target[1]} cannot take focus, so the link only scrolls`);

  // And it has to be past the furniture: landing on something above the navbar
  // would leave every one of those nine stops still ahead of the visitor.
  assert.ok(HTML.indexOf(targetTag[0]) > HTML.indexOf('<header'),
    'the destination is above the header it is meant to skip');
});

test('the skip link is out of sight without being out of the tab order', () => {
  // display: none and visibility: hidden are the two ways to hide this that also
  // un-focus it, which would leave a link that is invisible AND unreachable: no
  // visitor of any kind would ever find it, and nothing on screen would look wrong.
  const rule = rules(CSS).find(r => r.selector === '.skip-link');
  assert.ok(rule, 'styles.css needs a .skip-link rule');
  assert.doesNotMatch(rule.body, /display:\s*none|visibility:\s*hidden/,
    'both of these remove it from the tab order, which is the only place it lives');

  const focused = rules(CSS).find(r => r.selector === '.skip-link:focus');
  assert.ok(focused, 'the link must become visible when it is focused');

  // Off-screen by one mechanism and back by the same one, compared as numbers so
  // that a rule which moves it away and never brings it back cannot pass.
  assert.ok(translateY(rule.body) < 0,
    'the resting position must be off the top of the viewport');
  assert.equal(translateY(focused.body), 0,
    'focusing it must bring it into view; a focused link nobody can see is no better');

  // The navbar is sticky at z-index 1000, and the link unfolds over the top of it.
  assert.ok(zIndex('.skip-link') > zIndex('.navbar'),
    'the link would appear behind the sticky header');
});

test('no breakpoint hides the navigation outright', () => {
  // The original: `.nav-links { display: none }` below 640px, with no disclosure
  // button and no other route to the five sections — on most phones.
  const offenders = rules(CSS)
    .filter(r => /\bnav(-links)?\b/.test(r.selector) && /display:\s*none/.test(r.body))
    .map(r => r.selector);

  assert.deepEqual(offenders, [],
    'hiding the nav removes the only route to these sections; let it wrap instead');
});

test('every in-page link points at a section that exists', () => {
  // Page-wide rather than scoped to <nav>, because the same defect kept turning
  // up outside it: two footer links (fixed in b10ef97) and the header wordmark.
  const ids = new Set([...HTML.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const targets = [...HTML.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);

  // A floor, not a count: the nav's five, the hero's two and the footer's four.
  // Without it an extraction that stops matching reads as a page of valid links.
  assert.ok(targets.length >= 11, `only ${targets.length} in-page links were examined`);
  assert.deepEqual([...new Set(targets.filter(t => !ids.has(t)))], [],
    'a link to a fragment that is in no id on the page');

  // And the nav in particular still carries a route to every section, which is
  // the reason the 640px breakpoint was rewritten rather than left hiding it.
  const nav = /<nav>([\s\S]*?)<\/nav>/.exec(HTML);
  assert.ok(nav, '<nav> exists');
  assert.ok([...nav[1].matchAll(/href="#/g)].length >= 5, 'the five section links');
});

test('no link on the page names nowhere', () => {
  // `href="#"` is the shape a control takes when it was drawn before it had
  // anywhere to go: it scrolls to the top, says nothing about where that is,
  // leaves a stray "#" in the address bar and adds a history entry for it. The
  // footer had two of them around a fake hotline; the header wordmark had the
  // last one, and now points at #hero the way the nav links point at sections.
  const bare = [...HTML.matchAll(/<a\b[^>]*href="#"[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(bare, [], 'give the link a destination, or do not make it a link');
});

/* ---- the footer ---- */

// The wordmark is a brand, not translatable prose, and is excluded from the
// i18n sweep below rather than being given a translation key.
const FOOTER = /<footer[\s\S]*?<\/footer>/.exec(HTML)[0]
  .replace(/<div class="logo-group">[\s\S]*?<\/div>\s*<\/div>/g, '');

test('the footer contains no dead links', () => {
  // An href="#" that nothing is bound to is a control that does nothing when
  // used. Here it also lent a fake hotline and PGP key the look of real ones.
  const dead = [...FOOTER.matchAll(/<a\b[^>]*href="#"[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(dead, [], 'if there is nothing to link to, do not use a link');
});

test('every line of footer prose is translated', () => {
  // The copyright and the build string used to be hardcoded Chinese, and the
  // three advisory links hardcoded Chinese labels: a visitor who switched to
  // English got a footer that did not switch with the rest of the page.
  const untranslated = [];
  let examined = 0;

  // The `<` that ends the text is a lookahead, not part of the match: consuming
  // it would skip the element that starts there, and back-to-back openings are
  // exactly the shape of this footer. Caught by mutating away one key and
  // watching the guard stay green.
  for (const [, attrs, text] of FOOTER.matchAll(/<\w+([^>]*)>([^<]+)(?=<)/g)) {
    if (!/[A-Za-z一-鿿]/.test(text.trim())) continue;   // emoji, symbols
    examined++;
    if (!/\bdata-i18n=/.test(attrs)) untranslated.push(text.trim());
  }

  // Without this the loop is vacuous the moment the extraction stops matching,
  // and a footer of untranslated prose reads as a pass.
  assert.ok(examined > 10, `only ${examined} footer strings were examined`);
  assert.deepEqual(untranslated, [], 'footer text with no data-i18n attribute');
});

test('the footer says the emergency contacts are not real', () => {
  const { app } = loadApp();

  for (const lang of ['zh-TW', 'en']) {
    const dict = app.TRANSLATIONS[lang];
    for (const key of ['footerHotline', 'footerPGP']) {
      assert.match(dict[key], /placeholder|示範|非真實|no such/i,
        `${key} in ${lang} presents a fictional contact as a real one`);
    }
    // And points at the channel that does exist, the way the modal's own note
    // already does — saying "this is fake" is only half an answer mid-incident.
    assert.match(dict.footerRealChannel, /organisation|organization|貴組織/i,
      `footerRealChannel in ${lang} should name the real route`);
  }
});

test('the footer brand line does not advertise a platform', () => {
  // Same rule the <title> and the social description are already held to: the
  // footer is read as an "about this site" line, and it claimed an enterprise
  // telemetry and incident-containment platform.
  const { app } = loadApp();

  for (const lang of ['zh-TW', 'en']) {
    const brand = app.TRANSLATIONS[lang].footerBrand;
    assert.doesNotMatch(brand, /\blive\b|real-?time|即時|\bplatform\b|平台/i,
      `footerBrand in ${lang} claims a capability the site does not have`);
    assert.match(brand, /demo|simulated|示範|模擬/i,
      `footerBrand in ${lang} must say this is a demo on simulated data`);
  }
});

/* ---- type ---- */

// Families that arrive with a mainstream desktop or mobile OS, plus the three
// keywords that resolve to whatever the OS uses itself (-apple-system and
// BlinkMacSystemFont for UI text, ui-monospace for code). A stack naming none of
// these has nothing between its wish-list and the browser's default font.
const SYSTEM = [
  '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Roboto',
  'Helvetica Neue', 'Helvetica', 'Arial', 'Noto Sans', 'DejaVu Sans',
  'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Monaco', 'Consolas',
  'Liberation Mono', 'DejaVu Sans Mono', 'Courier New'
];

const GENERIC = ['sans-serif', 'serif', 'monospace', 'system-ui', 'cursive', 'fantasy'];

const families = stack => stack.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, ''));

test('no font stack leans on a family the page never loads', () => {
  // Nothing is fetched — the third-party allow-list in static-source.test.js is
  // deliberately empty, which is what keeps the CSP closed — and no font is
  // shipped either, so 'Inter' and 'JetBrains Mono' render only for a visitor who
  // happens to have them installed. As a first preference that is fine. As the
  // only named family it is not: --font-mono was `'JetBrains Mono', monospace`,
  // so every counter, score, hash and CVE id was set in whatever the visitor's
  // browser has as its fixed-width font. Seeding a Chrome profile with that
  // preference set to Courier New shows the difference the rest of the stack
  // makes — the old value measures as Courier New, the new one as Consolas.
  //
  // Either half is a valid answer, so both are allowed for: a family this
  // stylesheet actually declares an @font-face for counts as available.
  const loaded = new Set([...CSS.matchAll(/@font-face[\s\S]*?font-family:\s*['"]?([^'";]+)/g)]
    .map(m => m[1].trim()));

  const stacks = [...CSS.matchAll(/(--font-[\w-]+):\s*([^;]+);/g)];
  assert.ok(stacks.length >= 2, `only ${stacks.length} font stacks were examined`);

  for (const [, name, stack] of stacks) {
    const named = families(stack);

    // Without a generic last, a stack that resolves to nothing is undefined
    // territory rather than "use the default".
    assert.ok(GENERIC.includes(named.at(-1)),
      `${name} should end in a generic family, not ${named.at(-1)}`);

    const available = named.filter(f => SYSTEM.includes(f) || loaded.has(f));
    assert.ok(available.length,
      `${name} names nothing a visitor will have: ${stack.trim()}`);
  }
});

test('every font-family on the page goes through the two stacks', () => {
  // Including the inline styles, which is where a one-off `font-family:
  // 'JetBrains Mono', monospace` would land next: it would miss the fallbacks
  // above and there would be no single place left to fix.
  const offenders = [];
  let examined = 0;

  // An @font-face's own font-family is the name being defined, not a use of one.
  const sheet = CSS.replace(/@font-face\s*\{[^}]*\}/g, '');

  for (const [source, where] of [[sheet, 'styles.css'], [HTML, 'index.html'], [read('app.js'), 'app.js']]) {
    for (const [, value] of source.matchAll(/font-family:\s*([^;"'}]+)/g)) {
      examined++;
      if (!/^var\(--font-[\w-]+\)$/.test(value.trim())) offenders.push(`${where}: ${value.trim()}`);
    }
  }

  assert.ok(examined > 20, `only ${examined} font-family declarations were examined`);
  assert.deepEqual(offenders, [], 'these bypass --font-sans / --font-mono');
});

test('the copyright and build strings do not imply a released product', () => {
  const { app } = loadApp();

  for (const lang of ['zh-TW', 'en']) {
    const dict = app.TRANSLATIONS[lang];
    // It read "SEC-VER: 3.8.1-RELEASE", which is a version number for software
    // that has none, next to a copyright for a company that does not exist.
    assert.doesNotMatch(dict.footerBuild, /\bRELEASE\b|\d+\.\d+\.\d+/,
      `footerBuild in ${lang} invents a release version`);
    assert.match(dict.footerCopyright, /MIT/,
      `footerCopyright in ${lang} should point at the licence the repo actually has`);
  }
});
