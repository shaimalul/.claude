/**
 * Tests for scripts/lib/package-manager.js - resolution order of the project's package manager.
 *
 * Run: node --test scripts/lib/tests/test-package-manager.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { getPackageManager, getSelectionPrompt } = require(
  path.join(__dirname, '..', 'package-manager.js')
);

const tempDir = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const write = (dir, rel, content) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
};

describe('getPackageManager', () => {
  let savedHome;
  let savedEnv;
  let home;
  let project;

  beforeEach(() => {
    savedHome = process.env.HOME;
    savedEnv = process.env.CLAUDE_PACKAGE_MANAGER;
    delete process.env.CLAUDE_PACKAGE_MANAGER;
    home = tempDir('pm-home-');
    project = tempDir('pm-project-');
    process.env.HOME = home;
  });

  afterEach(() => {
    process.env.HOME = savedHome;
    if (savedEnv === undefined) delete process.env.CLAUDE_PACKAGE_MANAGER;
    else process.env.CLAUDE_PACKAGE_MANAGER = savedEnv;
  });

  it('prefers the CLAUDE_PACKAGE_MANAGER environment variable over everything', () => {
    process.env.CLAUDE_PACKAGE_MANAGER = 'bun';
    write(project, 'pnpm-lock.yaml', '');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'bun', source: 'environment' });
  });

  it('ignores an unknown environment value and falls through', () => {
    process.env.CLAUDE_PACKAGE_MANAGER = 'maven';
    write(project, 'yarn.lock', '');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'yarn', source: 'lock-file' });
  });

  it('prefers the project config over package.json', () => {
    write(project, '.claude/package-manager.json', '{"packageManager": "yarn"}');
    write(project, 'package.json', '{"packageManager": "pnpm@9.0.0"}');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'yarn', source: 'project-config' });
  });

  it('reads the packageManager field of package.json, ignoring the version', () => {
    write(project, 'package.json', '{"packageManager": "pnpm@9.0.0"}');
    write(project, 'yarn.lock', '');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'pnpm', source: 'package.json' });
  });

  it('detects from lock files in pnpm, bun, yarn, npm priority', () => {
    write(project, 'package-lock.json', '');
    write(project, 'bun.lockb', '');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'bun', source: 'lock-file' });
  });

  it('uses the global preference in ~/.claude when the project says nothing', () => {
    write(home, '.claude/package-manager.json', '{"packageManager": "pnpm"}');
    assert.deepEqual(pick(getPackageManager({ projectDir: project })), { name: 'pnpm', source: 'global-config' });
  });

  it('survives malformed config files and falls back to an installed manager', () => {
    write(project, '.claude/package-manager.json', '{not json');
    write(project, 'package.json', '{not json');
    const { source } = getPackageManager({ projectDir: project });
    assert.ok(['fallback', 'default'].includes(source), `unexpected source ${source}`);
  });
});

describe('getSelectionPrompt', () => {
  it('explains every way to set a preference', () => {
    const prompt = getSelectionPrompt();
    assert.match(prompt, /CLAUDE_PACKAGE_MANAGER/);
    assert.match(prompt, /package-manager\.json/);
    assert.match(prompt, /"packageManager": "pnpm@8"/);
  });
});

function pick({ name, source }) {
  return { name, source };
}
