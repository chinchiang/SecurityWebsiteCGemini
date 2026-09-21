'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadApp } = require('./helpers/load-app.js');
const { stripHtmlComments } = require('./helpers/markup.js');

// Comments are stripped because index.html's comments quote the markup they
// explain — a sweep that reads them examines attributes that are not on the page,
// and, worse, holds the explanation of an old value to the rule that replaced it.
const INDEX_HTML = stripHtmlComments(fs.readFileSync(
  path.join(__dirname, '..', 'index.html'), 'utf8'
));

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

test('a language switch reaches text that lives in an attribute', () => {
  // setLanguage handled aria-label and nothing else, so `title="Toggle Theme"`
  // and the hero image's alt text were English in both languages. Beyond the
  // list, this walks app.js's own array rather than naming the attributes again:
  // an entry added without teaching the loop about it fails here.
  const { app, dom } = loadApp();
  assert.deepEqual(app.TRANSLATED_ATTRIBUTES, ['aria-label', 'title', 'alt', 'placeholder'],
    'the attributes on the page whose value is text a visitor reads');

  const elements = app.TRANSLATED_ATTRIBUTES.map(attribute => {
    const el = dom.createElement('span');
    el.setAttribute(`data-i18n-${attribute}`, 'modalClose');
    return dom.registerI18nAttr(attribute, el);
  });

  for (const lang of ['en', 'zh-TW']) {
    app.setLanguage(lang);
    app.TRANSLATED_ATTRIBUTES.forEach((attribute, i) => {
      assert.equal(elements[i].getAttribute(attribute), app.TRANSLATIONS[lang].modalClose,
        `${attribute} kept its old value through a switch to ${lang}`);
    });
  }
});

test('a field hint follows the language switch through the property the field reads', () => {
  // The six placeholders were six getElementById calls inside setLanguage, each
  // assigning el.placeholder — the very list the comment above the loop claimed
  // nobody would have to remember to extend. They declare a key in the markup
  // now, so the loop writes the attribute; a browser reflects that into the
  // property, and dom-stub reflects it too rather than keeping a stale copy.
  const { app, dom } = loadApp();
  const input = dom.registerId('domainInput', dom.createElement('input'));
  input.setAttribute('data-i18n-placeholder', 'p1Placeholder');
  dom.registerI18nAttr('placeholder', input);

  app.setLanguage('en');
  assert.equal(input.getAttribute('placeholder'), app.TRANSLATIONS['en'].p1Placeholder);
  assert.equal(input.placeholder, app.TRANSLATIONS['en'].p1Placeholder,
    'the attribute was written but the property a form field reads was not');

  app.setLanguage('zh-TW');
  assert.equal(input.placeholder, app.TRANSLATIONS['zh-TW'].p1Placeholder,
    'the hint stayed in English');
});

test('no translated attribute is written by hand outside the loop', () => {
  // Six placeholders were wired one id at a time, and the seventh would have
  // been too. A hand-written assignment is invisible to every guard here: it
  // cannot be found in the markup, so it is neither checked for a key nor for
  // what it claims. The loop is the only writer.
  const { app, source } = loadApp();
  const loop = 'el.setAttribute(attribute, dictionary[key]);';
  assert.ok(source.includes(loop), 'the one line allowed to write these has moved');
  const rest = source.replace(loop, '');

  for (const attribute of app.TRANSLATED_ATTRIBUTES) {
    const property = attribute.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    assert.doesNotMatch(rest, new RegExp(`setAttribute\\(\\s*['"\`]${attribute}['"\`]`),
      `${attribute} is set by hand; declare data-i18n-${attribute} in the markup instead`);
    assert.doesNotMatch(rest, new RegExp(`\\.${property}\\s*=[^=]`),
      `.${property} is assigned by hand; declare data-i18n-${attribute} in the markup instead`);
  }
});

test('an attribute whose key does not resolve keeps the value the markup gave it', () => {
  // A typo in the key should leave a stale name, not erase the name: for a
  // control whose only content is a glyph, an empty aria-label is no name at all.
  const { app, dom } = loadApp();
  const el = dom.createElement('button');
  el.setAttribute('aria-label', '關閉對話框');
  el.setAttribute('data-i18n-aria-label', 'noSuchKeyInEitherDictionary');
  dom.registerI18nAttr('aria-label', el);

  app.setLanguage('en');
  assert.equal(el.getAttribute('aria-label'), '關閉對話框',
    'an unresolved key wiped the accessible name instead of leaving it');
});

test('every data-i18n-<attribute> in index.html resolves in both languages', () => {
  // A missing key here fails silently and invisibly: setLanguage skips the
  // element, and the control keeps whatever accessible name it was born with —
  // for the modal close button, the bare × glyph, i.e. none.
  const { app } = loadApp();
  const used = [...INDEX_HTML.matchAll(/data-i18n-([a-z][\w-]*)="([^"]+)"/g)];
  assert.ok(used.length >= 10, `only ${used.length} translated attributes found; the sweep is broken`);

  for (const [, attribute, key] of used) {
    // An attribute setLanguage does not iterate is markup that looks translated
    // and is not, which is the failure this whole mechanism exists to prevent.
    assert.ok(app.TRANSLATED_ATTRIBUTES.includes(attribute),
      `data-i18n-${attribute} is not an attribute setLanguage translates`);

    for (const lang of ['zh-TW', 'en']) {
      assert.ok(app.TRANSLATIONS[lang][key],
        `${lang}.${key} is missing, so ${attribute} would keep the other language's text`);
    }
  }
});

test('an element with an i18n aria-label carries no conflicting text', () => {
  // aria-label overrides the element's content outright, so an element carrying
  // both is one where the visible text is not what gets announced. A bare glyph
  // — &times;, an emoji — is the legitimate case, and the reason for the label:
  // it is what the element has instead of a name, not a second one.
  for (const tag of INDEX_HTML.matchAll(/<([a-z]+)\b[^>]*data-i18n-aria-label="[^"]*"[^>]*>([^<]*)</g)) {
    const words = tag[2].replace(/&(?:[a-z]+|#\d+|#x[0-9a-f]+);/gi, '');
    assert.doesNotMatch(words, /[A-Za-z一-鿿]/,
      `${tag[1]} has both an aria-label and visible text: "${tag[2].trim()}"`);
  }
});

/**
 * A name that would have the page assert a service it does not run. The ticker
 * region was called "Live Threat Stream"; a name is read out to exactly the
 * visitor who cannot see the 「示範網站聲明」banner two elements below it.
 */
const CLAIMS_LIVE = /\blive\b|real-?time|monitoring|platform|即時|實時|平台/i;

test('every name the page carries is translatable, and none of them claims a live service', () => {
  // The whole page in one sweep rather than the names that happened to be wrong:
  // every attribute setLanguage translates is text a visitor reads, and three of
  // the five accessible names on the page were hardcoded English that no language
  // switch could reach. Both directions are checked here, because they are two
  // halves of one pairing: a name must declare a key, and a declared key must
  // have the zh-TW string as its pre-JavaScript fallback.
  const { app } = loadApp();
  let examined = 0;

  for (const [tag] of INDEX_HTML.matchAll(/<[a-z][^>]*>/g)) {
    for (const attribute of app.TRANSLATED_ATTRIBUTES) {
      // `(?:^|\s)` so that data-i18n-alt="…" is not read as alt="…".
      const shown = new RegExp(`(?:^|\\s)${attribute}="([^"]*)"`).exec(tag);
      const declared = new RegExp(`data-i18n-${attribute}="([^"]+)"`).exec(tag);
      if (!shown && !declared) continue;
      examined++;

      // alt="" is the one legitimate untranslatable value: it declares the image
      // decorative, and there is no text to translate.
      if (shown && shown[1] === '') {
        assert.equal(attribute, 'alt', `${attribute}="" names nothing; remove it instead`);
        assert.equal(declared, null, `an empty ${attribute} with a translation key is a contradiction`);
        continue;
      }

      assert.ok(declared, `${attribute}=${JSON.stringify(shown[1])} cannot be translated; add data-i18n-${attribute}`);
      assert.ok(shown, `data-i18n-${attribute}="${declared[1]}" has no static ${attribute} to fall back to`);
      assert.equal(shown[1], app.TRANSLATIONS['zh-TW'][declared[1]],
        `the static ${attribute} and zh-TW.${declared[1]} disagree about what this is called`);

      for (const lang of ['zh-TW', 'en']) {
        assert.doesNotMatch(app.TRANSLATIONS[lang][declared[1]], CLAIMS_LIVE,
          `${lang}.${declared[1]} is announced as a live service this page does not run`);
      }
    }
  }

  assert.ok(examined >= 12, `only ${examined} names examined; the sweep found less than the page carries`);
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
