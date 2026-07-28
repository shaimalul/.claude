/**
 * SK: per-file validation of every SKILL.md.
 *
 * Frontmatter shape only. Cross-file concerns - name versus directory, model
 * tiers, base duplication - belong to validate-integrity.test.js so each rule
 * has exactly one home.
 *
 * `name` is optional per the skills reference: it defaults to the directory
 * name and only labels the skill in listings. It is validated when present.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const { parseFrontmatter, KEBAB_RE } = require('../lib/skill-frontmatter');
const { listSkills } = require('../lib/config-inventory');

const LINE_WARN_THRESHOLD = 500;

const skills = listSkills();

describe('SK skill definitions', () => {
  test('SK-01 at least one skill is discovered', () => {
    assert.ok(skills.length > 0, 'no skills found');
  });

  skills.forEach(skill => {
    describe(`skills/${skill.dirName}`, () => {
      const lines = fs.readFileSync(skill.path, 'utf8').split('\n');
      const parsed = parseFrontmatter(lines);

      test('SK-02 has a terminated frontmatter block', () => {
        assert.ok(parsed, 'file must open with --- and have a closing ---');
      });

      test('SK-03 declares a non-empty description', () => {
        assert.ok(parsed, 'frontmatter required');
        assert.ok(parsed.fields.description, 'description is required and must have content');
      });

      test('SK-04 any declared name is kebab-case', () => {
        assert.ok(parsed, 'frontmatter required');
        const { name } = parsed.fields;
        if (name === undefined) return;
        assert.match(name, KEBAB_RE, `"${name}" is not kebab-case`);
      });

      test('SK-05 has body content after the frontmatter', () => {
        assert.ok(parsed, 'frontmatter required');
        const body = lines.slice(parsed.bodyStart).filter(line => line.trim());
        assert.ok(body.length > 0, 'no content after the closing ---');
      });

      const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
      const oversized = lineCount > LINE_WARN_THRESHOLD;
      test(
        'SK-06 stays under the length threshold',
        oversized ? { todo: `${lineCount} lines exceeds ${LINE_WARN_THRESHOLD}` } : {},
        () => {
          assert.ok(!oversized);
        }
      );
    });
  });
});
