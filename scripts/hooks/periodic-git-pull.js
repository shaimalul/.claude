#!/usr/bin/env node
/**
 * Periodic Git Pull - Runs on session start, throttled to once every 4 hours
 *
 * Ensures your local repo stays in sync with remote changes from collaborators.
 * Uses a state file to track last pull time.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getClaudeDir, ensureDir, log, isGitRepo, runCommand } = require('../lib/utils');

const PULL_INTERVAL_HOURS = 4;
const STATE_FILE = path.join(getClaudeDir(), 'state', 'last-git-pull.json');

/**
 * Get the last pull timestamp for a given repo path
 */
function getLastPullTime(repoPath) {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return null;
    }
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return state[repoPath] || null;
  } catch {
    return null;
  }
}

/**
 * Save the pull timestamp for a repo
 */
function saveLastPullTime(repoPath) {
  ensureDir(path.dirname(STATE_FILE));
  let state = {};
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    state = {};
  }
  state[repoPath] = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Check if enough time has passed since last pull
 */
function shouldPull(repoPath) {
  const lastPull = getLastPullTime(repoPath);
  if (!lastPull) return true;

  const hoursSinceLastPull = (Date.now() - lastPull) / (1000 * 60 * 60);
  return hoursSinceLastPull >= PULL_INTERVAL_HOURS;
}

/**
 * Get the current working directory (repo root)
 */
function getRepoRoot() {
  const result = runCommand('git rev-parse --show-toplevel');
  if (result.success) {
    return result.output.trim();
  }
  return process.cwd();
}

/**
 * Check if there are uncommitted changes that would block pull
 */
function hasUncommittedChanges() {
  const result = runCommand('git status --porcelain');
  return result.success && result.output.trim().length > 0;
}

/**
 * Perform git pull with rebase
 */
function gitPull() {
  // Use spawnSync to avoid shell injection
  const result = spawnSync('git', ['pull', '--rebase', '--autostash'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000
  });

  return {
    success: result.status === 0,
    output: result.stdout || '',
    error: result.stderr || ''
  };
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  const result = runCommand('git branch --show-current');
  return result.success ? result.output.trim() : 'unknown';
}

/**
 * Check if remote tracking branch exists
 */
function hasRemoteTracking() {
  const result = runCommand('git rev-parse --abbrev-ref @{upstream}');
  return result.success;
}

async function main() {
  // Only run in git repos
  if (!isGitRepo()) {
    return;
  }

  const repoRoot = getRepoRoot();

  // Check if we should pull based on time interval
  if (!shouldPull(repoRoot)) {
    const lastPull = getLastPullTime(repoRoot);
    const hoursSince = ((Date.now() - lastPull) / (1000 * 60 * 60)).toFixed(1);
    log(`[GitSync] Last pull ${hoursSince}h ago (interval: ${PULL_INTERVAL_HOURS}h)`);
    return;
  }

  // Check if remote tracking exists
  if (!hasRemoteTracking()) {
    log('[GitSync] No remote tracking branch - skipping pull');
    saveLastPullTime(repoRoot);
    return;
  }

  const branch = getCurrentBranch();
  log(`[GitSync] Pulling latest changes on '${branch}'...`);

  const result = gitPull();

  if (result.success) {
    if (result.output.includes('Already up to date')) {
      log('[GitSync] Already up to date');
    } else {
      log('[GitSync] Successfully pulled changes');
      if (result.output.trim()) {
        log(result.output.trim());
      }
    }
    saveLastPullTime(repoRoot);
  } else {
    log(`[GitSync] Pull failed: ${result.error || result.output}`);
    // Still save timestamp to avoid retrying every session
    saveLastPullTime(repoRoot);
  }
}

main().catch(err => {
  log(`[GitSync] Error: ${err.message}`);
  process.exit(0); // Don't block on errors
});
