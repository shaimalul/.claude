/**
 * HK-CG: config-edit-guard.js - protects managed config from direct edits.
 * Contract: PreToolUse on Edit|Write. Exit 2 blocks and redirects to /improve-claude.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { runHook } = require('../../lib/hook-harness');
const { createSandbox } = require('../../lib/sandbox');
const { preToolUse } = require('../../lib/hook-payload');

const HOOK = path.join(__dirname, '..', 'config-edit-guard.js');
const LOCK = '.config-edit-unlocked';
const THIRTY_ONE_MINUTES_MS = 31 * 60 * 1000;

const MANAGED = [
  'CLAUDE.md',
  'rules/testing.md',
  'agents/backend-agent.md',
  'skills/review/SKILL.md',
];

const ALLOWED = [
  'scripts/hooks/anything.js',
  'settings.template.json',
  'README.md',
  '.gitignore',
  '.secrets.example',
  '.github/workflows/ci.yml',
];

describe('HK-CG config-edit-guard', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox({ link: [] });
  });
  afterEach(() => sandbox.cleanup());

  const edit = relativePath =>
    runHook(HOOK, {
      stdin: preToolUse('Edit', { file_path: sandbox.path(relativePath) }),
      env: sandbox.env,
    });

  MANAGED.forEach((relativePath, index) => {
    const id = String(index + 1).padStart(2, '0');
    test(`HK-CG-${id} blocks ${relativePath}`, async () => {
      const { code, stderr } = await edit(relativePath);

      assert.strictEqual(code, 2);
      assert.match(stderr, /\/improve-claude/);
    });
  });

  ALLOWED.forEach((relativePath, index) => {
    const id = String(index + 6).padStart(2, '0');
    test(`HK-CG-${id} allows ${relativePath}`, async () => {
      const { code } = await edit(relativePath);
      assert.strictEqual(code, 0);
    });
  });

  test('HK-CG-12 allows p- personal files in rules, agents and skills', async () => {
    const personal = ['rules/p-mine.md', 'agents/p-mine.md', 'skills/p-mine/SKILL.md'];
    for (const relativePath of personal) {
      const { code } = await edit(relativePath);
      assert.strictEqual(code, 0, `${relativePath} should be exempt`);
    }
  });

  test('HK-CG-13 ignores files outside the claude directory', async () => {
    const { code } = await runHook(HOOK, {
      stdin: preToolUse('Write', { file_path: '/tmp/elsewhere/CLAUDE.md' }),
      env: sandbox.env,
    });
    assert.strictEqual(code, 0);
  });

  test('HK-CG-14 a fresh unlock file permits editing managed config', async () => {
    sandbox.write(LOCK, '');
    const { code } = await edit('rules/testing.md');
    assert.strictEqual(code, 0);
  });

  test('HK-CG-15 a stale unlock file blocks and is removed', async () => {
    const lockPath = sandbox.write(LOCK, '');
    const stale = (Date.now() - THIRTY_ONE_MINUTES_MS) / 1000;
    fs.utimesSync(lockPath, stale, stale);

    const { code } = await edit('rules/testing.md');

    assert.strictEqual(code, 2);
    assert.strictEqual(sandbox.exists(LOCK), false, 'stale lock must be unlinked');
  });

  test('HK-CG-16 allows a payload with no file_path', async () => {
    const { code } = await runHook(HOOK, {
      stdin: preToolUse('Edit', {}),
      env: sandbox.env,
    });
    assert.strictEqual(code, 0);
  });

  test('HK-CG-17 templates/ is no longer a managed path', async () => {
    const { code } = await edit('templates/anything.md');
    assert.strictEqual(code, 0, 'templates/ was removed; nothing there should be guarded');
  });
});
