# Phase 2: Frontmatter List Parsing and Agent Wiring Checks

## Goal

Teach the frontmatter parser to read list-valued fields, expose an agent's declared skills through the inventory, and add the free validator that catches the highest-probability real failure in this repo: renaming a skill directory and silently breaking every agent that loads it.

## Why Now

Phase 1 made the suite trustworthy. This is the ENABLING change for everything downstream: the current parser reads `skills:` as an opaque string, which blocks both the wiring check here and the composition harness in phase 5.

## Dependencies

- Blocked by: 1
- Receives: a green suite and a CI job that enforces it
- Provides: `readListField` and `agentSkills()` to phase 5, and a wiring gate that phase 7's combination cases depend on for correctness

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `scripts/lib/skill-frontmatter.js` | Existing, extend | `readListField` parses `a, b, c` and tolerates `[a, b]`, returns empty for a missing key |
| `scripts/lib/config-inventory.js` | Existing, extend | `agentSkills(agent)` returns the resolved list for an agent |

Both are existing seams, chosen over new ones because every census in the repo already reads through `config-inventory` and that is the reason INT-14 exists.

## Scope

In:
- `readListField(fields, key)` on the frontmatter parser
- `agentSkills(agent)` on the inventory
- INT-16: every name in every agent `skills:` list resolves to a real `skills/<name>/SKILL.md`
- INT-17: no workflow file uses a floating `node-version:` instead of `node-version-file:`

Out:
- Anything that reads eval results. `config-inventory` must NOT learn about them, or the free layer starts depending on promptfoo being installed
- Composition rendering. Phase 5
- Coverage accounting. Phase 6

## Files to Add

None. Both changes extend existing modules, and the new assertions join the existing INT family.

## Files to Edit

- `scripts/lib/skill-frontmatter.js` - add `readListField`, exported alongside `parseFrontmatter` and `KEBAB_RE`
- `scripts/lib/config-inventory.js` - add `agentSkills(agent)` built on `readListField`
- `scripts/tests/validate-integrity.test.js` - add INT-16 and INT-17
- `scripts/lib/tests/` - unit tests for the two new functions

## Implementation Steps

1. Add `readListField(fields, key)` to `skill-frontmatter.js`
   - Split on commas, trim each entry, drop empties
   - Tolerate a bracketed YAML flow list `[a, b]` by stripping the brackets first
   - Return `[]` for a missing key, never `undefined`, so callers need no guard
   - Keep it pure and string-only. It does no filesystem work

2. Add `agentSkills(agent)` to `config-inventory.js`
   - Parse the agent's frontmatter, then `readListField(fields, 'skills')`
   - Return names only. Resolution to paths belongs to the caller, because the inventory answers "what is declared" and not "what exists"

3. Add INT-16
   - For every agent, every declared skill name must have a `skills/<name>/SKILL.md`
   - The failure message must name the agent, the missing skill, and nothing else, so it points at exactly one mechanical fix
   - 8 of 11 agents declare the field today, so this covers real surface immediately

4. Add INT-17
   - Scan `.github/workflows/*.yml` for `node-version:` followed by a literal
   - Fail with the file and line. Phase 1 made this passable; without that it would land red

5. Unit test both new functions directly
   - `readListField` on: comma list, bracketed list, single value, missing key, trailing commas, extra whitespace
   - `agentSkills` on a fixture agent

## Tests

- [ ] `scripts/lib/skill-frontmatter.js`: `readListField` parses a comma list into trimmed entries
- [ ] `scripts/lib/skill-frontmatter.js`: `readListField` tolerates a bracketed flow list
- [ ] `scripts/lib/skill-frontmatter.js`: `readListField` returns an empty array for a missing key
- [ ] `scripts/lib/config-inventory.js`: `agentSkills` returns declared names for an agent that has them, and empty for one that does not
- [ ] `scripts/tests/`: INT-16 fails when an agent names a skill directory that does not exist
- [ ] `scripts/tests/`: INT-17 fails when a workflow pins a floating `node-version:`

## Verification

```bash
npm run test:lib
npm run validate
npm test
```

Prove INT-16 actually bites before believing it. Temporarily rename a skill directory that an agent declares, confirm INT-16 goes red naming that agent and skill, then rename it back.

## Done When

- [ ] `readListField` is exported and unit tested
- [ ] `agentSkills` is exported and unit tested
- [ ] INT-16 passes on the current repo and demonstrably fails on a renamed skill
- [ ] INT-17 passes and demonstrably fails on a floating `node-version:`
- [ ] `config-inventory` still has no dependency on promptfoo or eval results
- [ ] `npm test` is green

## Notes for Next Phase

`agentSkills()` is the input phase 5 needs to resolve an agent's skills during composition. Note the split deliberately kept here: the inventory returns NAMES and the caller resolves them to paths. Phase 5 relies on that, because addressing artifacts by name rather than by relative path is what makes a rename fail loudly instead of silently producing an empty prompt.

Phases 3 and 4 share phase 1 as their only blocker and are independent of this one, so any of them can be taken next.
