/**
 * Auto-Update - Pull config updates on session start
 *
 * Called by session-start.js to check for and pull updates from the config
 * repository. Uses fetch + fast-forward merge with stash/pop to safely update
 * even with local changes. Exported as run() so it needs no settings.json entry.
 */

const fs = require('fs');
const path = require('path');
const { getClaudeDir, getHomeDir } = require('../lib/paths');
const { runCommand } = require('../lib/system');
const { renderSettings } = require('../lib/render-settings');
const { log } = require('../lib/hook-io');

const THROTTLE_MINUTES = 720;
const FETCH_TIMEOUT_MS = 5000;
const LOG_PREFIX = '[AutoUpdate]';

// Top-level directory -> label used in the update summary
const CATEGORIES = [['skills/', 'skill'], ['agents/', 'agent'], ['rules/', 'rule'], ['scripts/', 'script']];

const gitIn = cwd => (cmd, options = {}) => runCommand(cmd, { cwd, ...options });

function isThrottled(throttleFile) {
  try {
    return (Date.now() - fs.statSync(throttleFile).mtimeMs) / 60000 < THROTTLE_MINUTES;
  } catch {
    return false;
  }
}

/** "2 skill(s), 1 other file(s)" for the changed paths */
function categorizeChanges(files) {
  const counts = new Map();
  for (const file of files) {
    const match = CATEGORIES.find(([prefix]) => file.startsWith(prefix));
    const label = match ? match[1] : 'other file';
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  const order = [...CATEGORIES.map(([, label]) => label), 'other file'];
  return order.filter(label => counts.has(label)).map(label => `${counts.get(label)} ${label}(s)`);
}

/** Commits origin/main is ahead by, or 0 when this checkout should not update */
function commitsToPull(git, claudeDir) {
  if (!git('git rev-parse --git-dir').success) return 0;

  const branch = git('git symbolic-ref --short HEAD');
  if (!branch.success || branch.output !== 'main') return 0;

  const throttleFile = path.join(claudeDir, '.last-update-check');
  if (isThrottled(throttleFile)) return 0;
  fs.writeFileSync(throttleFile, new Date().toISOString(), 'utf8');

  if (!git('git fetch origin main --quiet', { timeout: FETCH_TIMEOUT_MS }).success) {
    log(`${LOG_PREFIX} Fetch failed (network issue?), continuing without update`);
    return 0;
  }

  const behind = git('git rev-list --count HEAD..origin/main');
  return behind.success ? parseInt(behind.output, 10) : 0;
}

/** Fast-forward to origin/main, carrying local changes across. Returns success */
function fastForward(git) {
  const status = git('git status --porcelain');
  const isDirty = status.success && status.output.length > 0;

  if (isDirty) {
    if (!git('git stash push -m "auto-update-stash"').success) {
      log(`${LOG_PREFIX} Could not stash local changes, skipping update`);
      return false;
    }
    log(`${LOG_PREFIX} Stashed local changes before update`);
  }

  const merged = git('git merge --ff-only origin/main').success;
  if (!merged) log(`${LOG_PREFIX} Cannot fast-forward merge. Run manually: cd ~/.claude && git pull`);

  if (isDirty) restoreStash(git, merged);
  return merged;
}

function restoreStash(git, afterMerge) {
  const popped = git('git stash pop').success;
  if (!afterMerge) return;
  if (popped) {
    log(`${LOG_PREFIX} Restored local changes after update`);
  } else {
    log(`${LOG_PREFIX} WARNING: Stash pop failed (conflict?). Your changes are in 'git stash list'.`);
    log(`${LOG_PREFIX} Run: cd ~/.claude && git stash pop`);
  }
}

function reportUpdate(git, claudeDir, commits) {
  const diff = git(`git diff --name-only HEAD~${commits}..HEAD`);
  const changed = diff.success ? diff.output.split('\n').filter(Boolean) : [];

  if (changed.includes('settings.template.json')) {
    const { message } = renderSettings(claudeDir, getHomeDir());
    log(`${LOG_PREFIX} ${message}. Restart Claude Code to apply hook changes.`);
  }

  const categories = categorizeChanges(changed);
  const summary = categories.length > 0 ? `: ${categories.join(', ')}` : '';
  log(`${LOG_PREFIX} Updated config (${commits} commit${commits > 1 ? 's' : ''}${summary})`);
}

function main() {
  const claudeDir = getClaudeDir();
  const git = gitIn(claudeDir);

  const commits = commitsToPull(git, claudeDir);
  if (commits === 0) return;

  if (fastForward(git)) reportUpdate(git, claudeDir, commits);
}

function run() {
  try {
    main();
  } catch (err) {
    log(`${LOG_PREFIX} Error: ${err.message}`);
  }
}

module.exports = { run };
