'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.js');

/**
 * Regression cover for the listener-accumulation bug.
 *
 * renderAuditQuiz() replaces #quizWizard's innerHTML on every language switch
 * and restart, but the container element survives. The original code bound a
 * fresh listener on each render (plus one from DOMContentLoaded), so listeners
 * accumulated and each stale one carried its own step/score closure. Completing
 * the quiz, pressing Restart and clicking once produced 120 / 100 — a score
 * above the stated maximum.
 */

/** Fire every listener on the wizard, as a real browser would. */
function clickWizard(wizard, matcher) {
  wizard.dispatch('click', { target: { closest: sel => matcher(sel) } });
}

const answerButton = score => sel =>
  (sel === '.quiz-opt-btn' ? { getAttribute: () => String(score), closest: () => null } : null);

const idButton = id => sel => (sel === id ? {} : null);

function countSteps(html) {
  return (html.match(/data-step="\d+"/g) || []).length;
}

test('exactly one click listener survives repeated renders', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');

  app.renderAuditQuiz();
  assert.equal(wizard.listeners.length, 1, 'one listener after the first render');

  app.renderAuditQuiz();
  app.renderAuditQuiz();
  app.renderAuditQuiz();
  assert.equal(wizard.listeners.length, 1, 'still one listener after four renders');
});

test('the bind marker lives on the element, so a replaced container rebinds', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');

  app.renderAuditQuiz();
  assert.equal(wizard.dataset.quizBound, '1');

  // Simulate the container being swapped out: a fresh element must get its own
  // listener rather than being treated as already bound.
  delete wizard.dataset.quizBound;
  wizard.listeners = [];
  app.renderAuditQuiz();
  assert.equal(wizard.listeners.length, 1);
});

test('every render resets step and score', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');

  app.renderAuditQuiz();
  clickWizard(wizard, answerButton(20));
  clickWizard(wizard, answerButton(20));
  assert.equal(app.quizTotalScore, 40);
  assert.equal(app.quizCurrentStep, 3);

  app.renderAuditQuiz();
  assert.equal(app.quizCurrentStep, 1, 'step reset');
  assert.equal(app.quizTotalScore, 0, 'score reset');
});

test('answering every question scores at most 100 and reaches the result step', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');

  app.renderAuditQuiz();
  const questions = countSteps(wizard.innerHTML);
  assert.equal(questions, app.QUIZ_QUESTIONS['zh-TW'].length, 'one step per question');

  for (let i = 0; i < questions; i++) clickWizard(wizard, answerButton(20));

  assert.equal(app.quizTotalScore, 100);
  assert.equal(app.quizCurrentStep, questions + 1, 'advanced past the last question');
  assert.ok(dom.getById('quizResultStep').classList.contains('active'), 'result step shown');
  assert.equal(dom.getById('quizFinalScore').textContent, '100 / 100');
});

test('restart clears state and the first click does not jump to the result', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');
  const resultStep = dom.getById('quizResultStep');
  const finalScore = dom.getById('quizFinalScore');

  app.renderAuditQuiz();
  const questions = countSteps(wizard.innerHTML);
  for (let i = 0; i < questions; i++) clickWizard(wizard, answerButton(20));

  clickWizard(wizard, idButton('#restartQuizBtn'));
  assert.equal(app.quizCurrentStep, 1);
  assert.equal(app.quizTotalScore, 0);

  // The stub does not reparse innerHTML, so these two nodes persist where a
  // browser would recreate them empty. Clear them by hand: what is being
  // asserted is that ONE answer click does not repopulate them.
  resultStep.classList.remove('active');
  finalScore.textContent = '';

  clickWizard(wizard, answerButton(20));

  assert.equal(app.quizCurrentStep, 2, 'advanced to question 2, not the result');
  assert.equal(app.quizTotalScore, 20, 'exactly one answer counted');
  assert.equal(resultStep.classList.contains('active'), false, 'result step still hidden');
  assert.equal(finalScore.textContent, '', 'no score rendered');
});

test('score can never exceed the stated maximum', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');

  // Three full runs with a restart between each: the failure mode was score
  // accumulating across runs.
  for (let run = 0; run < 3; run++) {
    app.renderAuditQuiz();
    const questions = countSteps(wizard.innerHTML);
    for (let i = 0; i < questions; i++) clickWizard(wizard, answerButton(20));
    assert.equal(app.quizTotalScore, 100, `run ${run + 1} scored 100, not more`);
    clickWizard(wizard, idButton('#restartQuizBtn'));
  }
});

test('the progress counter is derived from the question count, not hardcoded', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');
  const total = app.QUIZ_QUESTIONS['zh-TW'].length;

  app.renderAuditQuiz();
  assert.match(wizard.innerHTML, new RegExp(`問題 1 / ${total}`));

  app.setLanguage('en');
  assert.match(wizard.innerHTML, new RegExp(`QUESTION 1 OF ${total}`));
  assert.equal(app.QUIZ_QUESTIONS['en'].length, total, 'both languages ask the same number');

  // Asserting against the current count cannot distinguish "derived" from a
  // literal that happens to match. Add a question and the counter must follow.
  const extra = { title: 'probe', opts: [{ text: 'probe', score: 0 }] };
  app.QUIZ_QUESTIONS['en'].push(extra);
  try {
    app.renderAuditQuiz();
    assert.match(wizard.innerHTML, new RegExp(`QUESTION 1 OF ${total + 1}`),
      'counter must track questions.length');
    assert.equal(countSteps(wizard.innerHTML), total + 1, 'a step is rendered per question');
  } finally {
    app.QUIZ_QUESTIONS['en'].pop();
  }
});

test('the result template ships no pre-filled score or tier', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');
  app.renderAuditQuiz();

  assert.match(wizard.innerHTML, /id="quizFinalScore"[^>]*>\s*</, '#quizFinalScore is empty');
  assert.match(wizard.innerHTML, /id="quizTierBadge"[^>]*>\s*</, '#quizTierBadge is empty');
  assert.match(wizard.innerHTML, /id="quizRecommendation"[^>]*>\s*</, '#quizRecommendation is empty');
  assert.doesNotMatch(wizard.innerHTML, /TIER 4|ENTERPRISE SENTINEL|0 \/ 100/,
    'a broken scoring path must not surface as a flattering grade');
});

test('the result step carries the scoring disclaimer', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');
  app.renderAuditQuiz();
  assert.match(wizard.innerHTML, /demo-note/, 'audit disclaimer present');
});

test('the print button is delegated, not an inline attribute', () => {
  const { app, dom } = loadApp();
  const wizard = dom.getById('quizWizard');
  app.renderAuditQuiz();

  assert.doesNotMatch(wizard.innerHTML, /onclick=/, 'no inline handler in the rendered markup');
  assert.equal(dom.window._printed, false);
  clickWizard(wizard, idButton('#printReportBtn'));
  assert.equal(dom.window._printed, true, '#printReportBtn triggers window.print');
});

test('tier bands map score to the documented label', () => {
  const cases = [
    { score: 100, zh: /層級 4/, en: /TIER 4/ },
    { score: 85, zh: /層級 4/, en: /TIER 4/ },
    { score: 84, zh: /層級 3/, en: /TIER 3/ },
    { score: 60, zh: /層級 3/, en: /TIER 3/ },
    { score: 59, zh: /層級 1-2/, en: /TIER 1-2/ },
    { score: 0, zh: /層級 1-2/, en: /TIER 1-2/ }
  ];

  for (const lang of ['zh-TW', 'en']) {
    for (const c of cases) {
      const { app, dom } = loadApp();
      const wizard = dom.getById('quizWizard');
      app.setLanguage(lang);
      app.renderAuditQuiz();

      // Reach the score by answering; 20 points per click keeps this honest
      // about going through the real state machine.
      const questions = (wizard.innerHTML.match(/data-step="\d+"/g) || []).length;
      let remaining = c.score;
      for (let i = 0; i < questions; i++) {
        const step = Math.min(20, remaining);
        remaining -= step;
        clickWizard(wizard, answerButton(step));
      }

      const badge = dom.getById('quizTierBadge').textContent;
      assert.match(badge, lang === 'zh-TW' ? c.zh : c.en,
        `${lang} score ${c.score} -> ${JSON.stringify(badge)}`);
    }
  }
});
