/**
 * HK-AU: auto-update.js - fast-forwards the config repo from origin/main on session start.
 * Exercised against real throwaway git repositories inside a sandbox $HOME.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const { createSandbox } = require('../../lib/sandbox');

const HOOK = path.join(__dirname, '..', 'auto-update.js');

const git = (cwd, ...args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
  }).trim();

const runUpdate = sandbox =>
  spawnSync(process.execPath, ['-e', `require(${JSON.stringify(HOOK)}).run()`], {
    env: sandbox.env,
    encoding: 'utf8',
  });

/** Commit a file in the upstream working copy and publish it to origin */
function publish(upstream, file, contents) {
  fs.mkdirSync(path.dirname(path.join(upstream, file)), { recursive: true });
  fs.writeFileSync(path.join(upstream, file), contents);
  git(upstream, 'add', '-A');
  git(upstream, 'commit', '-qm', `update ${file}`);
  git(upstream, 'push', '-q', 'origin', 'main');
}

describe('HK-AU auto-update', () => {
  let sandbox;
  let upstream;

  beforeEach(() => {
    sandbox = createSandbox({ link: [] });
    const origin = path.join(sandbox.home, 'origin.git');
    upstream = path.join(sandbox.home, 'upstream');
    git(sandbox.home, 'init', '-q', '--bare', '-b', 'main', origin);
    git(sandbox.home, 'clone', '-q', origin, upstream);
    git(upstream, 'checkout', '-q', '-b', 'main');
    publish(upstream, 'README.md', 'v1\n');
    fs.rmSync(sandbox.claudeDir, { recursive: true, force: true });
    git(sandbox.home, 'clone', '-q', '-b', 'main', origin, sandbox.claudeDir);
  });

  afterEach(() => sandbox.cleanup());

  test('HK-AU-01 fast-forwards to origin/main and reports what changed', () => {
    publish(upstream, 'skills/new/SKILL.md', 'x\n');
    const { stderr } = runUpdate(sandbox);
    assert.ok(sandbox.exists('skills/new/SKILL.md'), 'new upstream file pulled');
    assert.match(stderr, /Updated config \(1 commit: 1 skill\(s\)\)/);
  });

  test('HK-AU-02 is throttled after a check', () => {
    runUpdate(sandbox);
    publish(upstream, 'rules/r.md', 'x\n');
    runUpdate(sandbox);
    assert.ok(!sandbox.exists('rules/r.md'), 'second run within the throttle window does nothing');
  });

  test('HK-AU-03 skips a checkout that is not on main', () => {
    git(sandbox.claudeDir, 'checkout', '-q', '-b', 'feature');
    publish(upstream, 'rules/r.md', 'x\n');
    runUpdate(sandbox);
    assert.ok(!sandbox.exists('rules/r.md'));
  });

  test('HK-AU-04 keeps uncommitted local changes across the update', () => {
    fs.writeFileSync(sandbox.path('README.md'), 'local edit\n');
    publish(upstream, 'agents/a.md', 'x\n');
    const { stderr } = runUpdate(sandbox);
    assert.ok(sandbox.exists('agents/a.md'));
    assert.equal(sandbox.read('README.md'), 'local edit\n');
    assert.match(stderr, /Restored local changes/);
  });

  test('HK-AU-05 renders settings.json when the template changed upstream', () => {
    publish(upstream, 'settings.template.json', JSON.stringify({ model: 'sonnet' }));
    runUpdate(sandbox);
    assert.equal(JSON.parse(sandbox.read('settings.json')).model, 'sonnet');
  });

  test('HK-AU-06 does nothing when already up to date', () => {
    const before = git(sandbox.claudeDir, 'rev-parse', 'HEAD');
    const { stderr } = runUpdate(sandbox);
    assert.equal(git(sandbox.claudeDir, 'rev-parse', 'HEAD'), before);
    assert.doesNotMatch(stderr, /Updated config/);
  });
});
