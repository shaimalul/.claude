/**
 * Auto-Update - Pull config updates on session start
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Called by session-start.js to check for and pull updates from
 * the config repository. Uses fetch + fast-forward merge with
 * stash/pop to safely update even with local changes.
 *
 * Exported as run() so it can be called from existing hooks
 * without needing a new settings.json entry.
 */

const fs = require('fs');
const path = require('path');
const {
  getClaudeDir,
  getHomeDir,
  runCommand,
  readFile,
  writeFile,
  log
} = require('../lib/utils');

const THROTTLE_MINUTES = 720;
const FETCH_TIMEOUT_MS = 5000;
const LOG_PREFIX = '[AutoUpdate]';

function getThrottleFile() {
  return path.join(getClaudeDir(), '.last-update-check');
}

function shouldThrottle() {
  try {
    const stat = fs.statSync(getThrottleFile());
    const ageMinutes = (Date.now() - stat.mtimeMs) / (1000 * 60);
    return ageMinutes < THROTTLE_MINUTES;
  } catch {
    return false;
  }
}

function touchThrottleFile() {
  fs.writeFileSync(getThrottleFile(), new Date().toISOString(), 'utf8');
}

function isWorkingTreeDirty(cwd) {
  const result = runCommand('git status --porcelain', { cwd });
  return result.success && result.output.length > 0;
}

function categorizeChanges(files) {
  const counts = { skills: 0, agents: 0, rules: 0, scripts: 0, other: 0 };

  for (const file of files) {
    if (file.startsWith('skills/')) counts.skills++;
    else if (file.startsWith('agents/')) counts.agents++;
    else if (file.startsWith('rules/')) counts.rules++;
    else if (file.startsWith('scripts/')) counts.scripts++;
    else counts.other++;
  }

  const parts = [];
  if (counts.skills > 0) parts.push(`${counts.skills} skill(s)`);
  if (counts.agents > 0) parts.push(`${counts.agents} agent(s)`);
  if (counts.rules > 0) parts.push(`${counts.rules} rule(s)`);
  if (counts.scripts > 0) parts.push(`${counts.scripts} script(s)`);
  if (counts.other > 0) parts.push(`${counts.other} other file(s)`);
  return parts;
}

function regenerateSettings(claudeDir) {
  const { mergeSettings } = require('../lib/settings-merge');

  const templatePath = path.join(claudeDir, 'settings.template.json');
  const outputPath = path.join(claudeDir, 'settings.json');
  const homeDir = getHomeDir();

  const templateRaw = readFile(templatePath);
  if (!templateRaw) return;

  const resolvedTemplate = templateRaw.replace(/__HOME__/g, homeDir);

  let templateObj;
  try {
    templateObj = JSON.parse(resolvedTemplate);
  } catch (err) {
    log(`${LOG_PREFIX} Error parsing settings.template.json: ${err.message}`);
    return;
  }

  const existingRaw = readFile(outputPath);
  if (!existingRaw) {
    writeFile(outputPath, resolvedTemplate);
    log(`${LOG_PREFIX} settings.json generated (first run). Restart Claude Code to apply.`);
    return;
  }

  let existingObj;
  try {
    existingObj = JSON.parse(existingRaw);
  } catch (err) {
    log(`${LOG_PREFIX} settings.json corrupt, regenerating from template: ${err.message}`);
    writeFile(outputPath, resolvedTemplate);
    return;
  }

  const merged = mergeSettings(templateObj, existingObj, homeDir);
  writeFile(outputPath, JSON.stringify(merged, null, 2) + '\n');
  log(`${LOG_PREFIX} settings.json smart-merged. Restart Claude Code to apply hook changes.`);
}

function main() {
  const claudeDir = getClaudeDir();

  // Guard: is this a git repo?
  const gitCheck = runCommand('git rev-parse --git-dir', { cwd: claudeDir });
  if (!gitCheck.success) {
    return;
  }

  // Guard: on main branch only
  const branchResult = runCommand('git symbolic-ref --short HEAD', { cwd: claudeDir });
  if (!branchResult.success || branchResult.output !== 'main') {
    return;
  }

  // Throttle: skip if checked recently
  if (shouldThrottle()) {
    return;
  }
  touchThrottleFile();

  // Fetch with timeout
  const fetchResult = runCommand('git fetch origin main --quiet', {
    cwd: claudeDir,
    timeout: FETCH_TIMEOUT_MS
  });
  if (!fetchResult.success) {
    log(`${LOG_PREFIX} Fetch failed (network issue?), continuing without update`);
    return;
  }

  // Check if behind
  const behindResult = runCommand('git rev-list --count HEAD..origin/main', { cwd: claudeDir });
  if (!behindResult.success) return;

  const commitsBehind = parseInt(behindResult.output, 10);
  if (commitsBehind === 0) return;

  // Stash local changes if working tree is dirty
  const isDirty = isWorkingTreeDirty(claudeDir);
  if (isDirty) {
    const stashResult = runCommand('git stash push -m "auto-update-stash"', { cwd: claudeDir });
    if (!stashResult.success) {
      log(`${LOG_PREFIX} Could not stash local changes, skipping update`);
      return;
    }
    log(`${LOG_PREFIX} Stashed local changes before update`);
  }

  // Fast-forward merge
  const mergeResult = runCommand('git merge --ff-only origin/main', { cwd: claudeDir });
  if (!mergeResult.success) {
    log(`${LOG_PREFIX} Cannot fast-forward merge. Run manually: cd ~/.claude && git pull`);
    if (isDirty) {
      runCommand('git stash pop', { cwd: claudeDir });
    }
    return;
  }

  // Pop stash if we stashed
  if (isDirty) {
    const popResult = runCommand('git stash pop', { cwd: claudeDir });
    if (!popResult.success) {
      log(`${LOG_PREFIX} WARNING: Stash pop failed (conflict?). Your changes are in 'git stash list'.`);
      log(`${LOG_PREFIX} Run: cd ~/.claude && git stash pop`);
    } else {
      log(`${LOG_PREFIX} Restored local changes after update`);
    }
  }

  // Post-pull: check if settings.template.json changed
  const diffResult = runCommand(
    `git diff --name-only HEAD~${commitsBehind}..HEAD`,
    { cwd: claudeDir }
  );

  if (diffResult.success && diffResult.output.includes('settings.template.json')) {
    regenerateSettings(claudeDir);
  }

  // Report summary
  const changedFiles = diffResult.success
    ? diffResult.output.split('\n').filter(Boolean)
    : [];
  const categories = categorizeChanges(changedFiles);
  const summary = categories.length > 0 ? `: ${categories.join(', ')}` : '';

  log(`${LOG_PREFIX} Updated config (${commitsBehind} commit${commitsBehind > 1 ? 's' : ''}${summary})`);
}

function run() {
  try {
    main();
  } catch (err) {
    log(`${LOG_PREFIX} Error: ${err.message}`);
  }
}

module.exports = { run };
