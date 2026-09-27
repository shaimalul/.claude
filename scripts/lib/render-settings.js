/**
 * Render settings.template.json into settings.json: the one implementation
 * used by setup, the merge CLI, and auto-update.
 */

const path = require('path');
const { readFile, writeFile } = require('./files');
const { mergeSettings } = require('./settings-merge');

const serialize = settings => JSON.stringify(settings, null, 2) + '\n';

// Top-level template keys already offered to this install, so a key the user deletes is not re-added
const OFFERED_KEYS_FILE = '.settings-template-keys.json';

function parse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Generate or smart-merge `<claudeDir>/settings.json` from the template.
 * @returns {{ status: 'generated'|'merged'|'regenerated'|'error', message: string }}
 */
function renderSettings(claudeDir, homeDir) {
  const outputPath = path.join(claudeDir, 'settings.json');
  const template = parse((readFile(path.join(claudeDir, 'settings.template.json')) || '').replace(/__HOME__/g, homeDir));

  if (!template) {
    return { status: 'error', message: 'settings.template.json is missing or not valid JSON; settings.json left untouched' };
  }

  const existingRaw = readFile(outputPath);
  if (existingRaw === null) {
    writeFile(outputPath, serialize(template));
    writeFile(path.join(claudeDir, OFFERED_KEYS_FILE), serialize(Object.keys(template)));
    return { status: 'generated', message: 'settings.json generated from the template' };
  }

  const existing = parse(existingRaw);
  if (!existing) {
    writeFile(outputPath, serialize(template));
    writeFile(path.join(claudeDir, OFFERED_KEYS_FILE), serialize(Object.keys(template)));
    return { status: 'regenerated', message: 'settings.json was corrupt and was regenerated from the template' };
  }

  const recordPath = path.join(claudeDir, OFFERED_KEYS_FILE);
  const recorded = parse(readFile(recordPath) || '');
  // An install from before the record existed has already seen every current key
  const offeredKeys = Array.isArray(recorded) ? recorded : Object.keys(template);
  writeFile(outputPath, serialize(mergeSettings(template, existing, homeDir, { offeredKeys })));
  writeFile(recordPath, serialize([...new Set([...offeredKeys, ...Object.keys(template)])]));
  return { status: 'merged', message: 'settings.json smart-merged with the template; your customizations were preserved' };
}

module.exports = { renderSettings };
