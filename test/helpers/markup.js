'use strict';

/**
 * Strip HTML comments, so a guard reading index.html matches markup and not
 * prose about markup.
 *
 * The comments in index.html quote the thing they explain — an attribute, a data:
 * URI, the `<a href="#">` a footer span replaced — which means a guard reading
 * the raw file can be satisfied (or tripped) by an explanation long after the
 * code it describes has changed. Both of those have actually happened here.
 *
 * Scanning with indexOf rather than a single `replace(/<!--[\s\S]*?-->/g, '')`,
 * which CodeQL flagged as an incomplete multi-character sanitisation and was
 * right to: a non-greedy pass leaves an unterminated `<!--` in place, which is
 * the one case that would hand the guards prose to read. An unterminated comment
 * swallows the rest of the document in a browser, so it does here too.
 *
 * Shared rather than copied: two test files strip the same file, and a second
 * implementation is a second thing to get wrong.
 */
function stripHtmlComments(source) {
  let out = '';
  let rest = source;

  for (;;) {
    const start = rest.indexOf('<!--');
    if (start === -1) return out + rest;

    out += rest.slice(0, start);

    const end = rest.indexOf('-->', start + 4);
    if (end === -1) return out;

    rest = rest.slice(end + 3);
  }
}

module.exports = { stripHtmlComments };
