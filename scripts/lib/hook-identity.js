/**
 * Hook identity: the repo-relative script a hook command runs, so the same
 * hook written with different home prefixes or legacy names compares equal.
 */

const path = require('path');

// Legacy notification hooks -> the play-sound.sh invocation that replaced them.
// Without this a settings.json written before the sounds were bundled keeps its
// old hook AND gains the new one, so every event fires twice.
const WRAPPER_MAP = {
  'scripts/hooks/notify-wrapper.sh': 'scripts/hooks/play-sound.sh notify',
  'plugins/claude-notifier-plugin/scripts/notify.sh': 'scripts/hooks/play-sound.sh notify',
  'scripts/hooks/play-sound.sh': 'scripts/hooks/play-sound.sh done',
  'afplay /System/Library/Sounds/Submarine.aiff': 'scripts/hooks/play-sound.sh done'
};

/**
 * Extract canonical identity from a hook command string.
 * Strips runner prefix and home dir prefix.
 */
function getHookIdentity(command, homeDir) {
  let cleaned = command.replace(/^(?:node|bash|sh|python3?)\s+/, '');

  const prefixes = [
    '__HOME__/.claude/',
    `${homeDir}/.claude/`,
    '~/.claude/'
  ];
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }

  return WRAPPER_MAP[cleaned] || cleaned;
}

/**
 * Get identity for a hook entry (uses first hook's command).
 */
function getEntryIdentity(hookEntry, homeDir) {
  if (!hookEntry.hooks || hookEntry.hooks.length === 0) return null;
  const command = hookEntry.hooks[0].command;
  if (!command) return null;
  return getHookIdentity(command, homeDir);
}

/**
 * Repo script a hook command runs, when the command names it through the
 * repo's own location (`~/.claude/`, `$HOME/.claude/`). Relative commands and
 * external binaries return null: their existence is not the repo's to judge.
 */
function repoScriptPath(command, homeDir) {
  const script = command.replace(/^(?:node|bash|sh|python3?)\s+/, '').split(/\s+/)[0];
  for (const prefix of ['~/.claude/', `${homeDir}/.claude/`]) {
    if (script.startsWith(prefix)) return path.join(homeDir, '.claude', script.slice(prefix.length));
  }
  return null;
}

/** Identities of every hook a settings object registers, across all events */
function templateIdentities(settings, homeDir) {
  return new Set(
    Object.values(settings.hooks || {}).flat()
      .map(entry => getEntryIdentity(entry, homeDir))
      .filter(Boolean)
  );
}

module.exports = { getHookIdentity, getEntryIdentity, repoScriptPath, templateIdentities };
