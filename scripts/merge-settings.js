#!/usr/bin/env node
/**
 * CLI wrapper for settings smart merge.
 * Called by setup.sh when settings.json already exists.
 *
 * Usage: node scripts/merge-settings.js
 */

const path = require('path');
const { readFile, writeFile, getHomeDir, getClaudeDir, log } = require('./lib/utils');
const { mergeSettings } = require('./lib/settings-merge');

const claudeDir = getClaudeDir();
const homeDir = getHomeDir();
const templatePath = path.join(claudeDir, 'settings.template.json');
const outputPath = path.join(claudeDir, 'settings.json');

const templateRaw = readFile(templatePath);
if (!templateRaw) {
  log('Error: Cannot read settings.template.json');
  process.exit(1);
}

const existingRaw = readFile(outputPath);
if (!existingRaw) {
  log('Error: Cannot read settings.json');
  process.exit(1);
}

const resolvedTemplate = templateRaw.replace(/__HOME__/g, homeDir);

let templateObj, existingObj;
try {
  templateObj = JSON.parse(resolvedTemplate);
} catch (err) {
  log(`Error parsing settings.template.json: ${err.message}`);
  process.exit(1);
}
try {
  existingObj = JSON.parse(existingRaw);
} catch (err) {
  log(`Error parsing settings.json: ${err.message}`);
  process.exit(1);
}

const merged = mergeSettings(templateObj, existingObj, homeDir);
writeFile(outputPath, JSON.stringify(merged, null, 2) + '\n');
log('settings.json smart-merged with template. Your customizations were preserved.');
