/**
 * YAML frontmatter parsing for SKILL.md and agent markdown files.
 *
 * Shared by the skill validator and the config inventory so the parse rules
 * live in exactly one place.
 */

const fs = require('fs');

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Parse frontmatter from an array of lines.
 * @returns {{fields: object, bodyStart: number}|null} null when absent or unterminated
 */
function parseFrontmatter(lines) {
  if (!lines.length || lines[0].trimEnd() !== '---') return null;

  let closeIndex = null;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trimEnd() === '---') {
      closeIndex = i;
      break;
    }
  }
  if (closeIndex === null) return null;

  const fields = {};
  for (let i = 1; i < closeIndex; i += 1) {
    const line = lines[i];
    if (line.startsWith('#')) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    fields[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
  }

  return { fields, bodyStart: closeIndex + 1 };
}

/** Read a markdown file and return its parsed frontmatter fields, or {} */
function readFrontmatterFields(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8').split('\n'));
  return parsed ? parsed.fields : {};
}

/**
 * Read the `Extends: <base>` declaration from a skill body, or null.
 * Tolerates both plain (`Extends:`) and bold (`**Extends:**`) markdown forms,
 * which coexist across skills in this repo.
 */
function readExtends(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const match = fs
    .readFileSync(filePath, 'utf8')
    .match(/^\*{0,2}Extends:\*{0,2}\s*`?([\w-]+)`?/m);
  return match ? match[1] : null;
}

module.exports = { parseFrontmatter, readFrontmatterFields, readExtends, KEBAB_RE };
