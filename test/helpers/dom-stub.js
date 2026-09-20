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

/**
 * Walks parentNode so a scoped querySelector really is scoped.
 *
 * Without this, `item.querySelector('.playbook-header')` returned the first
 * header registered anywhere, so every accordion item appeared to share one
 * header and a test could not tell "opened the item I clicked" from "opened the
 * first item". Elements become descendants through append/appendChild.
 */
function isDescendantOf(node, ancestor) {
  for (let parent = node && node.parentNode; parent; parent = parent.parentNode) {
    if (parent === ancestor) return true;
  }
  return false;
}

/**
 * The simple selector forms app.js actually uses: a tag name, a class, an
 * attribute presence or value test, and combinations on one element (`a[href]`).
 * Validated separately from matching so an unrecognised form throws rather than
 * quietly matching nothing.
 */
const SIMPLE_SELECTOR = /^(?:[A-Za-z][\w-]*)?(?:\.[A-Za-z][\w-]*|\[[\w-]+(?:="[^"]*")?\])*$/;

function matchesSimple(el, sel) {
  let rest = sel;

  const tag = /^[A-Za-z][\w-]*/.exec(rest);
  if (tag) {
    if (el.tagName !== tag[0].toUpperCase()) return false;
    rest = rest.slice(tag[0].length);
  }

  while (rest) {
    const cls = /^\.([A-Za-z][\w-]*)/.exec(rest);
    if (cls) {
      if (!el.classList.contains(cls[1])) return false;
      rest = rest.slice(cls[0].length);
      continue;
    }

    const attr = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(rest);
    if (attr[2] === undefined) {
      if (!el.hasAttribute(attr[1])) return false;
    } else if (el.getAttribute(attr[1]) !== attr[2]) {
      return false;
    }
    rest = rest.slice(attr[0].length);
  }

  return true;
}

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
      const ev = {
        type,
        target: el,
        defaultPrevented: false,
        preventDefault() { ev.defaultPrevented = true; },
        stopPropagation() {},
        ...event
      };
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
    // Focus is state, not a gesture: a focus trap and a focus restore can only
    // be asserted on if moving focus is observable.
    focus() { env.activeElement = this; },
    blur() { if (env.activeElement === this) env.activeElement = null; },
    scrollIntoView() {},

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
  const i18nAriaElements = [];
  const scopedSteps = new Map(); // scope element -> Map(stepNumber -> element)

  const env = {
    activeElement: null,

    /** Everything under `node`, in the order it was appended. */
    descendants(node) {
      const out = [];
      for (const child of node.children || []) {
        if (child && typeof child === 'object' && child.tagName) {
          out.push(child, ...env.descendants(child));
        }
      }
      return out;
    },

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
      if (sel === '[data-i18n-aria-label]') return [...i18nAriaElements];

      const cls = /^\.([A-Za-z][\w-]*)$/.exec(sel);
      if (cls) {
        const all = [...(byClass.get(cls[1]) || [])];
        return scope ? all.filter(el => isDescendantOf(el, scope)) : all;
      }

      // A comma-separated list of simple selectors, resolved by walking the
      // scope. The walk is what makes the result document-ordered, which is the
      // whole point for a focus trap: it wraps from the last stop to the first.
      const parts = sel.split(',').map(p => p.trim()).filter(Boolean);
      if (!parts.length || parts.some(p => !SIMPLE_SELECTOR.test(p))) {
        throw new Error(`dom-stub: unsupported selector ${JSON.stringify(sel)} — teach the stub instead of loosening it`);
      }
      if (!scope) {
        throw new Error(`dom-stub: ${JSON.stringify(sel)} must be scoped to an element; the stub keeps no document tree to walk`);
      }

      return env.descendants(scope).filter(el => parts.some(p => matchesSimple(el, p)));
    }
  };

  // A real element rather than a stub literal, so data-theme round-trips through
  // setAttribute/getAttribute the way initThemeToggle expects.
  const documentElement = createElement(env, 'html');
  documentElement.lang = '';
  documentElement.style.setProperty = () => {};

  // Listeners bound to the document, so a test can dispatch the keydown a focus
  // trap and an Escape handler live on. DOMContentLoaded is recorded like any
  // other type and simply never dispatched, which is how it behaved before.
  const documentListeners = [];

  const document = {
    documentElement,
    body: null,

    /** null until something is focused, as in a document with no focus yet. */
    get activeElement() { return env.activeElement; },

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
    addEventListener(type, fn) { documentListeners.push({ type, fn }); },
    removeEventListener(type, fn) {
      const i = documentListeners.findIndex(l => l.type === type && l.fn === fn);
      if (i !== -1) documentListeners.splice(i, 1);
    },

    /** Fire the document-level listeners of `type`. Never called implicitly. */
    dispatch(type, event = {}) {
      const ev = {
        type,
        target: document,
        defaultPrevented: false,
        preventDefault() { ev.defaultPrevented = true; },
        stopPropagation() {},
        ...event
      };
      documentListeners.filter(l => l.type === type).forEach(l => l.fn(ev));
      return ev;
    }
  };
  document.body = createElement(env, 'body');

  // MediaQueryList stubs, one per query string, so a test can both set the
  // initial answer and fire a `change` the way the OS setting does.
  const mediaQueries = new Map();
  const mediaMatches = options.media || {};

  function matchMedia(query) {
    if (!mediaQueries.has(query)) {
      const listeners = [];
      mediaQueries.set(query, {
        media: query,
        matches: Boolean(mediaMatches[query]),
        addEventListener(type, fn) { if (type === 'change') listeners.push(fn); },
        removeEventListener(type, fn) {
          const i = listeners.indexOf(fn);
          if (type === 'change' && i !== -1) listeners.splice(i, 1);
        },
        /** Flip the answer and tell whoever is listening, as the OS would. */
        set(matches) {
          this.matches = Boolean(matches);
          listeners.forEach(fn => fn({ matches: this.matches, media: query }));
        }
      });
    }
    return mediaQueries.get(query);
  }

  const windowListeners = [];

  const window = {
    print() { window._printed = true; },
    _printed: false,
    matchMedia: options.matchMedia === 'missing' ? undefined : matchMedia,
    scrollTo() {},
    addEventListener(type, fn) { windowListeners.push({ type, fn }); },
    removeEventListener(type, fn) {
      const i = windowListeners.findIndex(l => l.type === type && l.fn === fn);
      if (i !== -1) windowListeners.splice(i, 1);
    },
    dispatch(type, event = {}) {
      const ev = { type, target: window, preventDefault() {}, ...event };
      windowListeners.filter(l => l.type === type).forEach(l => l.fn(ev));
      return ev;
    },
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
    /** The MediaQueryList app.js asked for, so a test can flip it mid-session. */
    mediaQuery: query => mediaQueries.get(query),
    /**
     * A <canvas> whose 2D context records what was drawn on it.
     *
     * The stub has no rendering, so "the map was painted" can only be asserted
     * on the calls themselves — which is enough to tell a still frame from a
     * blank one, and a frame with packets from one without.
     */
    addCanvas(id, size = { width: 800, height: 400 }) {
      const calls = [];
      const ctx = new Proxy({}, {
        get: (_, name) => {
          if (name === 'calls') return calls;
          // Assignments to fillStyle/font/lineWidth land in `set` below; every
          // read here is a drawing method.
          return (...args) => { calls.push({ name, args }); };
        },
        set: (_, name, value) => { calls.push({ name, args: [value] }); return true; }
      });

      const canvas = createElement(env, 'canvas');
      canvas.width = 0;
      canvas.height = 0;
      canvas.parentElement = { clientWidth: size.width, clientHeight: size.height };
      canvas.getContext = () => ctx;
      canvas.ctxCalls = calls;
      byId.set(id, canvas);
      canvas.id = id;
      return canvas;
    },
    /** The values that actually reached storage, for asserting persistence. */
    storedKeys: () => [...store.keys()],
    stored: k => (store.has(k) ? store.get(k) : null),
    /**
     * Put a purpose-built element behind an id, instead of the div that
     * getElementById would otherwise invent. Needed wherever the tag matters:
     * a focus trap selects on `button, input, select`, and an auto-created
     * <div> would be skipped by all three.
     */
    registerId(id, el) {
      el.setAttribute('id', id);
      byId.set(id, el);
      return el;
    },
    /** Register an element so document.querySelectorAll('.cls') can find it. */
    registerClass(name, el) {
      if (!byClass.has(name)) byClass.set(name, []);
      byClass.get(name).push(el);
      return el;
    },
    registerI18n(el) { i18nElements.push(el); return el; },
    /** Same, for an accessible name carried in an attribute. */
    registerI18nAria(el) { i18nAriaElements.push(el); return el; },
    createElement: tag => createElement(env, tag),
    getById: id => document.getElementById(id)
  };
}

module.exports = { createDom, createElement, makeClassList };
