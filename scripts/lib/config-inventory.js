/**
 * Single source of truth for what this configuration actually contains.
 *
 * Every census - the integrity checks, and any documentation that claims a
 * count - should read from here rather than hand-maintaining a table that
 * silently drifts as files are added.
 */

const fs = require('fs');
const path = require('path');

const { readFrontmatterFields, readExtends } = require('./skill-frontmatter');

const CLAUDE_DIR = path.resolve(__dirname, '..', '..');

/** Runner prefixes a hook command may carry before its script path */
const RUNNERS = ['node', 'bash', 'sh', 'python3', 'python'];

const listDir = (dir, predicate) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter(predicate).sort() : [];

/** Every skill directory with its frontmatter and Extends declaration */
function listSkills() {
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  return listDir(skillsDir, entry =>
    fs.existsSync(path.join(skillsDir, entry, 'SKILL.md'))
  ).map(dirName => {
    const filePath = path.join(skillsDir, dirName, 'SKILL.md');
    return {
      dirName,
      path: filePath,
      frontmatter: readFrontmatterFields(filePath),
      extends: readExtends(filePath),
    };
  });
}

/** Every agent definition with its frontmatter */
function listAgents() {
  const agentsDir = path.join(CLAUDE_DIR, 'agents');
  return listDir(agentsDir, entry => entry.endsWith('.md')).map(fileName => {
    const filePath = path.join(agentsDir, fileName);
    return {
      dirName: fileName.replace(/\.md$/, ''),
      path: filePath,
      frontmatter: readFrontmatterFields(filePath),
    };
  });
}

const listNamed = (dirName, filter) => {
  const dir = path.join(CLAUDE_DIR, dirName);
  return listDir(dir, filter).map(name => ({ name, path: path.join(dir, name) }));
};

const listRules = () => listNamed('rules', entry => entry.endsWith('.md'));
const listHookScripts = () =>
  listNamed('scripts/hooks', entry => entry.endsWith('.js') || entry.endsWith('.sh'));

/**
 * Resolve a hook command to a script path, or null when it is an external
 * binary invocation (e.g. `afplay ...`) rather than a script.
 */
function resolveHookCommand(command) {
  const parts = command.trim().split(/\s+/);
  const candidate = RUNNERS.includes(parts[0]) ? parts[1] : parts[0];
  if (!candidate) return null;
  const home = path.dirname(CLAUDE_DIR);
  const expanded = candidate.replace('__HOME__', home).replace(/^~(?=\/)/, home);
  return expanded.includes('/') ? expanded : null;
}

/** Every hook registered in a settings file, flattened across events */
function listRegisteredHooks(settingsPath) {
  if (!fs.existsSync(settingsPath)) return [];
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  return Object.entries(settings.hooks || {}).flatMap(([event, groups]) =>
    (groups || []).flatMap(group =>
      (group.hooks || []).map(hook => ({
        event,
        matcher: group.matcher,
        command: hook.command,
        timeout: hook.timeout,
        scriptPath: resolveHookCommand(hook.command || ''),
      }))
    )
  );
}

module.exports = {
  CLAUDE_DIR,
  listSkills,
  listAgents,
  listRules,
  listHookScripts,
  listRegisteredHooks,
  resolveHookCommand,
};
