/**
 * Tests for scripts/lib/render-settings.js - settings.template.json to settings.json.
 *
 * Run: node --test scripts/lib/tests/test-render-settings.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { renderSettings } = require(path.join(__dirname, '..', 'render-settings.js'));

const TEMPLATE = {
  $schema: 'https://json.schemastore.org/claude-code-settings.json',
  model: 'sonnet',
  hooks: {
    Stop: [{ hooks: [{ type: 'command', command: 'node __HOME__/.claude/scripts/hooks/stop.js' }] }],
  },
};

describe('renderSettings', () => {
  let home;
  let claudeDir;
  const settingsPath = () => path.join(claudeDir, 'settings.json');
  const readSettings = () => JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));

  beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'render-home-'));
    claudeDir = path.join(home, '.claude');
    fs.mkdirSync(path.join(claudeDir, 'scripts', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'scripts', 'hooks', 'stop.js'), '');
    fs.writeFileSync(path.join(claudeDir, 'settings.template.json'), JSON.stringify(TEMPLATE));
  });

  it('generates settings.json with __HOME__ resolved when none exists', () => {
    const { status } = renderSettings(claudeDir, home);
    assert.equal(status, 'generated');
    assert.equal(readSettings().hooks.Stop[0].hooks[0].command, `node ${home}/.claude/scripts/hooks/stop.js`);
  });

  it('merges into an existing settings.json, keeping the user values', () => {
    fs.writeFileSync(settingsPath(), JSON.stringify({ model: 'opus', userOnly: true }));
    const { status } = renderSettings(claudeDir, home);
    assert.equal(status, 'merged');
    const settings = readSettings();
    assert.equal(settings.model, 'opus');
    assert.equal(settings.userOnly, true);
    assert.equal(settings.hooks.Stop.length, 1);
    assert.equal(settings.$schema, TEMPLATE.$schema);
  });

  it('regenerates from the template when settings.json is corrupt', () => {
    fs.writeFileSync(settingsPath(), '{not json');
    const { status } = renderSettings(claudeDir, home);
    assert.equal(status, 'regenerated');
    assert.equal(readSettings().model, 'sonnet');
  });

  it('refuses, and leaves settings.json untouched, when the template is unreadable', () => {
    fs.writeFileSync(path.join(claudeDir, 'settings.template.json'), '{broken');
    fs.writeFileSync(settingsPath(), '{"model": "opus"}');
    const { status, message } = renderSettings(claudeDir, home);
    assert.equal(status, 'error');
    assert.match(message, /settings\.template\.json/);
    assert.equal(readSettings().model, 'opus');
  });

  it('ends the written file with a newline', () => {
    renderSettings(claudeDir, home);
    assert.ok(fs.readFileSync(settingsPath(), 'utf8').endsWith('\n'));
  });

  it('does not re-add a template key the user deleted after it was offered', () => {
    renderSettings(claudeDir, home);
    const settings = readSettings();
    delete settings.model;
    fs.writeFileSync(settingsPath(), JSON.stringify(settings));
    renderSettings(claudeDir, home);
    assert.equal('model' in readSettings(), false);
  });

  it('still adds a key the template gains later', () => {
    renderSettings(claudeDir, home);
    fs.writeFileSync(path.join(claudeDir, 'settings.template.json'), JSON.stringify({ ...TEMPLATE, newKey: 1 }));
    renderSettings(claudeDir, home);
    assert.equal(readSettings().newKey, 1);
  });

  it('treats an existing install without a record as already offered every current key', () => {
    fs.writeFileSync(settingsPath(), JSON.stringify({ hooks: {} }));
    renderSettings(claudeDir, home);
    assert.equal('model' in readSettings(), false);
  });
});
