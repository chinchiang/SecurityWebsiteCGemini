'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createDom } = require('./dom-stub.js');

// AEGIS_APP_PATH lets the suite be pointed at an older app.js to confirm these
// tests actually fail on the code they were written against.
const APP_PATH = process.env.AEGIS_APP_PATH
  ? path.resolve(process.env.AEGIS_APP_PATH)
  : path.join(__dirname, '..', '..', 'app.js');

/**
 * Top-level names in app.js that tests reach into.
 *
 * app.js is a plain browser script with no module system, so it is wrapped in a
 * function and handed the browser globals it uses. `let`/`const` bindings are
 * lexical and would be invisible from outside, so an epilogue re-exposes them
 * as live getters — reading `quizTotalScore` after a click really does read
 * app.js's variable, not a copy taken at load time.
 */
const EXPOSED = [
  'escapeHtml', 't', 'setLanguage', 'currentLang', 'showToast',
  'TRANSLATIONS', 'TICKER_ITEMS', 'CVE_DATABASE', 'QUIZ_QUESTIONS', 'PLAYBOOK_DATA',
  'renderAuditQuiz', 'renderPlaybooks', 'renderCVEs', 'showQuizResult',
  'quizCurrentStep', 'quizTotalScore',
  'cveActiveSeverity', 'cveSearchQuery',
  'initCVEExplorer', 'initPasswordEntropyEngine', 'initAuditQuiz',
  'estimatePasswordStrength', 'formatCrackTime', 'crackTimeSeconds'
];

function readSource() {
  return fs.readFileSync(APP_PATH, 'utf8');
}

/**
 * Load app.js against a fresh DOM stub.
 * @returns {{app: object, dom: object, source: string}}
 */
function loadApp() {
  const dom = createDom();
  const source = readSource();

  // `typeof` on an undeclared identifier is safe, so a name that does not exist
  // (yet) simply reads as undefined instead of throwing at load time.
  const epilogue = '\n;return {' +
    EXPOSED.map(n => `get ${n}(){ return typeof ${n} === 'undefined' ? undefined : ${n}; }`).join(',') +
    '};\n';

  const factory = new Function(
    'document', 'window', 'localStorage', 'navigator',
    'requestAnimationFrame', 'cancelAnimationFrame', 'setInterval', 'setTimeout',
    source + epilogue
  );

  // Timers are queued, not run. Callers flush them explicitly, so a test can
  // inspect state between "result rendered" and "toast auto-dismissed".
  let queue = [];
  const setTimeoutStub = (fn) => { queue.push(fn); return queue.length; };

  /** Run pending timers, including ones they schedule, up to `rounds` deep. */
  const flushTimers = (rounds = 4) => {
    for (let i = 0; i < rounds && queue.length; i++) {
      const due = queue;
      queue = [];
      due.forEach(fn => fn());
    }
    return queue.length; // still-pending count
  };

  const app = factory(
    dom.document,
    dom.window,
    dom.localStorage,
    dom.navigator,
    () => 0,          // requestAnimationFrame: never paint
    () => {},         // cancelAnimationFrame
    () => 0,          // setInterval: never tick
    setTimeoutStub
  );

  return { app, dom, source, flushTimers, pendingTimers: () => queue.length };
}

module.exports = { loadApp, readSource, APP_PATH, EXPOSED };
