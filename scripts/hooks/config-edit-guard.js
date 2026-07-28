#!/usr/bin/env node
/**
 * Config Edit Guard Hook
 *
 * PreToolUse hook that blocks editing managed configuration files
 * outside of /improve-claude. Checks for a lock file that
 * /improve-claude creates before editing.
 *
 * Exit code 0 = allow
 * Exit code 2 = block
 */

const path = require('path');
const fs = require('fs');
const { readStdinJson, log, getClaudeDir } = require('../lib/utils');

const CLAUDE_DIR = getClaudeDir();
const LOCK_FILE = path.join(CLAUDE_DIR, '.config-edit-unlocked');
const MAX_LOCK_AGE_MS = 30 * 60 * 1000;

const MANAGED_PATTERNS = [
  /^CLAUDE\.md$/,
  /^rules\/(?!p-)[^/]+\.md$/,
  /^agents\/(?!p-)[^/]+\.md$/,
  /^skills\/(?!p-)[^/]+\/SKILL\.md$/,
];

const SAFE_PATTERNS = [
  /^scripts\//,
  /^settings\./,
  /^README\.md$/,
  /^\.gitignore$/,
  /^\.secrets/,
  /^\.github\/workflows\/.*\.ya?ml$/,
];

function isManagedFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');

  let relative;
  const claudeDirNorm = CLAUDE_DIR.replace(/\\/g, '/');
  if (normalized.startsWith(claudeDirNorm)) {
    relative = normalized.slice(claudeDirNorm.length + 1);
  } else {
    return false;
  }

  for (const pattern of SAFE_PATTERNS) {
    if (pattern.test(relative)) {
      return false;
    }
  }

  for (const pattern of MANAGED_PATTERNS) {
    if (pattern.test(relative)) {
      return true;
    }
  }

  return false;
}

function isLockFileValid() {
  try {
    const stat = fs.statSync(LOCK_FILE);
    const age = Date.now() - stat.mtimeMs;
    if (age < MAX_LOCK_AGE_MS) {
      return true;
    }
    fs.unlinkSync(LOCK_FILE);
    return false;
  } catch {
    return false;
  }
}

async function main() {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';

  if (!filePath) {
    process.exit(0);
  }

  if (!isManagedFile(filePath)) {
    process.exit(0);
  }

  if (isLockFileValid()) {
    process.exit(0);
  }

  const relative = filePath
    .replace(/\\/g, '/')
    .slice(CLAUDE_DIR.replace(/\\/g, '/').length + 1);

  log(
    `BLOCKED: '${relative}' is a managed config file. ` +
    'Use /improve-claude to make cross-cutting config changes. ' +
    'Direct edits are only allowed for p-* personal files and single-file typo fixes.'
  );
  process.exit(2);
}

main().catch(() => {
  process.exit(0);
});
