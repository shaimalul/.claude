/**
 * INT: cross-file integrity of the configuration.
 *
 * Catches the class of drift that plain file-level validation misses: a hook
 * registered against a deleted script, a census that no longer matches the
 * directory it describes, a slash command referenced in prose that does not
 * exist. Each failure names the defect ID it maps to in the verification matrix.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  CLAUDE_DIR,
  listSkills,
  listAgents,
  listRules,
  listHookScripts,
  listRegisteredHooks,
} = require('../lib/config-inventory');

const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const TEMPLATE = path.join(CLAUDE_DIR, 'settings.template.json');

// Documented hook events: https://code.claude.com/docs/en/hooks
const HOOK_EVENTS = new Set([
  'SessionStart', 'Setup', 'UserPromptSubmit', 'UserPromptExpansion', 'PreToolUse',
  'PermissionRequest', 'PermissionDenied', 'PostToolUse', 'PostToolUseFailure',
  'PostToolBatch', 'Notification', 'MessageDisplay', 'SubagentStart', 'SubagentStop',
  'TaskCreated', 'TaskCompleted', 'Stop', 'StopFailure', 'TeammateIdle',
  'InstructionsLoaded', 'ConfigChange', 'CwdChanged', 'FileChanged', 'WorktreeCreate',
  'WorktreeRemove', 'PreCompact', 'PostCompact', 'Elicitation', 'ElicitationResult',
  'SessionEnd',
]);

const MODEL_TIERS = new Set(['opus', 'sonnet', 'haiku']);

// Documented `color` values: https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields
const AGENT_COLORS = new Set(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']);
const AGENT_EFFORT_LEVELS = new Set(['low', 'medium', 'high', 'max']);
const AGENT_MAX_LINES = 250;

// Slash commands that are built into Claude Code rather than skills in this repo
const EXTERNAL_COMMANDS = new Set([
  'compact', 'config', 'test', 'clear', 'help', 'skills', 'doctor', 'export',
  'init', 'code-review', 'security-review', 'debug', 'model', 'loop',
]);

const readText = filePath => (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');

/** Markdown files whose prose is scanned for references */
function proseFiles() {
  return [
    path.join(CLAUDE_DIR, 'CLAUDE.md'),
    path.join(CLAUDE_DIR, 'README.md'),
    ...listRules().map(r => r.path),
    ...listAgents().map(a => a.path),
    ...listSkills().map(s => s.path),
  ].filter(fs.existsSync);
}

describe('INT configuration integrity', () => {
  test('INT-01 every registered hook resolves to an existing file', () => {
    const missing = listRegisteredHooks(SETTINGS)
      .filter(hook => hook.scriptPath && !fs.existsSync(hook.scriptPath))
      .map(hook => `${hook.event}: ${hook.command}`);

    assert.deepEqual(missing, [], 'D-03: hooks pointing at deleted scripts fail on every trigger');
  });

  test('INT-02 hook commands without a script path are external binaries', () => {
    const external = listRegisteredHooks(SETTINGS)
      .filter(hook => !hook.scriptPath)
      .map(hook => hook.command.trim().split(/\s+/)[0]);

    external.forEach(binary =>
      assert.match(binary, /^[\w.-]+$/, `unexpected non-path hook command: ${binary}`)
    );
  });

  test('INT-03 every configured hook event is a documented event name', () => {
    [SETTINGS, TEMPLATE].forEach(file => {
      const events = Object.keys(JSON.parse(readText(file)).hooks || {});
      events.forEach(event =>
        assert.ok(HOOK_EVENTS.has(event), `${path.basename(file)}: unknown hook event "${event}"`)
      );
    });
  });

  test('INT-04 both settings files declare the official schema', () => {
    [SETTINGS, TEMPLATE].forEach(file => {
      const settings = JSON.parse(readText(file));
      assert.equal(settings.$schema, 'https://json.schemastore.org/claude-code-settings.json');
    });
  });

  test('INT-05 the template registers every hook script the live settings do', () => {
    const scriptName = hook => hook.scriptPath && path.basename(hook.scriptPath);
    const inTemplate = new Set(listRegisteredHooks(TEMPLATE).map(scriptName).filter(Boolean));
    const missing = listRegisteredHooks(SETTINGS)
      .map(scriptName)
      .filter(name => name && !inTemplate.has(name));

    assert.deepEqual(missing, [], 'D-05: setup.sh regeneration would drop these hooks');
  });

  test('INT-06 a declared skill name matches its directory', () => {
    const mismatched = listSkills()
      .filter(skill => skill.frontmatter.name && skill.frontmatter.name !== skill.dirName)
      .map(skill => `${skill.dirName} declares name: ${skill.frontmatter.name}`);

    assert.deepEqual(mismatched, [], 'D-09: frontmatter name diverges from the invoked command');
  });

  test('INT-07 every agent declares a name, description and known model tier', () => {
    listAgents().forEach(agent => {
      const { name, description, model } = agent.frontmatter;
      assert.ok(name, `${agent.dirName}: missing name`);
      assert.ok(description, `${agent.dirName}: missing description`);
      assert.ok(MODEL_TIERS.has(model), `${agent.dirName}: model "${model}" is not a tier alias`);
      assert.equal(name, agent.dirName, `${agent.dirName}: name does not match filename`);
    });
  });

  test('INT-16 every agent declares memory: project', () => {
    const wrong = listAgents()
      .filter(agent => agent.frontmatter.memory !== 'project')
      .map(agent => `${agent.dirName}: memory "${agent.frontmatter.memory}" (expected project)`);

    assert.deepEqual(wrong, [], 'every agent should share its memory via version control');
  });

  test('INT-17 agent color and effort, when present, are documented values', () => {
    const bad = [];
    listAgents().forEach(agent => {
      const { color, effort } = agent.frontmatter;
      if (color !== undefined && !AGENT_COLORS.has(color)) {
        bad.push(`${agent.dirName}: color "${color}" is not a documented value`);
      }
      if (effort !== undefined && !AGENT_EFFORT_LEVELS.has(effort)) {
        bad.push(`${agent.dirName}: effort "${effort}" is not a documented level`);
      }
    });

    assert.deepEqual(bad, []);
  });

  test('INT-18 no agent lists AskUserQuestion - it is stripped from every subagent', () => {
    const offenders = listAgents()
      .filter(agent => /\bAskUserQuestion\b/.test(agent.frontmatter.tools || ''))
      .map(agent => agent.dirName);

    assert.deepEqual(offenders, [], 'AskUserQuestion never reaches a subagent; declaring it is dead config');
  });

  test('INT-19 every skill an agent preloads resolves to an existing skill directory', () => {
    const skillNames = new Set(listSkills().map(skill => skill.dirName));
    const dangling = [];

    listAgents().forEach(agent => {
      const declared = (agent.frontmatter.skills || '').split(',').map(s => s.trim()).filter(Boolean);
      declared.forEach(name => {
        if (!skillNames.has(name)) {
          dangling.push(`${agent.dirName} preloads missing skill "${name}"`);
        }
      });
    });

    assert.deepEqual(dangling, []);
  });

  test('INT-20 every agent body carries a Memory Protocol section', () => {
    const missing = listAgents()
      .filter(agent => !/^## Memory Protocol/m.test(readText(agent.path)))
      .map(agent => agent.dirName);

    assert.deepEqual(missing, [], 'memory: project without a Memory Protocol section never gets used');
  });

  test('INT-21 no agent file exceeds the line budget', () => {
    const oversized = listAgents()
      .filter(agent => readText(agent.path).split('\n').length > AGENT_MAX_LINES)
      .map(agent => agent.dirName);

    assert.deepEqual(oversized, [], `past ${AGENT_MAX_LINES} lines, content belongs in a skill, not the agent body`);
  });

  test('INT-08 no model version is pinned anywhere', () => {
    const pinned = proseFiles().filter(file => {
      if (/models\.md|CLAUDE\.md|improve-claude/.test(file)) return false;
      return /claude-(opus|sonnet|haiku)-\d/.test(readText(file));
    });

    assert.deepEqual(pinned, [], 'model versions must be referenced by tier alias only');
  });

  test('INT-09 every config file a hook reads exists', () => {
    const required = [
      path.join(CLAUDE_DIR, 'config', 'continuous-learning.json'),
    ];
    const missing = required.filter(file => !fs.existsSync(file));

    assert.deepEqual(missing, [], 'D-04: hook silently falls back to defaults');
  });

  test('INT-10 every backticked slash command resolves to a skill', () => {
    const skills = new Set(listSkills().map(skill => skill.dirName));
    const unresolved = new Set();

    proseFiles().forEach(file => {
      // A command occupies the whole backticked token; `/api/users` and a
      // `s/x/y/g` flag are paths and regex, not slash commands.
      const matches = readText(file).matchAll(/`\/([a-z][\w-]*)(?=[`\s\]]|$)/gm);
      for (const [, command] of matches) {
        if (!skills.has(command) && !EXTERNAL_COMMANDS.has(command)) {
          unresolved.add(command);
        }
      }
    });

    assert.deepEqual([...unresolved].sort(), [], 'D-15: prose references a nonexistent command');
  });

  test('INT-11 every Extends: declaration names an existing base skill', () => {
    const skills = listSkills();
    const names = new Set(skills.map(skill => skill.dirName));
    const dangling = skills
      .filter(skill => skill.extends && !names.has(skill.extends))
      .map(skill => `${skill.dirName} extends missing ${skill.extends}`);

    assert.deepEqual(dangling, []);
  });

  test('INT-12 no Extends: consumer duplicates a block from its base', () => {
    const skills = listSkills();
    const byName = new Map(skills.map(skill => [skill.dirName, skill]));

    const normalize = text =>
      text.split('\n').map(line => line.trim()).filter(Boolean).join('\n');

    const blocks = filePath =>
      new Set(
        readText(filePath)
          .split(/\n(?=#{2,3} )/)
          .map(normalize)
          .filter(block => block.split('\n').length >= 5)
      );

    const duplicates = [];
    skills
      .filter(skill => skill.extends && byName.has(skill.extends))
      .forEach(skill => {
        const baseBlocks = blocks(byName.get(skill.extends).path);
        blocks(skill.path).forEach(block => {
          if (baseBlocks.has(block)) {
            duplicates.push(`${skill.dirName} repeats a block from ${skill.extends}`);
          }
        });
      });

    assert.deepEqual(duplicates, [], 'D-10: Extends means overrides only');
  });

  test('INT-14 the improve-claude census matches the real directory counts', () => {
    const census = readText(path.join(CLAUDE_DIR, 'skills', 'improve-claude', 'SKILL.md'));
    const claims = [
      ['rules/', listRules().length],
      ['agents/', listAgents().length],
    ];

    const wrong = claims
      .filter(([label, actual]) => {
        const match = census.match(new RegExp(`\`${label}\`\\s*\\|\\s*(\\d+) files?`));
        return match && Number(match[1]) !== actual;
      })
      .map(([label, actual]) => `${label} census disagrees with actual count ${actual}`);

    assert.deepEqual(wrong, [], 'D-13: a stale census misroutes new rules');
  });

  test('INT-15 hook scripts stay within the file size limit', () => {
    const oversized = listHookScripts()
      .concat(listNamedScripts())
      .filter(script => readText(script.path).split('\n').length > 150)
      .map(script => script.name);

    assert.deepEqual(oversized, []);
  });
});

/** Library scripts, checked alongside hooks for the size limit */
function listNamedScripts() {
  const dir = path.join(CLAUDE_DIR, 'scripts', 'lib');
  return fs.existsSync(dir)
    ? fs.readdirSync(dir)
        .filter(name => name.endsWith('.js'))
        .map(name => ({ name, path: path.join(dir, name) }))
    : [];
}
