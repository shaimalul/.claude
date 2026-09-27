#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts. Checks for recent session
 * files and notifies Claude of available context to load.
 */

const { getSessionsDir } = require('../lib/paths');
const { findFiles, ensureDir } = require('../lib/files');
const { log } = require('../lib/hook-io');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');
const { run: runAutoUpdate } = require('./auto-update');
const { run: ensureMcpServers } = require('./ensure-mcp-servers');

async function main() {
  // Auto-pull config updates (throttled, safe to call every session)
  runAutoUpdate();

  // Ensure team MCP servers are present in ~/.claude.json
  ensureMcpServers();

  const sessionsDir = getSessionsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);

  // Check for recent session files (last 7 days)
  // Match both old format (YYYY-MM-DD-session.tmp) and new format (YYYY-MM-DD-shortid-session.tmp)
  const recentSessions = findFiles(sessionsDir, '*-session.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);
  }

  // Note: Skills are now loaded via the normal skill system.
  // Learnings are integrated into existing domain skills (styling-rtl, react-component, etc.)

  // Detect and report package manager
  const pm = getPackageManager();
  log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

  // If package manager was detected via fallback, show selection prompt
  if (pm.source === 'fallback' || pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // Don't block on errors
});
