/**
 * HK-SS: session-start.js - reports recent sessions and the package manager.
 * Contract: SessionStart hook. Always exits 0 and never blocks the session.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { runHook } = require('../../lib/hook-harness');
const { createSandbox } = require('../../lib/sandbox');

const HOOK = path.join(__dirname, '..', 'session-start.js');

describe('HK-SS session-start', () => {
  let sandbox;
  let project;

  beforeEach(() => {
    sandbox = createSandbox({ link: [] });
    project = fs.mkdtempSync(path.join(sandbox.home, 'project-'));
  });
  afterEach(() => sandbox.cleanup());

  const start = () => runHook(HOOK, { stdin: {}, env: sandbox.env, cwd: project, timeoutMs: 15000 });

  test('HK-SS-01 exits 0 outside a git checkout and creates the sessions directory', async () => {
    const { code } = await start();
    assert.strictEqual(code, 0);
    assert.ok(sandbox.exists('sessions'));
  });

  test('HK-SS-02 reports the most recent session file', async () => {
    sandbox.write('sessions/2026-01-01-abcd1234-session.tmp', 'notes');
    const { stderr } = await start();
    assert.match(stderr, /Found 1 recent session\(s\)/);
    assert.match(stderr, /2026-01-01-abcd1234-session\.tmp/);
  });

  test('HK-SS-03 reports the project package manager from its lock file', async () => {
    fs.writeFileSync(path.join(project, 'yarn.lock'), '');
    const { stderr } = await start();
    assert.match(stderr, /Package manager: yarn \(lock-file\)/);
    assert.doesNotMatch(stderr, /No package manager preference found/);
  });
});
