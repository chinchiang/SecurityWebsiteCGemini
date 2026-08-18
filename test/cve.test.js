'use strict';

/**
 * renderCVEs() and its filter state used to live inside initCVEExplorer's
 * closure, so setLanguage() had no way to call it. Switching language left every
 * CVE card in the previous language until the user typed in the search box or
 * clicked a severity filter.
 *
 * Hoisting the state to module scope introduces the opposite risk — that a
 * language switch resets a filter the user set — so both directions are pinned
 * here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app.js');

/** A severity filter button as it appears in the static markup. */
function addFilterButton(dom, severity) {
  const btn = dom.createElement('button');
  btn.setAttribute('data-severity', severity);
  return dom.registerClass('filter-btn', btn);
}

test('renderCVEs is callable from module scope', () => {
  const { app } = loadApp();
  assert.equal(typeof app.renderCVEs, 'function');
});

test('the card list follows a language switch', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  const first = app.CVE_DATABASE[0];

  app.setLanguage('zh-TW');
  assert.ok(container.innerHTML.includes(first.titleZh), 'Chinese titles missing');
  assert.ok(!container.innerHTML.includes(first.titleEn), 'English titles should be gone');

  app.setLanguage('en');
  assert.ok(container.innerHTML.includes(first.titleEn),
    'switching to English left the cards in Chinese');
  assert.ok(!container.innerHTML.includes(first.titleZh), 'Chinese titles should be gone');
});

test('both the label and the body of a card are translated', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  const first = app.CVE_DATABASE[0];

  app.setLanguage('en');
  assert.ok(container.innerHTML.includes('Software:'));
  assert.ok(container.innerHTML.includes('Disclosed:'));
  assert.ok(container.innerHTML.includes(first.descEn));

  app.setLanguage('zh-TW');
  assert.ok(container.innerHTML.includes('影響軟體:'));
  assert.ok(container.innerHTML.includes('揭露日期:'));
  assert.ok(container.innerHTML.includes(first.descZh));
});

test('an unfiltered list shows every record in the database', () => {
  const { app, dom } = loadApp();
  app.setLanguage('en');
  const html = dom.getById('cveListContainer').innerHTML;
  for (const record of app.CVE_DATABASE) {
    assert.ok(html.includes(record.id), `${record.id} is missing from the list`);
  }
});

test('a severity filter survives a language switch', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');

  const critical = app.CVE_DATABASE.filter(c => c.severity === 'CRITICAL');
  const others = app.CVE_DATABASE.filter(c => c.severity !== 'CRITICAL');
  assert.ok(critical.length > 0 && others.length > 0,
    'the fixture needs at least one record on each side of the filter');

  const btn = addFilterButton(dom, 'CRITICAL');
  app.initCVEExplorer();
  app.setLanguage('en');
  btn.dispatch('click');

  assert.equal(app.cveActiveSeverity, 'CRITICAL');
  assert.ok(btn.classList.contains('active'), 'the clicked button should be marked active');
  for (const record of others) {
    assert.ok(!container.innerHTML.includes(record.id), `${record.id} should be filtered out`);
  }

  app.setLanguage('zh-TW');
  assert.equal(app.cveActiveSeverity, 'CRITICAL', 'the language switch reset the filter');
  for (const record of others) {
    assert.ok(!container.innerHTML.includes(record.id),
      `${record.id} came back after the language switch`);
  }
  assert.ok(container.innerHTML.includes(critical[0].titleZh),
    'the surviving cards should now be in Chinese');
});

test('a search query survives a language switch', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  const input = dom.getById('cveSearchInput');
  const target = app.CVE_DATABASE[0];

  app.initCVEExplorer();
  app.setLanguage('en');

  input.value = target.id;
  input.dispatch('input');
  assert.equal(app.cveSearchQuery, target.id.toLowerCase());
  assert.ok(container.innerHTML.includes(target.id));

  app.setLanguage('zh-TW');
  assert.equal(app.cveSearchQuery, target.id.toLowerCase(), 'the language switch reset the search');
  assert.ok(container.innerHTML.includes(target.id));
  for (const record of app.CVE_DATABASE.slice(1)) {
    if (record.software === target.software) continue;   // the query may match both
    assert.ok(!container.innerHTML.includes(record.id),
      `${record.id} does not match the query and should be hidden`);
  }
});

test('the search is case-insensitive across both languages', () => {
  const { app, dom } = loadApp();
  const input = dom.getById('cveSearchInput');

  app.initCVEExplorer();
  app.setLanguage('en');
  input.value = '  LINUX  ';
  input.dispatch('input');
  assert.equal(app.cveSearchQuery, 'linux', 'the query should be trimmed and lowercased');
});

test('the no-results message is translated', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  const input = dom.getById('cveSearchInput');

  app.initCVEExplorer();
  input.value = 'zzzz-no-such-record';
  input.dispatch('input');

  app.setLanguage('en');
  assert.match(container.innerHTML, /No CVE records matched/);
  app.setLanguage('zh-TW');
  assert.ok(container.innerHTML.includes('沒有找到符合搜尋條件'),
    'the empty state stayed in English');
});

test('the search query is never echoed into the rendered markup', () => {
  // The query is a filter input, not display text. If it were ever interpolated
  // into the card template it would be a DOM XSS sink, so assert it stays out.
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  const input = dom.getById('cveSearchInput');

  app.initCVEExplorer();
  app.setLanguage('en');
  input.value = '<img src=x onerror=alert(1)>';
  input.dispatch('input');

  assert.ok(!container.innerHTML.includes('onerror'),
    'the query reached the markup; escape it or keep it out');
  assert.ok(!container.innerHTML.includes('<img'));
});

// Not tested here: that renderCVEs() tolerates a missing #cveListContainer.
// The DOM stub auto-creates any element asked for by id, so such a test would
// pass without ever reaching the guard — see the note in dom-stub.js. The guard
// is `if (!container) return` on the first two lines of the function.

test('initCVEExplorer does not render, so it cannot render the wrong language', () => {
  const { app, dom } = loadApp();
  const container = dom.getById('cveListContainer');
  app.initCVEExplorer();
  assert.equal(container.innerHTML, '',
    'the initial paint belongs to setLanguage(), which knows the active language');
});
