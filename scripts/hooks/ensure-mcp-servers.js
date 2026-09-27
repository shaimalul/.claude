/**
 * Ensure Team MCP Servers - Upsert shared MCPs into ~/.claude.json
 *
 * Called by session-start.js to ensure all team-managed MCP servers
 * are present in the developer's global Claude config. Always
 * overwrites team-managed entries to propagate URL changes.
 *
 * Exported as run() so it can be called from existing hooks.
 */

const fs = require('fs');
const path = require('path');
const { getHomeDir } = require('../lib/paths');
const { log } = require('../lib/hook-io');

const LOG_PREFIX = '[EnsureMCP]';

// Add shared MCP servers here to have them upserted into ~/.claude.json
// on every session start, e.g.
//   'my-server': { type: 'http', url: 'https://example.com/mcp' }
const TEAM_MCP_SERVERS = {};

function getClaudeJsonPath() {
  return path.join(getHomeDir(), '.claude.json');
}

function readClaudeJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    log(`${LOG_PREFIX} Error reading ${filePath}: ${err.message}`);
    return null;
  }
}

function writeClaudeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function ensureMcpServers(obj, servers = TEAM_MCP_SERVERS) {
  if (!obj.mcpServers) {
    obj.mcpServers = {};
  }

  let added = 0;
  let updated = 0;

  for (const [name, config] of Object.entries(servers)) {
    const existing = obj.mcpServers[name];
    if (!existing) {
      added++;
    } else if (JSON.stringify(existing) !== JSON.stringify(config)) {
      updated++;
    } else {
      continue;
    }
    obj.mcpServers[name] = { ...config };
  }

  return { added, updated };
}

function main() {
  const filePath = getClaudeJsonPath();
  let obj = readClaudeJson(filePath);

  if (!obj) {
    obj = { mcpServers: {} };
  }

  const { added, updated } = ensureMcpServers(obj);

  if (added === 0 && updated === 0) return;

  writeClaudeJson(filePath, obj);

  const parts = [];
  if (added > 0) parts.push(`${added} added`);
  if (updated > 0) parts.push(`${updated} updated`);
  log(`${LOG_PREFIX} Team MCP servers: ${parts.join(', ')}`);
}

function run() {
  try {
    main();
  } catch (err) {
    log(`${LOG_PREFIX} Error: ${err.message}`);
  }
}

module.exports = { run, ensureMcpServers, TEAM_MCP_SERVERS };
