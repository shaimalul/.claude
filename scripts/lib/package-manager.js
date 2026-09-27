/**
 * Package manager detection for the current project.
 *
 * Supports: npm, pnpm, yarn, bun
 */

const fs = require('fs');
const path = require('path');
const { commandExists } = require('./system');
const { getClaudeDir } = require('./paths');
const { readFile } = require('./files');

const LOCK_FILES = {
  pnpm: 'pnpm-lock.yaml',
  bun: 'bun.lockb',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
};

// Lock-file and fallback detection order
const DETECTION_PRIORITY = Object.keys(LOCK_FILES);

const isKnown = name => Boolean(name) && name in LOCK_FILES;

/** The `packageManager` field of a JSON file, or null when absent or unreadable */
function readPackageManagerField(filePath) {
  const content = readFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content).packageManager || null;
  } catch {
    return null;
  }
}

function detectFromLockFile(projectDir = process.cwd()) {
  return DETECTION_PRIORITY.find(name => fs.existsSync(path.join(projectDir, LOCK_FILES[name]))) || null;
}

/** package.json `packageManager`, e.g. "pnpm@8.6.0" or "pnpm" */
function detectFromPackageJson(projectDir = process.cwd()) {
  const field = readPackageManagerField(path.join(projectDir, 'package.json'));
  const name = field && field.split('@')[0];
  return isKnown(name) ? name : null;
}

function getAvailablePackageManagers() {
  return DETECTION_PRIORITY.filter(commandExists);
}

// Resolution order: the first source that names a known manager wins.
const SOURCES = [
  ['environment', () => process.env.CLAUDE_PACKAGE_MANAGER],
  ['project-config', dir => readPackageManagerField(path.join(dir, '.claude', 'package-manager.json'))],
  ['package.json', detectFromPackageJson],
  ['lock-file', detectFromLockFile],
  ['global-config', () => readPackageManagerField(path.join(getClaudeDir(), 'package-manager.json'))],
];

/**
 * The package manager for the project, with where the answer came from.
 * @param {object} options - { projectDir, fallbackOrder }
 * @returns {{ name: string, source: string }}
 */
function getPackageManager(options = {}) {
  const { projectDir = process.cwd(), fallbackOrder = DETECTION_PRIORITY } = options;

  for (const [source, resolve] of SOURCES) {
    const name = resolve(projectDir);
    if (isKnown(name)) return { name, source };
  }

  const available = getAvailablePackageManagers();
  const installed = fallbackOrder.find(name => available.includes(name));
  return installed ? { name: installed, source: 'fallback' } : { name: 'npm', source: 'default' };
}

/** A message telling the user how to set a preferred package manager */
function getSelectionPrompt() {
  const current = getPackageManager();
  const listed = getAvailablePackageManagers()
    .map(name => `  - ${name}${name === current.name ? ' (current)' : ''}`)
    .join('\n');

  return [
    '[PackageManager] Available package managers:',
    listed,
    '',
    'To set your preferred package manager:',
    '  - Global: Set CLAUDE_PACKAGE_MANAGER environment variable',
    '  - Or add to ~/.claude/package-manager.json: {"packageManager": "pnpm"}',
    '  - Or add to package.json: {"packageManager": "pnpm@8"}',
    '',
  ].join('\n');
}

module.exports = {
  DETECTION_PRIORITY,
  getPackageManager,
  getAvailablePackageManagers,
  detectFromLockFile,
  detectFromPackageJson,
  getSelectionPrompt,
};
