/**
 * REF: references between configuration files resolve, and every census
 * (model tables, primitive registry, README counts) matches the files it describes.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { CLAUDE_DIR, listSkills, listAgents } = require('../lib/config-inventory');

const read = file => fs.readFileSync(file, 'utf8');
const skills = listSkills();
const skillNames = new Set(skills.map(skill => skill.dirName));
const isHidden = skill => skill.frontmatter['user-invocable'] === 'false';

// Relative links `[text](target)` outside code, without URL schemes or anchors-only
function relativeLinks(markdown) {
  const prose = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
  return [...prose.matchAll(/\]\(([^)\s]+)\)/g)]
    .map(([, target]) => target.split('#')[0])
    .filter(target => target && !/^[a-z]+:/i.test(target));
}

/** Supporting files a skill directory holds, relative to it */
function supportingFiles(dir) {
  return fs.readdirSync(dir, { recursive: true })
    .filter(rel => fs.statSync(path.join(dir, rel)).isFile() && rel !== 'SKILL.md');
}

/** Files reachable from SKILL.md by following relative links transitively */
function reachableFrom(dir) {
  const seen = new Set();
  const queue = ['SKILL.md'];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel) || !fs.existsSync(path.join(dir, rel))) continue;
    seen.add(rel);
    if (rel.endsWith('.md')) {
      relativeLinks(read(path.join(dir, rel))).forEach(target =>
        queue.push(path.normalize(path.join(path.dirname(rel), target)))
      );
    }
  }
  return seen;
}

/** Rows of a markdown table under the given heading: first two cells, backticks stripped */
function tableRows(markdown, heading) {
  const section = markdown.split(new RegExp(`^## ${heading}$`, 'm'))[1] || '';
  return section.split(/^## /m)[0].split('\n')
    .filter(line => /^\|/.test(line) && !/^\|\s*-/.test(line))
    .map(line => line.split('|').slice(1, 3).map(cell => cell.trim().replace(/`/g, '')))
    .slice(1);
}

describe('REF cross-file references', () => {
  test('REF-01 every relative link in a skill directory resolves', () => {
    const broken = [];
    skills.forEach(skill => {
      const dir = path.dirname(skill.path);
      ['SKILL.md', ...supportingFiles(dir)].filter(rel => rel.endsWith('.md')).forEach(rel => {
        relativeLinks(read(path.join(dir, rel))).forEach(target => {
          if (!fs.existsSync(path.join(dir, path.dirname(rel), target))) {
            broken.push(`skills/${skill.dirName}/${rel} -> ${target}`);
          }
        });
      });
    });
    assert.deepEqual(broken, []);
  });

  test('REF-02 every supporting file is reachable from its SKILL.md', () => {
    const orphans = [];
    skills.forEach(skill => {
      const dir = path.dirname(skill.path);
      const reachable = reachableFrom(dir);
      supportingFiles(dir)
        .filter(rel => !reachable.has(rel))
        .forEach(rel => orphans.push(`skills/${skill.dirName}/${rel}`));
    });
    assert.deepEqual(orphans, [], 'an unlinked supporting file is dead weight');
  });

  test('REF-03 the skill model table and skill frontmatter agree', () => {
    const table = new Map(tableRows(read(path.join(CLAUDE_DIR, 'rules', 'models.md')), 'Skill Assignments'));
    const problems = [];
    table.forEach((tier, name) => {
      if (!skillNames.has(name)) problems.push(`models.md lists missing skill ${name}`);
    });
    skills.forEach(skill => {
      const declared = skill.frontmatter.model;
      if (declared && table.get(skill.dirName) !== declared) {
        problems.push(`${skill.dirName} declares ${declared}, models.md says ${table.get(skill.dirName) || 'nothing'}`);
      }
      if (!declared && table.has(skill.dirName)) {
        problems.push(`models.md assigns ${table.get(skill.dirName)} to ${skill.dirName}, which declares no model`);
      }
    });
    assert.deepEqual(problems, []);
  });

  test('REF-04 the agent model table and agent frontmatter agree', () => {
    const table = new Map(tableRows(read(path.join(CLAUDE_DIR, 'rules', 'models.md')), 'Agent Assignments'));
    const agents = listAgents();
    const problems = agents
      .filter(agent => table.get(agent.dirName) !== agent.frontmatter.model)
      .map(agent => `${agent.dirName}: frontmatter ${agent.frontmatter.model}, models.md ${table.get(agent.dirName)}`);
    const names = new Set(agents.map(agent => agent.dirName));
    table.forEach((tier, name) => {
      if (!names.has(name)) problems.push(`models.md lists missing agent ${name}`);
    });
    assert.deepEqual(problems, []);
  });

  test('REF-05 every base and primitive named in CLAUDE.md exists and is hidden from the menu', () => {
    const claude = read(path.join(CLAUDE_DIR, 'CLAUDE.md'));
    const registry = claude.split('# Skill Bases and Primitives')[1].split('\n---')[0];
    const named = [...registry.matchAll(/^- `([\w-]+)`/gm)].map(([, name]) => name);
    assert.ok(named.length > 0, 'registry parsed');
    const problems = named.flatMap(name => {
      const skill = skills.find(s => s.dirName === name);
      if (!skill) return [`${name} does not exist`];
      return isHidden(skill) ? [] : [`${name} is missing user-invocable: false`];
    });
    assert.deepEqual(problems, []);
  });

  test('REF-06 README counts match the directories', () => {
    const readme = read(path.join(CLAUDE_DIR, 'README.md'));
    const claims = [
      [/SKILLS \((\d+)\)/, skills.length, 'skills in the overview diagram'],
      [/skills\/\s+# (\d+) skills/, skills.length, 'skills in the folder tree'],
      [/(\d+) user-invocable skills\./, skills.filter(skill => !isHidden(skill)).length, 'user-invocable skills'],
      [/AGENTS \((\d+)\)/, listAgents().length, 'agents in the overview diagram'],
      [/### (\d+) Specialist Agents/, listAgents().length, 'agents heading'],
    ];
    const wrong = claims.flatMap(([pattern, actual, label]) => {
      const match = readme.match(pattern);
      if (!match) return [`README has no claim for ${label}`];
      return Number(match[1]) === actual ? [] : [`${label}: README says ${match[1]}, actual ${actual}`];
    });
    assert.deepEqual(wrong, []);
  });
});
