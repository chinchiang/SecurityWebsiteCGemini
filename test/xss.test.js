'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.js');

const PAYLOAD = '<img src=x onerror=alert(1)>';

test('escapeHtml neutralises every character that can break out of a template', () => {
  const { app } = loadApp();
  assert.equal(app.escapeHtml(PAYLOAD), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(app.escapeHtml('&'), '&amp;');
  assert.equal(app.escapeHtml('"'), '&quot;');
  assert.equal(app.escapeHtml("'"), '&#39;');
  assert.equal(app.escapeHtml('a<b>&"\'c'), 'a&lt;b&gt;&amp;&quot;&#39;c');
});

test('escapeHtml coerces non-strings instead of throwing', () => {
  const { app } = loadApp();
  assert.equal(app.escapeHtml(undefined), 'undefined');
  assert.equal(app.escapeHtml(null), 'null');
  assert.equal(app.escapeHtml(42), '42');
});

/**
 * The reason escaping is mandatory even for values that came out of a URL
 * parser. This is not a test of our code — it pins the parser behaviour the
 * phishing inspector relies on, so that if it ever changes the assumption is
 * re-examined rather than silently trusted.
 */
test('new URL() rejects angle brackets in a host but permits double quotes', () => {
  assert.throws(() => new URL('http://exa<mple.com'), { name: 'TypeError' });

  const parsed = new URL('http://a"onmouseover="alert(1)');
  assert.ok(
    parsed.hostname.includes('"'),
    `expected a double quote to survive parsing, got ${JSON.stringify(parsed.hostname)}`
  );
});

test('showToast builds its content with textContent, never innerHTML', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('toastContainer');

  app.showToast(PAYLOAD, 'error');

  assert.equal(container.children.length, 1, 'one toast appended');
  const toast = container.children[0];

  assert.equal(toast.innerHTML, '', 'toast must not have markup assigned to innerHTML');

  const message = toast.children.find(c => c.textContent === PAYLOAD);
  assert.ok(message, 'payload must be present as text, not markup');
  assert.equal(message.innerHTML, '', 'payload must never reach innerHTML');
});

test('showToast marks the icon aria-hidden so it is not announced', () => {
  const { app, dom } = loadApp();
  app.showToast('done', 'success');
  const toast = dom.getById('toastContainer').children[0];
  const icon = toast.children[0];
  assert.equal(icon.getAttribute('aria-hidden'), 'true');
  assert.equal(icon.textContent, '✅');
});
