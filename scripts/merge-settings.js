#!/usr/bin/env node
/**
 * CLI for rendering settings.template.json into settings.json.
 * Called by setup.sh.
 *
 * Usage:
 *   node scripts/merge-settings.js              generate, or smart-merge into an existing file
 *   node scripts/merge-settings.js --overwrite  discard settings.json and regenerate from the template
 */

const fs = require('fs');
const path = require('path');
const { getHomeDir, getClaudeDir } = require('./lib/paths');
const { log } = require('./lib/hook-io');
const { renderSettings } = require('./lib/render-settings');

const claudeDir = getClaudeDir();

if (process.argv.includes('--overwrite')) {
  fs.rmSync(path.join(claudeDir, 'settings.json'), { force: true });
}

const { status, message } = renderSettings(claudeDir, getHomeDir());
log(message);
process.exit(status === 'error' ? 1 : 0);
