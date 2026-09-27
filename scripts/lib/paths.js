/**
 * Well-known directories of this Claude Code configuration
 */

const os = require('os');
const path = require('path');

/**
 * Get the user's home directory (cross-platform)
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Get the Claude config directory
 */
function getClaudeDir() {
  return path.join(getHomeDir(), '.claude');
}

/**
 * Get the sessions directory
 */
function getSessionsDir() {
  return path.join(getClaudeDir(), 'sessions');
}

module.exports = {
  getHomeDir,
  getClaudeDir,
  getSessionsDir
};
