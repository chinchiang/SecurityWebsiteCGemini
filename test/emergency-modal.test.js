'use strict';

/**
 * The emergency dialog was hidden with `opacity: 0; pointer-events: none`, which
 * hides it from the mouse and from nobody else. Every control stayed in the tab
 * order, so a keyboard user tabbing past the footer walked into the incident
 * category select, the contact field and the submit button of a dialog that was
 * not on screen — with no indication of where focus had gone.
 *
 * Opening it was no better: focus stayed on the trigger behind the overlay,
 * Escape did nothing, Tab left the dialog immediately, and closing it dropped
 * focus to the top of the document.
 *
 * These tests pin the two halves separately, because they fail separately: the
 * CSS decides whether a closed dialog is reachable, and app.js decides what
 * happens once it is open.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadApp } = require('./helpers/load-app.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = read('styles.css');
const HTML = read('index.html');

/**
 * The dialog as index.html declares it, built as real elements.
 *
 * The stub stores innerHTML as a string without parsing it, so the markup has to
 * be reproduced here for the behaviour to be exercised at all. The tags are the
 * load-bearing part: the focus trap selects on `button, input, select`, so an
 * auto-created <div> standing in for the submit button would be skipped and the
 * trap would appear to wrap correctly while missing a real tab stop.
 */
function addModal(dom) {
  const modal = dom.registerId('emergencyModal', dom.createElement('div'));
  modal.classList.add('modal-overlay');

  const card = dom.createElement('div');
  card.classList.add('modal-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('tabindex', '-1');
  dom.registerClass('modal-card', card);
  modal.appendChild(card);

  const closeBtn = dom.registerId('closeEmergencyModalBtn', dom.createElement('button'));
  closeBtn.setAttribute('data-i18n-aria-label', 'modalClose');
  dom.registerI18nAria(closeBtn);

  const form = dom.registerId('emergencyForm', dom.createElement('form'));
  const incidentType = dom.registerId('incidentType', dom.createElement('select'));
  const contact = dom.registerId('reporterContact', dom.createElement('input'));
  const cancelBtn = dom.registerId('cancelEmergencyBtn', dom.createElement('button'));
  const submitBtn = dom.registerId('triggerEmergencyAlertBtn', dom.createElement('button'));

  card.append(closeBtn, form);
  form.append(incidentType, contact, cancelBtn, submitBtn);

  // Deliberately outside the overlay: it is what focus has to come back to.
  const openBtn = dom.registerId('openEmergencyModalBtn', dom.createElement('button'));

  return { modal, card, openBtn, closeBtn, form, incidentType, contact, cancelBtn, submitBtn };
}

/** Open the dialog the way a visitor does, from a focused trigger. */
function opened(dom, app) {
  const els = addModal(dom);
  app.initEmergencyModal();
  els.openBtn.focus();
  els.openBtn.dispatch('click');

  // Asserted in the helper so that every test built on it is non-vacuous about
  // focus. On the previous code focus never left the trigger, which made a later
  // "focus came back to the trigger" assertion pass without anything happening.
  assert.equal(dom.document.activeElement, els.card,
    'opening should have moved focus onto the dialog');
  return els;
}

const key = (dom, name, extra = {}) => dom.document.dispatch('keydown', { key: name, ...extra });

test('the fixture reproduces the tab stops the real dialog has', () => {
  // Guards every assertion below: if the stub resolved the focusable selector to
  // nothing, the trap tests would pass by never having anything to trap.
  const { app, dom } = loadApp();
  const els = addModal(dom);

  assert.equal(els.modal.querySelector('.modal-card'), els.card, 'the card must be found inside the overlay');
  assert.deepEqual(app.focusableWithin(els.modal),
    [els.closeBtn, els.incidentType, els.contact, els.cancelBtn, els.submitBtn],
    'the tab stops must come back in document order, with the tabindex="-1" card excluded');
});

test('a closed dialog is removed from the tab order, not just from view', () => {
  // The original bug, and the reason it was invisible: opacity and
  // pointer-events say nothing about focusability.
  const closed = /\.modal-overlay\s*\{([^}]*)\}/.exec(CSS);
  assert.ok(closed, '.modal-overlay rule exists');
  assert.match(closed[1], /visibility:\s*hidden/,
    'opacity: 0 leaves every control in the dialog tabbable');

  const active = /\.modal-overlay\.active\s*\{([^}]*)\}/.exec(CSS);
  assert.ok(active, '.modal-overlay.active rule exists');
  assert.match(active[1], /visibility:\s*visible/,
    'the open dialog must undo it, or nothing inside can be focused');

  // Each of these was got wrong once and verified in Chrome. visibility is a
  // discrete property: giving it the opacity's 0.3s duration pins it at `hidden`
  // for the whole transition in BOTH directions, which leaves the dialog
  // unfocusable for 300ms after opening — so app.js's focus-on-open silently
  // does nothing and focus stays on the trigger behind the overlay.
  assert.match(closed[1], /transition:[^;]*visibility\s+0s\b/,
    'a nonzero visibility duration pins it at hidden for the length of the transition');
  assert.match(closed[1], /transition:[^;]*visibility\s+0s\s+\S+\s+0\.\d+s/,
    'the flip to hidden must be delayed past the fade, or the dialog vanishes instantly');
  assert.match(active[1], /transition:[^;]*visibility\s+0s\s+\S+\s+0s\b/,
    'opening must cancel that delay: app.js focuses the dialog in the same tick');
});

test('the dialog announces itself as one', () => {
  const card = /<div class="modal-card"[^>]*>/.exec(HTML);
  assert.ok(card, '.modal-card exists in index.html');

  assert.match(card[0], /role="dialog"/);
  assert.match(card[0], /aria-modal="true"/);
  // Focus is moved here on open, and a container is not focusable without it.
  assert.match(card[0], /tabindex="-1"/);

  const ids = new Set([...HTML.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const attr of ['aria-labelledby', 'aria-describedby']) {
    const ref = new RegExp(`${attr}="([^"]+)"`).exec(card[0]);
    assert.ok(ref, `the dialog needs ${attr}`);
    // A dangling reference is worse than none: the dialog is announced with no
    // name at all, and nothing in the markup looks wrong.
    assert.equal(ids.has(ref[1]), true, `${attr}="${ref[1]}" points at no element`);
  }
});

test('the close button has an accessible name in both languages', () => {
  const { app, dom } = loadApp();
  const { closeBtn } = addModal(dom);

  for (const lang of ['zh-TW', 'en']) {
    app.setLanguage(lang);
    assert.equal(closeBtn.getAttribute('aria-label'), app.TRANSLATIONS[lang].modalClose,
      `the close button is unnamed, or named in the wrong language, in ${lang}`);
  }
});

test('opening moves focus into the dialog and locks the page behind it', () => {
  const { app, dom } = loadApp();
  const { card, openBtn } = opened(dom, app);

  assert.equal(dom.document.activeElement, card,
    'focus stayed on the trigger behind the overlay');
  assert.equal(dom.document.body.classList.contains('modal-open'), true,
    'the page behind the dialog must not scroll');
  assert.notEqual(dom.document.activeElement, openBtn);
});

test('closing hands focus back to whatever opened it', () => {
  const { app, dom } = loadApp();
  const { openBtn, closeBtn } = opened(dom, app);

  closeBtn.dispatch('click');

  assert.equal(dom.document.activeElement, openBtn,
    'focus was dropped; the user has to tab back down from the top of the page');
  assert.equal(dom.document.body.classList.contains('modal-open'), false,
    'the scroll lock outlived the dialog');
});

test('cancel and submit both restore focus too', () => {
  for (const which of ['cancelEmergencyBtn', 'emergencyForm']) {
    const { app, dom } = loadApp();
    const els = opened(dom, app);

    if (which === 'emergencyForm') els.form.dispatch('submit');
    else els.cancelBtn.dispatch('click');

    assert.equal(els.modal.classList.contains('active'), false, `${which} did not close the dialog`);
    assert.equal(dom.document.activeElement, els.openBtn, `${which} did not restore focus`);
  }
});

test('Escape closes the dialog', () => {
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  const ev = key(dom, 'Escape');

  assert.equal(els.modal.classList.contains('active'), false);
  assert.equal(dom.document.activeElement, els.openBtn);
  assert.equal(ev.defaultPrevented, true, 'the key must be consumed by the dialog');
});

test('Escape outside an open dialog is left alone', () => {
  // The handler is on the document, so it sees every keystroke on the page. If
  // it acted on a closed dialog it would steal Escape from anything else that
  // wants it and yank focus to a stale opener.
  const { app, dom } = loadApp();
  const els = addModal(dom);
  app.initEmergencyModal();
  els.contact.focus();

  const ev = key(dom, 'Escape');

  assert.equal(ev.defaultPrevented, false, 'Escape was consumed while the dialog was closed');
  assert.equal(dom.document.activeElement, els.contact, 'focus was moved by a closed dialog');
});

test('a click on the backdrop closes the dialog; a click inside does not', () => {
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  // Bubbling means the overlay's listener also sees clicks on the form, the
  // labels and the select. Dismissing on those would lose the user's input.
  els.modal.dispatch('click', { target: els.card });
  assert.equal(els.modal.classList.contains('active'), true,
    'a click inside the card dismissed the dialog');

  els.modal.dispatch('click', { target: els.modal });
  assert.equal(els.modal.classList.contains('active'), false, 'the backdrop should dismiss');
  assert.equal(dom.document.activeElement, els.openBtn);
});

test('Tab wraps at both ends instead of leaving the dialog', () => {
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  els.submitBtn.focus();
  assert.equal(key(dom, 'Tab').defaultPrevented, true);
  assert.equal(dom.document.activeElement, els.closeBtn,
    'Tab from the last control walked out into the page behind');

  assert.equal(key(dom, 'Tab', { shiftKey: true }).defaultPrevented, true);
  assert.equal(dom.document.activeElement, els.submitBtn,
    'Shift+Tab from the first control walked backwards out of the dialog');
});

test('Tab in the middle of the dialog is left to the browser', () => {
  // Preventing every Tab and driving focus by hand would mean reimplementing the
  // tab order; the trap only has to act at the two ends.
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  els.contact.focus();
  const ev = key(dom, 'Tab');

  assert.equal(ev.defaultPrevented, false, 'the browser should move focus here');
  assert.equal(dom.document.activeElement, els.contact, 'the handler must not move focus itself');
});

test('Tab from the dialog card enters the controls', () => {
  // Where focus actually is on open. The card is not a tab stop, so it is not in
  // the list the trap wraps within, and the browser's own Tab from it would go
  // to the next thing in the document — which is outside the dialog.
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  assert.equal(key(dom, 'Tab').defaultPrevented, true);
  assert.equal(dom.document.activeElement, els.closeBtn);

  els.card.focus();
  assert.equal(key(dom, 'Tab', { shiftKey: true }).defaultPrevented, true);
  assert.equal(dom.document.activeElement, els.submitBtn);
});

test('a disabled control is not a tab stop', () => {
  const { app, dom } = loadApp();
  const els = addModal(dom);
  els.submitBtn.disabled = true;

  const stops = app.focusableWithin(els.modal);
  assert.equal(stops.includes(els.submitBtn), false,
    'a disabled control cannot be focused, so wrapping onto it would strand the user');
  assert.equal(stops[stops.length - 1], els.cancelBtn, 'the wrap point should move up');
});

test('closing twice restores focus once', () => {
  // closeModal() runs from four places. Without the isOpen() guard, a second
  // call would focus a stale opener long after the dialog was gone.
  const { app, dom } = loadApp();
  const els = opened(dom, app);

  els.closeBtn.dispatch('click');
  assert.equal(dom.document.activeElement, els.openBtn, 'the first close should restore focus');

  els.contact.focus();          // stand-in for the user moving on
  els.cancelBtn.dispatch('click');

  assert.equal(dom.document.activeElement, els.contact,
    'a redundant close yanked focus back to the old trigger');
});
