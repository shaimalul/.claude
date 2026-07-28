/**
 * Tests for scripts/hooks/ensure-mcp-servers.js
 *
 * Run: node --test scripts/lib/tests/test-ensure-mcp-servers.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { ensureMcpServers, TEAM_MCP_SERVERS } = require(
  path.join(__dirname, '..', '..', 'hooks', 'ensure-mcp-servers.js')
);

const SERVER_URL = 'https://example.com/mcp';

function fixture() {
  return { 'team-docs': { type: 'http', url: SERVER_URL } };
}

describe('ensureMcpServers', () => {
  it('adds team MCPs when mcpServers key is missing', () => {
    const obj = {};
    const { added, updated } = ensureMcpServers(obj, fixture());
    assert.equal(added, 1);
    assert.equal(updated, 0);
    assert.deepStrictEqual(obj.mcpServers['team-docs'], {
      type: 'http',
      url: SERVER_URL
    });
  });

  it('adds team MCPs when mcpServers is empty', () => {
    const obj = { mcpServers: {} };
    const { added } = ensureMcpServers(obj, fixture());
    assert.equal(added, 1);
    assert.ok(obj.mcpServers['team-docs']);
  });

  it('preserves existing user MCP servers', () => {
    const obj = {
      mcpServers: {
        'my-custom-server': { type: 'stdio', command: 'node server.js' }
      }
    };
    ensureMcpServers(obj, fixture());
    assert.deepStrictEqual(obj.mcpServers['my-custom-server'], {
      type: 'stdio',
      command: 'node server.js'
    });
    assert.ok(obj.mcpServers['team-docs']);
  });

  it('overwrites an existing entry to propagate URL changes', () => {
    const obj = {
      mcpServers: {
        'team-docs': { type: 'http', url: 'https://old-url.com/mcp' }
      }
    };
    const { added, updated } = ensureMcpServers(obj, fixture());
    assert.equal(added, 0);
    assert.equal(updated, 1);
    assert.strictEqual(obj.mcpServers['team-docs'].url, SERVER_URL);
  });

  it('reports no changes when team MCPs already match', () => {
    const obj = { mcpServers: fixture() };
    const { added, updated } = ensureMcpServers(obj, fixture());
    assert.equal(added, 0);
    assert.equal(updated, 0);
  });

  it('preserves all other keys in the object', () => {
    const obj = {
      numStartups: 100,
      projects: { '/some/path': { allowedTools: [] } },
      mcpServers: { 'user-mcp': { type: 'stdio', command: 'echo' } }
    };
    ensureMcpServers(obj, fixture());
    assert.equal(obj.numStartups, 100);
    assert.deepStrictEqual(obj.projects, { '/some/path': { allowedTools: [] } });
    assert.ok(obj.mcpServers['user-mcp']);
    assert.ok(obj.mcpServers['team-docs']);
  });

  it('does not share references with the source registry', () => {
    const servers = fixture();
    const obj = { mcpServers: {} };
    ensureMcpServers(obj, servers);
    obj.mcpServers['team-docs'].url = 'mutated';
    assert.notEqual(servers['team-docs'].url, 'mutated');
  });

  it('is a no-op when the default registry is empty', () => {
    const obj = { mcpServers: {} };
    const { added, updated } = ensureMcpServers(obj);
    assert.equal(added, Object.keys(TEAM_MCP_SERVERS).length);
    assert.equal(updated, 0);
  });
});
