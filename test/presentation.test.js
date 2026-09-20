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

/* ---- navigation ---- */

// Comments stripped, because the markup explains itself: the comment next to the
// footer quotes the `<a href="#">` it replaced, and the dead-link guard below
// would otherwise find its own explanation and report it as the defect.
const HTML = stripHtmlComments(read('index.html'));

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
