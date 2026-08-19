'use strict';

/**
 * Two failure paths in the SHA-256 panel that had no handling.
 *
 * 1. SubtleCrypto is only exposed in a secure context. Served over plain http://
 *    from anything but localhost — a LAN demo, an office share, an S3 bucket
 *    without TLS — `crypto.subtle` is undefined, so `crypto.subtle.digest(...)`
 *    threw a TypeError. The catch printed a hardcoded English "Error computing
 *    hash", which named neither the cause nor the fix and did not translate.
 *
 * 2. `navigator.clipboard.writeText()` was called with no catch. It is also
 *    absent outside a secure context, and it rejects when the permission is
 *    denied or the document is not focused. Either way the old code raised an
 *    unhandled rejection and then claimed success in a toast regardless.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app.js');

/** The text of every toast currently in the container. */
function toasts(dom) {
  return dom.getById('toastContainer').children.map(c => c.renderedText);
}

/** Type into the password field and wait for the hash to be written. */
async function type(app, dom, value) {
  const input = dom.getById('passInput');
  app.initPasswordEntropyEngine();
  input.value = value;
  await input.dispatchAsync('input');
  return dom.getById('sha256HashOutput');
}

/** Press Copy Hash and wait for the clipboard write to settle or reject. */
async function copy(dom) {
  await dom.getById('copyHashBtn').dispatchAsync('click');
}

test('a hash is computed and offered to the clipboard', async () => {
  const { app, dom } = loadApp();
  const output = await type(app, dom, 'correct horse battery staple');

  // Known-answer test: the panel must show the real digest, not a placeholder.
  assert.equal(output.textContent,
    'c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a');
  assert.equal(dom.getById('copyHashBtn').disabled, false);

  await copy(dom);
  assert.deepEqual(dom.clipboardWrites, [output.textContent]);
  assert.match(toasts(dom).join('\n'), /copied to clipboard|已複製至剪貼簿/);
});

test('an empty field shows the digest of the empty string', async () => {
  const { app, dom } = loadApp();
  const output = await type(app, dom, '');
  assert.equal(output.textContent, app.EMPTY_SHA256);
  assert.equal(dom.getById('copyHashBtn').disabled, false);
});

test('an insecure context is explained instead of reported as an error', async () => {
  const { app, dom } = loadApp({ crypto: 'missing' });
  app.setLanguage('zh-TW');

  const output = await type(app, dom, 'hunter2');

  assert.equal(app.subtleCryptoAvailable(), false);
  assert.match(output.textContent, /secure context/,
    'the message must name the cause: the page origin, not the input');
  assert.match(output.textContent, /https:\/\/ 或 localhost/,
    'and the fix');
  assert.doesNotMatch(output.textContent, /^[0-9a-f]{64}$/, 'no hash should be claimed');
});

test('the insecure-context notice follows a language switch', async () => {
  const { app, dom } = loadApp({ crypto: 'missing' });
  app.setLanguage('zh-TW');
  const output = await type(app, dom, 'hunter2');

  assert.equal(output.textContent, app.TRANSLATIONS['zh-TW'].p2HashInsecureContext);
  app.setLanguage('en');
  assert.equal(output.textContent, app.TRANSLATIONS['en'].p2HashInsecureContext,
    'the notice stayed in the previous language');
});

test('the app still loads with no crypto global whatsoever', async () => {
  // Not just a missing `subtle`: some hardened environments remove `crypto`.
  // `typeof` guards this, so it must not throw at load or on input.
  const { app, dom } = loadApp({ crypto: 'absent' });
  assert.equal(app.subtleCryptoAvailable(), false);
  const output = await type(app, dom, 'anything');
  assert.equal(output.textContent, app.TRANSLATIONS['zh-TW'].p2HashInsecureContext);
});

test('a notice is never handed to the clipboard as if it were a hash', async () => {
  const { app, dom } = loadApp({ crypto: 'missing' });
  await type(app, dom, 'hunter2');

  const copyBtn = dom.getById('copyHashBtn');
  assert.equal(copyBtn.disabled, true, 'nothing to copy, so the button is disabled');

  // A click can still arrive from assistive tooling or a stale event.
  await copyBtn.dispatchAsync('click');
  assert.deepEqual(dom.clipboardWrites, [], 'the notice text must not reach the clipboard');
  assert.deepEqual(toasts(dom), [], 'and no success toast should be shown');
});

test('a denied clipboard permission is reported, not swallowed', async () => {
  const { app, dom } = loadApp({ clipboard: 'reject' });
  app.setLanguage('en');
  await type(app, dom, 'hunter2');

  await copy(dom);

  assert.deepEqual(dom.clipboardWrites, []);
  const text = toasts(dom).join('\n');
  assert.match(text, /Clipboard access failed/);
  assert.doesNotMatch(text, /copied to clipboard/,
    'success must not be claimed when the write rejected');
});

test('a missing clipboard API is reported, not thrown', async () => {
  // navigator.clipboard is undefined outside a secure context, so the property
  // access itself throws — it has to be inside the try, not just the await.
  const { app, dom } = loadApp({ clipboard: 'missing' });
  app.setLanguage('zh-TW');
  await type(app, dom, 'hunter2');

  // dispatch(), not dispatchAsync(): the point is that the synchronous property
  // access on an absent navigator.clipboard does not escape the handler.
  assert.doesNotThrow(() => dom.getById('copyHashBtn').dispatch('click'));
  await copy(dom);
  assert.match(toasts(dom).join('\n'), /無法存取剪貼簿/);
});

test('the copy toast is in the language active when the button was pressed', async () => {
  const { app, dom } = loadApp({ clipboard: 'reject' });
  app.setLanguage('zh-TW');
  await type(app, dom, 'hunter2');

  await copy(dom);
  assert.match(toasts(dom).join('\n'), /無法存取剪貼簿/);
});

// The guard that no hardcoded English failure string is left in a template lives
// in static-source.test.js, which already strips comments before matching — the
// old message is quoted in a comment above.
