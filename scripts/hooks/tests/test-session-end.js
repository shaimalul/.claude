/**
 * HK-SE: session-end.js - writes the per-session notes file.
 * Contract: SessionEnd hook. Always exits 0.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { runHook } = require('../../lib/hook-harness');
const { createSandbox } = require('../../lib/sandbox');
const { sessionEnd } = require('../../lib/hook-payload');

const HOOK = path.join(__dirname, '..', 'session-end.js');
const SESSION_ID = 'abcdef0123456789';

const listSessions = sandbox => {
  const dir = path.join(sandbox.claudeDir, 'sessions');
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

describe('HK-SE session-end', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox({ link: [] });
  });
  afterEach(() => sandbox.cleanup());

  test('HK-SE-01 creates a session notes file', async () => {
    const { code } = await runHook(HOOK, { stdin: sessionEnd(), env: sandbox.env });

    assert.strictEqual(code, 0);
    const files = listSessions(sandbox);
    assert.strictEqual(files.length, 1);
    assert.match(files[0], /-session\.tmp$/);
  });

  test('HK-SE-02 updates the existing file rather than creating a second', async () => {
    await runHook(HOOK, { stdin: sessionEnd(), env: sandbox.env });
    await runHook(HOOK, { stdin: sessionEnd(), env: sandbox.env });

    assert.strictEqual(listSessions(sandbox).length, 1);
  });

  test('HK-SE-03 records a Last Updated stamp', async () => {
    await runHook(HOOK, { stdin: sessionEnd(), env: sandbox.env });

    const [file] = listSessions(sandbox);
    const contents = sandbox.read(path.join('sessions', file));
    assert.match(contents, /\*\*Last Updated:\*\*/);
  });

  // D-02 regression proof: session_id is a stdin field, not an environment
  // variable. Red while the hook reads process.env.CLAUDE_SESSION_ID, which
  // collapses every session into a single "-default-" file per day.
  test('HK-SE-04 names the file from the stdin session_id', async () => {
    await runHook(HOOK, {
      stdin: sessionEnd({ session_id: SESSION_ID }),
      env: sandbox.env,
    });

    const [file] = listSessions(sandbox);
    assert.ok(
      file.includes(SESSION_ID.slice(-8)),
      `expected the session id suffix in "${file}", not the "default" fallback`
    );
  });
});
