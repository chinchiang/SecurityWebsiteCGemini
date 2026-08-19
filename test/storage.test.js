'use strict';

/**
 * app.js used to open with
 *
 *   let currentLang = localStorage.getItem('aegis-lang') || 'zh-TW';
 *
 * which reads like a safe default but is not: localStorage ACCESS throws, rather
 * than returning null, in Safari private browsing, under "block all cookies",
 * from a file:// URL in some browsers, and on a full quota. Because that was the
 * first statement in the file, the throw happened before a single listener was
 * bound — the page rendered its static markup and then did nothing at all, with
 * no visible cause.
 *
 * These tests load the whole app against a storage object that refuses, so a
 * regression shows up as "the app does not load" rather than as a subtle bug.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app.js');

test('the app loads when localStorage throws on every access', () => {
  assert.doesNotThrow(() => loadApp({ storage: 'throw' }));
});

test('the app loads when there is no localStorage object at all', () => {
  assert.doesNotThrow(() => loadApp({ storage: 'missing' }));
});

test('an unreadable language preference falls back to the default', () => {
  const { app } = loadApp({ storage: 'throw' });
  assert.equal(app.currentLang, 'zh-TW');
  assert.equal(app.storage.get('aegis-lang'), null, 'a failed read yields null, not a throw');
});

test('a failed write is reported rather than raised', () => {
  const { app } = loadApp({ storage: 'throw' });
  assert.equal(app.storage.set('aegis-lang', 'en'), false);
});

test('storage really does persist when the browser permits it', () => {
  // The helper swallows failures, so this is the test that keeps it from being
  // an unconditional no-op that every other assertion here would still pass.
  const { app, dom } = loadApp();
  assert.equal(app.storage.set('aegis-lang', 'en'), true);
  assert.equal(dom.stored('aegis-lang'), 'en');
  assert.equal(app.storage.get('aegis-lang'), 'en');
});

test('the language switch still works when it cannot be remembered', () => {
  const { app, dom } = loadApp({ storage: 'throw' });
  const btn = dom.getById('langToggleBtn');

  app.initLanguageToggle();
  app.setLanguage('zh-TW');

  assert.doesNotThrow(() => btn.dispatch('click'));
  assert.equal(app.currentLang, 'en', 'the switch must take effect for this page view');
  assert.equal(btn.textContent, '🌐 EN / 繁中');
});

test('the theme switch still works when it cannot be remembered', () => {
  const { app, dom } = loadApp({ storage: 'throw' });
  const btn = dom.getById('themeToggleBtn');

  assert.doesNotThrow(() => app.initThemeToggle());
  assert.equal(dom.document.documentElement.getAttribute('data-theme'), 'dark',
    'an unreadable preference falls back to the dark default');

  assert.doesNotThrow(() => btn.dispatch('click'));
  assert.equal(dom.document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(btn.textContent, '☀️');
});

test('a remembered language is honoured at load', () => {
  assert.equal(loadApp({ stored: { 'aegis-lang': 'en' } }).app.currentLang, 'en');
  assert.equal(loadApp().app.currentLang, 'zh-TW', 'an empty store means the default');
});

test('a remembered theme is honoured at load', () => {
  const { app, dom } = loadApp({ stored: { 'aegis-theme': 'light' } });
  app.initThemeToggle();
  assert.equal(dom.document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(dom.getById('themeToggleBtn').textContent, '☀️');
});
