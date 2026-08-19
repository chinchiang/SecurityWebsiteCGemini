'use strict';

/**
 * The smallest DOM surface app.js actually touches.
 *
 * Two deliberate design rules:
 *
 * 1. Unsupported selectors THROW. A stub that quietly returns null turns a real
 *    regression into a passing test, which is worse than having no test.
 * 2. No HTML parsing. innerHTML is stored as a string, so elements written by a
 *    render are not walked. Where a test needs one of them (#quizFinalScore,
 *    #quizResultStep) getElementById auto-creates a stable stub, and the test
 *    resets it explicitly to keep the assertion meaningful. Tests that care
 *    about rendered markup assert on the innerHTML string instead.
 */

function makeClassList() {
  const set = new Set();
  return {
    add: (...names) => names.forEach(n => set.add(n)),
    remove: (...names) => names.forEach(n => set.delete(n)),
    contains: name => set.has(name),
    toggle: (name, force) => {
      const on = force === undefined ? !set.has(name) : Boolean(force);
      if (on) set.add(name); else set.delete(name);
      return on;
    },
    get length() { return set.size; },
    values: () => [...set]
  };
}

function createElement(env, tagName) {
  const el = {
    tagName: String(tagName).toUpperCase(),
    id: '',
    dataset: {},
    style: {},
    attributes: {},
    classList: makeClassList(),
    listeners: [],
    children: [],
    parentNode: null,
    textContent: '',
    value: '',
    placeholder: '',
    checked: false,
    disabled: false,
    _html: '',

    get innerHTML() { return this._html; },
    set innerHTML(html) {
      // Matches the browser: assigning innerHTML destroys descendants but
      // leaves this element (and therefore its listeners) in place. That
      // asymmetry is the whole reason the audit-quiz bug existed.
      this._html = String(html);
      this.children = [];
    },

    addEventListener(type, fn) { this.listeners.push({ type, fn }); },
    removeEventListener(type, fn) {
      this.listeners = this.listeners.filter(l => !(l.type === type && l.fn === fn));
    },

    /** Fire every listener of `type`, as a real browser would. */
    dispatch(type, event = {}) {
      const ev = { type, target: el, preventDefault() {}, stopPropagation() {}, ...event };
      this.listeners.filter(l => l.type === type).forEach(l => l.fn(ev));
      return ev;
    },

    /**
     * Like dispatch, but awaits whatever the listeners return.
     *
     * A browser ignores the promise from an `async` handler, so dispatch()
     * models it faithfully — but a test that then asserts on the result of an
     * awaited crypto.subtle.digest() has to wait for it somehow. Polling the DOM
     * for a fixed number of ticks is a flake; awaiting the handler's own promise
     * is exact.
     */
    async dispatchAsync(type, event = {}) {
      const ev = { type, target: el, preventDefault() {}, stopPropagation() {}, ...event };
      await Promise.all(this.listeners.filter(l => l.type === type).map(l => l.fn(ev)));
      return ev;
    },

    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') this.id = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name] : null;
    },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    removeAttribute(name) { delete this.attributes[name]; },

    append(...nodes) {
      nodes.forEach(n => { if (n && typeof n === 'object') n.parentNode = this; this.children.push(n); });
    },
    appendChild(node) { this.append(node); return node; },
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter(c => c !== this);
      this.parentNode = null;
    },

    closest() { return null; },
    focus() {}, blur() {}, scrollIntoView() {},

    querySelector(sel) { return env.select(sel, this)[0] || null; },
    querySelectorAll(sel) { return env.select(sel, this); },

    /** Concatenated text of everything appended via append/appendChild. */
    get renderedText() {
      return this.children.map(c => (c && c.renderedText !== undefined ? c.renderedText : String(c)))
        .concat(this.textContent ? [this.textContent] : [])
        .join('');
    }
  };
  return el;
}

/**
 * @param {object} [options]
 * @param {'ok'|'throw'|'missing'} [options.storage] localStorage behaviour.
 *   'throw' is Safari private browsing / "block all cookies" / a full quota:
 *   the call raises instead of returning null. 'missing' is the rarer case of
 *   no localStorage object at all, which makes the property access itself throw.
 * @param {'ok'|'reject'|'missing'} [options.clipboard] navigator.clipboard
 *   behaviour. 'reject' is a denied permission or an unfocused document;
 *   'missing' is an insecure context, where the API is not exposed at all.
 */
function createDom(options = {}) {
  const byId = new Map();
  const byClass = new Map();     // class name -> elements registered by a test
  const i18nElements = [];
  const scopedSteps = new Map(); // scope element -> Map(stepNumber -> element)

  const env = {
    select(sel, scope) {
      // `.quiz-step[data-step="N"]`, always queried against #quizWizard.
      const step = /^\.quiz-step\[data-step="(\d+)"\]$/.exec(sel);
      if (step) {
        if (!scope) throw new Error('dom-stub: step selector must be scoped to an element');
        const n = step[1];
        // The step exists only if the last render actually emitted it.
        if (!new RegExp(`data-step="${n}"`).test(scope._html)) return [];
        if (!scopedSteps.has(scope)) scopedSteps.set(scope, new Map());
        const cache = scopedSteps.get(scope);
        if (!cache.has(n)) {
          const el = createElement(env, 'div');
          el.setAttribute('data-step', n);
          cache.set(n, el);
        }
        return [cache.get(n)];
      }

      if (sel === '[data-i18n]') return [...i18nElements];

      const cls = /^\.([A-Za-z][\w-]*)$/.exec(sel);
      if (cls) return [...(byClass.get(cls[1]) || [])];

      throw new Error(`dom-stub: unsupported selector ${JSON.stringify(sel)} — teach the stub instead of loosening it`);
    }
  };

  // A real element rather than a stub literal, so data-theme round-trips through
  // setAttribute/getAttribute the way initThemeToggle expects.
  const documentElement = createElement(env, 'html');
  documentElement.lang = '';
  documentElement.style.setProperty = () => {};

  const document = {
    documentElement,
    body: null,

    getElementById(id) {
      if (!byId.has(id)) {
        const el = createElement(env, 'div');
        el.id = id;
        byId.set(id, el);
      }
      return byId.get(id);
    },
    createElement(tag) { return createElement(env, tag); },
    querySelector(sel) { return env.select(sel, null)[0] || null; },
    querySelectorAll(sel) { return env.select(sel, null); },
    addEventListener() {},   // DOMContentLoaded never fires in these tests
    removeEventListener() {}
  };
  document.body = createElement(env, 'body');

  const window = {
    print() { window._printed = true; },
    _printed: false,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    scrollTo() {},
    addEventListener() {},
    location: { href: 'https://example.test/', search: '' }
  };

  // Seeded before app.js is evaluated, so a test can exercise the "returning
  // visitor" path: currentLang is read once, at the top of the file.
  const store = new Map(Object.entries(options.stored || {}));
  const storageMode = options.storage || 'ok';
  const refuse = () => {
    // Mirrors the real DOMException: a throw, not a null return.
    const err = new Error('The operation is insecure.');
    err.name = 'SecurityError';
    throw err;
  };
  const localStorage = storageMode === 'missing' ? undefined : {
    getItem: k => (storageMode === 'throw' ? refuse() : (store.has(k) ? store.get(k) : null)),
    setItem: (k, v) => (storageMode === 'throw' ? refuse() : store.set(k, String(v))),
    removeItem: k => (storageMode === 'throw' ? refuse() : store.delete(k)),
    clear: () => (storageMode === 'throw' ? refuse() : store.clear())
  };

  const clipboardWrites = [];
  const clipboardMode = options.clipboard || 'ok';
  const navigator = {};
  if (clipboardMode !== 'missing') {
    navigator.clipboard = {
      writeText: async text => {
        if (clipboardMode === 'reject') {
          const err = new Error('Write permission denied.');
          err.name = 'NotAllowedError';
          throw err;
        }
        clipboardWrites.push(String(text));
      }
    };
  }

  return {
    document, window, localStorage, navigator,
    clipboardWrites,
    /** The values that actually reached storage, for asserting persistence. */
    storedKeys: () => [...store.keys()],
    stored: k => (store.has(k) ? store.get(k) : null),
    /** Register an element so document.querySelectorAll('.cls') can find it. */
    registerClass(name, el) {
      if (!byClass.has(name)) byClass.set(name, []);
      byClass.get(name).push(el);
      return el;
    },
    registerI18n(el) { i18nElements.push(el); return el; },
    createElement: tag => createElement(env, tag),
    getById: id => document.getElementById(id)
  };
}

module.exports = { createDom, createElement, makeClassList };
