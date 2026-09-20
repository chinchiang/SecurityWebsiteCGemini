'use strict';

/**
 * The playbook accordion was a <div class="playbook-header"> with a click
 * listener. A div is not in the tab order and does not synthesise click from
 * Enter or Space, so every playbook panel was unreachable without a mouse: the
 * content was rendered, present in the DOM, and simply could not be opened. A
 * screen reader was told nothing about the collapsed state either.
 *
 * It is now a <button> inside a heading, wired with aria-expanded and
 * aria-controls. These tests pin both halves: that the markup carries the
 * wiring, and that clicking actually keeps aria-expanded in step with the class
 * the CSS reads. The second half is the one that rots — the class is visible in
 * the browser, the attribute is not.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadApp } = require('./helpers/load-app.js');

const CSS = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

/**
 * The accordion as renderPlaybooks() leaves it, built by hand.
 *
 * The DOM stub stores innerHTML as a string without parsing it, so the elements
 * a render writes are not walked. Building them here is what lets the click
 * behaviour be exercised at all; the markup half is asserted against the real
 * innerHTML string further down, so the two do not drift unnoticed.
 */
function addAccordion(dom, count) {
  const items = [];

  for (let i = 0; i < count; i++) {
    const item = dom.createElement('div');
    const header = dom.createElement('button');
    header.setAttribute('id', `playbook-header-${i}`);
    header.setAttribute('aria-expanded', 'false');

    // appendChild sets parentNode, which is what makes the scoped
    // item.querySelector('.playbook-header') below resolve to this header.
    item.appendChild(header);
    dom.registerClass('playbook-item', item);
    dom.registerClass('playbook-header', header);
    items.push({ item, header });
  }

  // renderPlaybooks() opens the first panel.
  items[0].item.classList.add('open');
  items[0].header.setAttribute('aria-expanded', 'true');
  return items;
}

const expanded = ({ header }) => header.getAttribute('aria-expanded');
const open = ({ item }) => item.classList.contains('open');

test('a scoped querySelector finds the header inside its own item', () => {
  // Not a test of app.js but of the fixture: while the stub ignored the scope
  // argument for class selectors, every item resolved to the first header, and
  // the three assertions below could not tell "opened the item I clicked" from
  // "opened item 0" — they would have passed either way.
  const { dom } = loadApp();
  const items = addAccordion(dom, 3);

  items.forEach(({ item, header }, i) => {
    assert.equal(item.querySelector('.playbook-header'), header, `item ${i} got another item's header`);
  });
});

test('clicking a collapsed header opens it and collapses the rest', () => {
  const { app, dom } = loadApp();
  const items = addAccordion(dom, 3);
  app.initPlaybookAccordion();

  items[2].header.dispatch('click');

  assert.equal(open(items[2]), true, 'the clicked panel should be open');
  assert.equal(expanded(items[2]), 'true');

  for (const i of [0, 1]) {
    assert.equal(open(items[i]), false, `panel ${i} should have closed`);
    // The attribute is the half a screen reader reads. Leaving it behind tells
    // the user three panels are expanded while two are display:none.
    assert.equal(expanded(items[i]), 'false', `panel ${i} still claims to be expanded`);
  }
});

test('clicking the open header collapses it', () => {
  const { app, dom } = loadApp();
  const items = addAccordion(dom, 3);
  app.initPlaybookAccordion();

  items[0].header.dispatch('click');

  assert.equal(open(items[0]), false, 'a second click should close the panel');
  assert.equal(expanded(items[0]), 'false');
});

test('every header is a button, so Tab reaches it and Enter and Space activate it', () => {
  const { app, dom } = loadApp();
  app.setLanguage('zh-TW');
  const html = dom.getById('playbookAccordion').innerHTML;

  const headers = [...html.matchAll(/<button\b[^>]*>/g)].map(m => m[0]);
  assert.equal(headers.length, app.PLAYBOOK_DATA['zh-TW'].length,
    'one header button per playbook');

  // The exact shape of the regression: a div is focusable by nobody.
  assert.doesNotMatch(html, /<div[^>]*class="[^"]*\bplaybook-header\b/,
    'the header must not go back to being a <div>');

  for (const header of headers) {
    // Without this a header inside a <form> would submit it. There is no form
    // here today, which is exactly why the omission would go unnoticed.
    assert.match(header, /type="button"/, `${header} needs an explicit type`);
  }
});

test('each header is wired to the panel it controls', () => {
  const { app, dom } = loadApp();
  app.setLanguage('en');
  const html = dom.getById('playbookAccordion').innerHTML;

  const headers = [...html.matchAll(/<button\b[^>]*>/g)].map(m => m[0]);
  const panels = [...html.matchAll(/<div\b[^>]*class="playbook-content"[^>]*>/g)].map(m => m[0]);
  assert.equal(panels.length, headers.length, 'one panel per header');

  headers.forEach((header, i) => {
    assert.match(header, new RegExp(`id="playbook-header-${i}"`));
    assert.match(header, new RegExp(`aria-controls="playbook-panel-${i}"`));
    // Only the first panel is open, and the attribute has to say so from the
    // first paint — not from the first click.
    assert.match(header, new RegExp(`aria-expanded="${i === 0}"`),
      `header ${i} reports the wrong initial state`);

    const panel = panels[i];
    assert.match(panel, new RegExp(`id="playbook-panel-${i}"`),
      `aria-controls on header ${i} points at nothing`);
    // Gives the panel a name and a landmark, so a screen reader can jump into
    // the steps rather than walking out of the button and hoping.
    assert.match(panel, /role="region"/);
    assert.match(panel, new RegExp(`aria-labelledby="playbook-header-${i}"`));
  });
});

test('a header contains only phrasing content', () => {
  // A <div> inside a <button> is parsed out of the button by the browser, which
  // silently breaks the row layout and shrinks the click target.
  const { app, dom } = loadApp();
  app.setLanguage('zh-TW');
  const html = dom.getById('playbookAccordion').innerHTML;

  const inners = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1]);
  // Without this the loop below is vacuous on any markup that has no button at
  // all — which is precisely the markup this change replaced.
  assert.equal(inners.length, app.PLAYBOOK_DATA['zh-TW'].length, 'no header button to check');

  for (const inner of inners) {
    assert.doesNotMatch(inner, /<(?:div|p|h[1-6]|section|ul|ol|li)\b/,
      'a button may not contain flow content');
  }
});

test('the toggle affordance is translated and not announced twice', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('playbookAccordion');

  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    assert.ok(container.innerHTML.includes(app.TRANSLATIONS[lang].playbookToggle),
      `the toggle label stayed in the other language after switching to ${lang}`);
  }

  // aria-expanded already conveys the state; repeating it in the accessible name
  // makes every header read "expand collapse, collapsed, button".
  const glyph = app.TRANSLATIONS.en.playbookToggle;
  const at = container.innerHTML.indexOf(glyph);
  assert.notEqual(at, -1);
  assert.match(container.innerHTML.slice(Math.max(0, at - 200), at), /aria-hidden="true"[^<]*$/,
    'the decorative toggle text should be hidden from assistive technology');

  // It used to read 「點擊展開/收合」/"Click to toggle", which is wrong advice on
  // a keyboard and was hardcoded past both TRANSLATIONS tables.
  for (const lang of ['zh-TW', 'en']) {
    assert.doesNotMatch(app.TRANSLATIONS[lang].playbookToggle, /點擊|\bclick\b/i,
      'do not name the mouse as the only way in');
  }
});

test('keyboard focus on a header is visible', () => {
  // A button is focusable the moment it is a button, but the default ring is
  // drawn outside the element and .playbook-item clips with overflow: hidden —
  // so without an inset outline the focused row shows no indicator at all.
  const rule = /\.playbook-header:focus-visible\s*\{([^}]*)\}/.exec(CSS);
  assert.ok(rule, '.playbook-header needs a :focus-visible rule');
  assert.match(rule[1], /outline:\s*(?!none)/, 'the focus ring must not be removed');
  assert.match(rule[1], /outline-offset:\s*-/, 'the ring must be inset or the overflow clips it');
});
