'use strict';

/**
 * The tool panels, which claimed to be a tablist for a year without being one.
 *
 * index.html has carried `role="tablist"` and four `role="tab"` buttons since the
 * panels were written. Those roles are a promise to assistive technology, and
 * every part of the promise was missing: no `aria-selected`, so a screen reader
 * announced four tabs and never said which one was showing; no `aria-controls`,
 * so no tab was connected to the panel it opens; no `aria-labelledby` on the
 * panels, so each one was an unnamed region; and no roving tabindex, so the list
 * was four tab stops instead of the one a tablist is, with the arrow keys — the
 * only navigation the role advertises — doing nothing at all.
 *
 * The guards come in two halves, because the defect had two halves: the markup
 * declares the relationships, and app.js is what keeps them true after a click.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadApp } = require('./helpers/load-app.js');
const { stripHtmlComments } = require('./helpers/markup.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Comments stripped: the comment above the tablist quotes the attributes it
// explains, and the guards below decide what the markup "declares" from this.
const HTML = stripHtmlComments(read('index.html'));

const attr = (tag, name) => {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
};

/** Every `role="tab"` button in index.html, as the markup declares it. */
const TABS = [...HTML.matchAll(/<button\b[^>]*>/g)]
  .map(m => m[0])
  .filter(tag => attr(tag, 'role') === 'tab')
  .map(tag => ({
    tag,
    id: attr(tag, 'id'),
    controls: attr(tag, 'aria-controls'),
    selected: attr(tag, 'aria-selected'),
    tabindex: attr(tag, 'tabindex'),
    active: /\bclass="[^"]*\bactive\b/.test(tag)
  }));

/** The `role="tabpanel"` element with this id, or null. */
function panelTag(id) {
  const m = new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`).exec(HTML);
  return m && attr(m[0], 'role') === 'tabpanel' ? m[0] : null;
}

/* ---- what the markup declares ---- */

test('the markup still holds the four tabs these guards are about', () => {
  // Everything below reads TABS, so an extraction that stops matching would turn
  // this whole file into a set of empty loops that pass.
  assert.equal(TABS.length, 4, 'expected one role="tab" per tool panel');
});

test('every tab says which panel it controls, and that panel names it back', () => {
  for (const tab of TABS) {
    assert.ok(tab.id, `a role="tab" with no id cannot label its panel: ${tab.tag}`);
    assert.ok(tab.controls, `${tab.id} does not say which panel it opens`);

    const panel = panelTag(tab.controls);
    assert.ok(panel, `${tab.id} points aria-controls at ${tab.controls}, which is no tabpanel`);

    // Without this the panel is an unnamed region: the tab's own label is the
    // only name it has, and nothing connects the two.
    assert.equal(attr(panel, 'aria-labelledby'), tab.id,
      `${tab.controls} should be labelled by ${tab.id}`);
  }
});

test('exactly one tab is selected, and it is the one whose panel is showing', () => {
  // `aria-selected` is the whole of what a screen reader has to go on: the cyan
  // border that shows a sighted visitor which tool is open is invisible to it.
  const selected = TABS.filter(t => t.selected === 'true');
  assert.equal(selected.length, 1, 'a tablist has exactly one selected tab');

  for (const tab of TABS) {
    assert.ok(tab.selected === 'true' || tab.selected === 'false',
      `${tab.id} needs an explicit aria-selected`);

    // The class drives `display`, so a disagreement here is a screen reader
    // being told about a panel the page is not showing.
    const panel = panelTag(tab.controls);
    const shown = /\bclass="[^"]*\bactive\b/.test(panel);
    assert.equal(shown, tab.selected === 'true',
      `${tab.controls} is ${shown ? 'shown' : 'hidden'} but its tab says aria-selected="${tab.selected}"`);
    assert.equal(tab.active, tab.selected === 'true',
      `${tab.id} carries .active and aria-selected="${tab.selected}"`);
  }
});

test('the tablist is a single tab stop', () => {
  // Four tab stops is what the browser gives four buttons by default, and it is
  // the thing a tablist is defined as not being: the list is one stop, and the
  // arrows move inside it. Reaching the form in the last panel took four presses.
  const stops = TABS.filter(t => t.tabindex !== '-1');
  assert.equal(stops.length, 1, `expected one tab stop, found ${stops.length}`);
  assert.equal(stops[0].tabindex, '0', 'the selected tab is the stop');
  assert.equal(stops[0].selected, 'true', 'and the stop has to be the selected tab');
});

test('the tablist itself is named and oriented', () => {
  const list = /<ul\b[^>]*role="tablist"[^>]*>/.exec(HTML);
  assert.ok(list, 'the tabs live in a role="tablist"');

  // The default is horizontal, and the arrow keys a screen reader suggests follow
  // it — Left/Right for a list that is drawn as a column at every breakpoint.
  assert.equal(attr(list[0], 'aria-orientation'), 'vertical');

  // Announced before its contents, so "which four tabs are these" has an answer.
  // i18n.test.js checks the key resolves in both languages.
  assert.ok(attr(list[0], 'data-i18n-aria-label'), 'the tablist needs a translated name');
});

/* ---- what app.js does with them ---- */

/**
 * Build the tab fixture from what index.html declares, rather than from a copy
 * of it: if the markup drops an aria-controls, these behavioural tests should
 * break too instead of exercising a wiring the page no longer has.
 */
function withTabs() {
  const { app, dom } = loadApp();

  const built = TABS.map(spec => {
    const btn = dom.createElement('button');
    btn.classList.add('tool-nav-btn');
    if (spec.active) btn.classList.add('active');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', spec.controls);
    btn.setAttribute('aria-selected', spec.selected);
    btn.setAttribute('tabindex', spec.tabindex);
    dom.registerId(spec.id, btn);
    dom.registerClass('tool-nav-btn', btn);

    const panel = dom.createElement('div');
    panel.classList.add('tool-panel');
    if (spec.active) panel.classList.add('active');
    dom.registerId(spec.controls, panel);
    dom.registerClass('tool-panel', panel);

    return { btn, panel, id: spec.id };
  });

  app.initToolTabs();

  return {
    app,
    dom,
    tabs: built.map(b => b.btn),
    panels: built.map(b => b.panel),
    /** The index of the one selected tab, or -1 / a throw if that is not one. */
    selectedIndex() {
      const on = built.map((b, i) => [b, i])
        .filter(([b]) => b.btn.getAttribute('aria-selected') === 'true');
      assert.equal(on.length, 1, `${on.length} tabs are selected at once`);
      return on[0][1];
    },
    /** Everything that has to move together, as one comparable snapshot. */
    state() {
      return built.map(b => [
        b.btn.getAttribute('aria-selected'),
        b.btn.getAttribute('tabindex'),
        b.btn.classList.contains('active'),
        b.panel.classList.contains('active')
      ].join(' '));
    }
  };
}

/** What state() looks like when tab `i` is the selected one. */
const expected = (i, count) =>
  Array.from({ length: count }, (_, n) =>
    n === i ? 'true 0 true true' : 'false -1 false false');

test('the fixture starts in the state index.html ships', () => {
  const ui = withTabs();
  assert.deepEqual(ui.state(), expected(0, ui.tabs.length));
});

test('clicking a tab moves the selection, the tab stop and the panel together', () => {
  // The original moved the class and the panel and nothing else, so after a click
  // the first tab was still the one announced as selected and still the only one
  // a screen reader's tab-list summary pointed at.
  const ui = withTabs();

  ui.tabs[2].dispatch('click');
  assert.deepEqual(ui.state(), expected(2, ui.tabs.length));

  ui.tabs[0].dispatch('click');
  assert.deepEqual(ui.state(), expected(0, ui.tabs.length));
});

test('a click does not move focus away from what the visitor clicked', () => {
  // The browser has already focused the button; calling focus() again is
  // harmless, but a select() that always moved focus would also yank it on the
  // programmatic paths, so the distinction is worth pinning.
  const ui = withTabs();
  ui.tabs[1].dispatch('click');
  assert.equal(ui.dom.document.activeElement, null, 'a click should not call focus()');
});

test('the arrow keys walk the list, and focus follows the selection', () => {
  // Selection following focus is the choice that makes an arrow press useful on
  // its own. If focus did not follow, the next arrow press would start over from
  // the tab the visitor left behind.
  const ui = withTabs();

  ui.tabs[0].dispatch('keydown', { key: 'ArrowDown' });
  assert.deepEqual(ui.state(), expected(1, ui.tabs.length));
  assert.equal(ui.dom.document.activeElement, ui.tabs[1], 'focus stayed on the old tab');

  ui.tabs[1].dispatch('keydown', { key: 'ArrowUp' });
  assert.deepEqual(ui.state(), expected(0, ui.tabs.length));
  assert.equal(ui.dom.document.activeElement, ui.tabs[0]);
});

test('the arrows wrap at both ends', () => {
  // A list that stops at the end leaves the visitor pressing a key that does
  // nothing, with no indication that they have run out of tabs.
  const ui = withTabs();
  const last = ui.tabs.length - 1;

  ui.tabs[0].dispatch('keydown', { key: 'ArrowUp' });
  assert.equal(ui.selectedIndex(), last, 'up from the first tab should reach the last');

  ui.tabs[last].dispatch('keydown', { key: 'ArrowDown' });
  assert.equal(ui.selectedIndex(), 0, 'down from the last tab should reach the first');
});

test('the cross-axis arrows work too', () => {
  // The list is drawn as a column, but nothing tells a visitor which axis a
  // tablist uses, and a key that silently does nothing reads as a broken widget.
  const ui = withTabs();

  ui.tabs[0].dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(ui.selectedIndex(), 1);

  ui.tabs[1].dispatch('keydown', { key: 'ArrowLeft' });
  assert.equal(ui.selectedIndex(), 0);
});

test('Home and End jump to the ends of the list', () => {
  const ui = withTabs();
  const last = ui.tabs.length - 1;

  ui.tabs[0].dispatch('keydown', { key: 'End' });
  assert.deepEqual(ui.state(), expected(last, ui.tabs.length));

  ui.tabs[last].dispatch('keydown', { key: 'Home' });
  assert.deepEqual(ui.state(), expected(0, ui.tabs.length));
});

test('the keys the tablist claims are the keys it consumes', () => {
  // ArrowDown would scroll the page out from under the list and Home would jump
  // to the top of the document, in both cases taking the newly focused tab off
  // screen. Everything else has to be left alone — Tab most of all, since
  // swallowing it would trap the visitor in the tablist.
  const ui = withTabs();

  for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
    const ev = ui.tabs[0].dispatch('keydown', { key });
    assert.equal(ev.defaultPrevented, true, `${key} should not also do its default thing`);
  }

  for (const key of ['Tab', 'PageDown', 'a', ' ']) {
    const before = ui.state();
    const ev = ui.tabs[ui.selectedIndex()].dispatch('keydown', { key });
    assert.equal(ev.defaultPrevented, false, `${key} is not the tablist's to swallow`);
    assert.deepEqual(ui.state(), before, `${key} changed the selection`);
  }
});

test('the panel that opens is the one aria-controls names', () => {
  // The two used to be separate attributes holding the same string — a
  // data-target for the click handler and, after this change, an aria-controls
  // for assistive technology. Two copies of one id is one copy too many.
  const ui = withTabs();
  assert.doesNotMatch(read('app.js'), /getAttribute\('data-target'\)/,
    'the panel id should be read from aria-controls, not from a second attribute');

  for (const [i, tab] of ui.tabs.entries()) {
    tab.dispatch('click');
    const opened = ui.panels.filter(p => p.classList.contains('active'));
    assert.equal(opened.length, 1, 'exactly one panel is shown');
    assert.equal(opened[0], ui.panels[i],
      `clicking ${TABS[i].id} opened a panel other than ${TABS[i].controls}`);
  }
});

test('initToolTabs on a page with no tabs does nothing rather than throwing', () => {
  // It runs on DOMContentLoaded for every page state, and a throw there takes
  // down every initialiser after it in the list.
  const { app } = loadApp();
  assert.doesNotThrow(() => app.initToolTabs());
});
