'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadApp } = require('./helpers/load-app.js');

const INDEX_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'index.html'), 'utf8'
);

/** Han, Bopomofo and CJK punctuation — anything that should not reach English UI. */
const CJK = /[　-〿㄀-ㄯ㐀-䶿一-鿿＀-￯]/;

test('both dictionaries define exactly the same keys', () => {
  const { app } = loadApp();
  const zh = Object.keys(app.TRANSLATIONS['zh-TW']).sort();
  const en = Object.keys(app.TRANSLATIONS['en']).sort();

  const missingInEn = zh.filter(k => !en.includes(k));
  const missingInZh = en.filter(k => !zh.includes(k));

  assert.deepEqual(missingInEn, [], 'keys present in zh-TW but missing from en');
  assert.deepEqual(missingInZh, [], 'keys present in en but missing from zh-TW');
});

test('no dictionary entry is empty', () => {
  const { app } = loadApp();
  for (const [lang, dict] of Object.entries(app.TRANSLATIONS)) {
    for (const [key, value] of Object.entries(dict)) {
      assert.equal(typeof value, 'string', `${lang}.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${lang}.${key} must not be empty`);
    }
  }
});

test('every data-i18n attribute in index.html resolves in both languages', () => {
  const { app } = loadApp();
  const used = [...INDEX_HTML.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
  assert.ok(used.length > 0, 'index.html uses data-i18n');

  const unresolved = [...new Set(used)].filter(
    k => !app.TRANSLATIONS['zh-TW'][k] || !app.TRANSLATIONS['en'][k]
  );
  assert.deepEqual(unresolved, [], 'data-i18n keys with no translation');
});

test('the English dictionary contains no Chinese text', () => {
  const { app } = loadApp();
  const leaked = Object.entries(app.TRANSLATIONS['en'])
    .filter(([, v]) => CJK.test(v))
    .map(([k]) => k);
  assert.deepEqual(leaked, [], 'English strings must not fall back to Chinese');
});

test('the simulated-data disclosures exist in both languages', () => {
  const { app } = loadApp();
  const required = [
    'demoBanner', 'noteHeaders', 'notePassword', 'notePhishing',
    'noteDarkweb', 'noteDarkwebInline', 'noteDarkwebAction', 'noteCVE', 'noteAudit',
    'noteEmergency'
  ];
  for (const key of required) {
    for (const lang of ['zh-TW', 'en']) {
      assert.ok(app.TRANSLATIONS[lang][key], `${lang}.${key} is missing`);
    }
  }
});

test('the CVE section does not claim NVD or CISA KEV as its source', () => {
  const { app } = loadApp();
  for (const lang of ['zh-TW', 'en']) {
    const desc = app.TRANSLATIONS[lang].cveDesc;
    assert.doesNotMatch(desc, /NVD|CISA/i,
      `${lang}.cveDesc must not attribute the fabricated entries to a real catalog`);
  }
});

test('t() falls back to zh-TW rather than throwing on an unknown language', () => {
  const { app } = loadApp();
  app.setLanguage('zh-TW');
  assert.equal(app.t('demoBanner'), app.TRANSLATIONS['zh-TW'].demoBanner);
  app.setLanguage('en');
  assert.equal(app.t('demoBanner'), app.TRANSLATIONS['en'].demoBanner);
  assert.equal(app.t('noSuchKey'), '', 'unknown key yields an empty string, not undefined');
});

test('the ticker has an entry set for both languages', () => {
  const { app } = loadApp();
  assert.ok(Array.isArray(app.TICKER_ITEMS['zh-TW']));
  assert.ok(Array.isArray(app.TICKER_ITEMS['en']));
  assert.equal(app.TICKER_ITEMS['en'].length, app.TICKER_ITEMS['zh-TW'].length);
});

test('playbooks and quiz questions are defined for both languages', () => {
  const { app } = loadApp();
  assert.equal(app.PLAYBOOK_DATA['en'].length, app.PLAYBOOK_DATA['zh-TW'].length);
  assert.equal(app.QUIZ_QUESTIONS['en'].length, app.QUIZ_QUESTIONS['zh-TW'].length);
});

test('every CVE entry carries both a Chinese and an English title and description', () => {
  const { app } = loadApp();
  for (const cve of app.CVE_DATABASE) {
    for (const field of ['titleZh', 'titleEn', 'descZh', 'descEn']) {
      assert.ok(cve[field] && cve[field].trim(), `${cve.id} is missing ${field}`);
    }
    assert.doesNotMatch(cve.titleEn, CJK, `${cve.id} titleEn contains Chinese`);
    assert.doesNotMatch(cve.descEn, CJK, `${cve.id} descEn contains Chinese`);
  }
});
