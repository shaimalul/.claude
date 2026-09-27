# File Format Reference

The authoritative source for per-file-type formatting in this configuration. Phase 5.5 of [SKILL.md](SKILL.md) validates every write against it. Update this file whenever a new convention is discovered. How to WRITE the content (pointers, hierarchy, pruning) is owned by the `writing-for-agents` primitive, not this file.

## Skills (`skills/*/SKILL.md`)

```markdown
---
name: skill-name
description: Single sentence describing what this skill provides or does.
globs: "**/*.ts,**/*.tsx"
user-invocable: false
argument-hint: "[optional-arg]"
---

# Skill Topic Name

Opening paragraph (optional) - one to two sentences of context.

## Section Name

Description without bold text.

\`\`\`typescript
// Bad - [reason this is wrong]
[problematic example]

// Good - [what this achieves]
[correct example]
\`\`\`

## Quick Reference

| Pattern | Rule     |
| ------- | -------- |
| item    | guidance |
```

Field rules:

- `name`: kebab-case, MUST match the directory name exactly
- `description`: one sentence, states what the skill does or when to use it
- `globs`: comma-separated glob patterns, no spaces, quoted as a single string
- `user-invocable: false`: include only when auto-loaded; omit entirely for user-invocable skills
- `argument-hint`: include only when the skill accepts a `$ARGUMENTS` variable
- The h1 immediately follows the frontmatter. h2 for sections, h3 for subsections, NEVER h4 or deeper
- End with a quick reference table or checklist section

### Supporting Files

Per the official pattern ([code.claude.com/docs/en/skills#add-supporting-files](https://code.claude.com/docs/en/skills#add-supporting-files)), a skill directory can hold more than `SKILL.md`. Use this whenever content belongs on the disclosed rung of the information hierarchy in `writing-for-agents`:

```text
skill-name/
├── SKILL.md           # required - overview, steps, navigation
├── reference.md        # detailed docs loaded only when needed
├── examples.md          # sample outputs showing expected format
├── template.md          # template for Claude to fill in
└── scripts/
    └── helper.sh        # executable script, not loaded into context
```

Rules:

- `SKILL.md` MUST reference every supporting file by relative markdown link (e.g. `See [reference.md](reference.md)`) so Claude knows what each file contains and when to load it - an unreferenced file is dead weight
- Scripts referenced from `SKILL.md` should use the `${CLAUDE_SKILL_DIR}` substitution for their path (e.g. `` `${CLAUDE_SKILL_DIR}/scripts/helper.sh` ``) so the reference resolves correctly whether the skill is installed at the personal, project, or plugin level
- Keep `SKILL.md` itself under ~500 lines; move anything past that threshold into a supporting file rather than trimming content that's actually needed
- Not every skill needs supporting files - a short, self-contained skill should stay a single `SKILL.md`

## Agents (`agents/*.md`)

```markdown
---
name: agent-name
description: When and why to use this agent, phrased as trigger conditions.
tools: Read, Grep, Glob, Bash, Edit, Write
disallowedTools: Write, Edit
model: opus
effort: high
skills: skill1, skill2
memory: project
maxTurns: 25
color: purple
---

# Agent Display Name

Role statement - one paragraph, plain text, no bold, no lists.

## When Invoked

1. Step the agent takes on every invocation

## Section Heading

Content that is NOT already covered by a preloaded skill...

## Checklist Section

- [ ] Checklist item

## Memory Protocol

[See rules/agents.md Memory Protocol for the canonical text]
```

Field rules:

- `tools`: comma-space separated, each tool name capitalized: Read, Grep, Glob, Bash, Edit, Write, Agent, TodoWrite
- `disallowedTools`: comma-space separated, same format as `tools`. Optional. Applied before `tools` resolves, so it strips even what `memory:` would otherwise auto-grant: use it to keep an advisory-only agent (architect, product, security) unable to write source, at the cost of it also being unable to write memory notes. See `rules/agents.md` Memory Protocol
- `model`: alias only (`opus`, `sonnet`, `haiku`) - never a versioned id. Pick the tier from `rules/models.md` and record the assignment there
- `effort`: optional, `low`/`medium`/`high`/`max`. Record any `high` assignment in `rules/models.md`
- `skills`: comma-space separated kebab-case skill names
- `memory`: `project` for every agent (see `rules/agents.md` Memory Protocol)
- `maxTurns`: integer, typical range 10-30
- `color`: optional, one of red/blue/green/yellow/purple/orange/pink/cyan. Assign one per agent so parallel spawns (e.g. `/review`) are distinguishable in the task list
- The body opens with a role statement paragraph (one to two sentences, plain text), then: domain standards, checklist or analysis framework, output format, Memory Protocol (see `rules/agents.md`), coordination with other agents
- Body must NOT restate content already in a preloaded skill - reference the skill instead. Keep the file under ~250 lines

## Rules (`rules/*.md`)

```markdown
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Rule Category Title

## Subsection

ALWAYS do X. NEVER do Y.

\`\`\`typescript
// Bad - [reason]
[example]

// Good - [description]
[example]
\`\`\`

## Checklist

- [ ] Check item 1
- [ ] Check item 2
```

Field rules:

- Frontmatter is only present when the rule applies to specific file paths (path-scoping)
- `paths` is a YAML list of glob strings
- Emphasis via CAPS (`ALWAYS`, `NEVER`, `CRITICAL`) - NEVER via bold
- Checklist items use `- [ ] Item`
- h1 title, h2 sections - no h3 in rules files

## Hook Scripts (`scripts/hooks/*.js`)

```javascript
#!/usr/bin/env node
/**
 * Hook Description
 */

const { readStdinJson, log } = require("../lib/hook-io");

async function main() {
  // Hook logic
  process.exit(0);
}

main().catch((err) => {
  console.error("[HookName] Error:", err.message);
  process.exit(0); // Don't block on errors
});
```

## Library Scripts (`scripts/lib/*.js`)

```javascript
/**
 * Utility function description
 */
function utilityFunction(param) {
  // Implementation
}

module.exports = { utilityFunction };
```

## Cross-File Rules (apply to ALL file types)

| Rule                 | Detail                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Bullet character     | ALWAYS `-`, NEVER `*` or bullet characters                         |
| Bold in prose        | NEVER use `**...**` - use CAPS or headings instead                 |
| Code fence language  | Every fence MUST have a language identifier                        |
| Bad/Good label style | `// Bad - [reason]` and `// Good - [description]` as code comments |
| Checklist syntax     | `- [ ] Item` (GitHub task list format)                             |
| Heading style        | `#` notation only, NEVER underline (`===` or `---`)                |
| Table separator      | Standard pipe `\|---\|---\|` with at least one dash per cell       |
| h1 count             | Exactly one h1 per file                                            |
