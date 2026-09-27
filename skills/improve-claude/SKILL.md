---
name: improve-claude
description: Analyze an instruction and add or update it across every Claude Code configuration file it touches, keeping a single source of truth
argument-hint: "[rule-or-standard-to-add] [--category=<name>]"
---

# Improve Claude Configuration

Add or update one instruction across the configuration so it lives in exactly one owning file and every other file points to it.

Arguments: `$ARGUMENTS` - the rule or standard (e.g. "never use 'any' type", "always use http-status-codes package")

## Workflow

0. Base Foundation Check - never duplicate what a base or primitive owns
1. Writing Principles - load `writing-for-agents`
2. Categorize the instruction and resolve its owning files
3. Search for an existing rule to UPDATE rather than duplicate
4. Place it, with generated Bad/Good examples where code is involved
5. Validate format against [FORMATS.md](FORMATS.md)
6. Present the change, apply it after the user confirms
7. Propagate pointers, sync `README.md`
8. Verify and report

Every step lands on the files as they exist now. Read counts, section names, and file lists from the files (`ls`, `grep '^#' <file>`), never from memory.

## Phase 0: Base Foundation Check (MANDATORY, RUNS FIRST)

Skills inherit from a base. Before creating or editing ANY skill, check whether a base already owns the concept - and never duplicate what a base defines.

### Base Registry

A base is a skill that owns shared content for a family. Consumers declare `Extends: <base>`.

| Base          | Owns                                                                                                                                                                     | Consumers                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `review-base` | Finding prefixes, comment style, agent routing, the fixed point, the two axes, the Fowler smell baseline, review machinery, discussion handling, learning loop       | review, review-test, fix-review |
| `plan-base`   | Domain discovery, mastermind invocation, specialist roster, plan output format, seams under test, the planning grill                                                     | plan-task, plan-to-docs         |

### Primitive Registry

A primitive is a skill that owns ONE concept outright, referenced by name from anywhere. Not a base: consumers do not extend it, they cite it.

| Primitive         | Owns                                                                                                                        | Cited by                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `grilling`        | The decision-tree interview: rounds over the frontier, recommended answer, facts looked up not asked, the stop option        | plan-base, plan-test, domain-modeling, wayfinder                      |
| `domain-modeling` | `CONTEXT.md` glossary format, ADR format and the 3-of-3 gate, single vs multi-context layout, lazy creation, consumer rules | plan-base, tdd, review-base, find-bug                                 |
| `codebase-design` | Deep-module vocabulary: module, interface, depth, seam, adapter, leverage, locality. The deletion test. Design-it-twice     | tdd, testing-patterns, refactoring-patterns, architect-agent          |
| `tdd`             | Red-green-refactor loop, what a good test is, seams, test anti-patterns                                                     | rules/testing.md, fix-review, implement-phase, plan-test, review-test |
| `writing-for-agents` | How to write any agent-read document: context pointers, the two loads, information hierarchy, completion criteria, leading words, pruning | improve-claude, extract-learning |

Bases and primitives are marked `user-invocable: false` and are never invoked by name from the `/` menu.

Before adding a rule anywhere, check both registries. If a base or primitive already owns the concept, the rule goes THERE and every other file references it.

### Before Creating a Skill

1. Does an existing base cover this skill's family? If yes, the new skill declares `Extends: <base>` and contains ONLY its overrides
2. Is there no base, but two or more skills would now share substantial content? Create the base FIRST, then write both consumers thin
3. Neither applies? Write the skill standalone

### Before Editing a Skill

1. Is the text you are about to add already in a base? Do NOT add it - reference the base section by name
2. Does the change apply to the whole family? Edit the BASE, not the consumer. One edit must propagate to every consumer
3. Is it genuinely specific to this one skill? It belongs in that skill's Overrides section

### Consumer Skill Shape

A consumer skill is frontmatter, an `Extends:` line, a workflow that names inherited steps, and an Overrides section. Nothing else.

```markdown
---
name: my-review-variant
description: ...
---

# My Review Variant

Extends: `review-base`

## Workflow

1. MACHINERY.md Step A - mode detection
2. Agent Routing Table - categorize and spawn
3. MACHINERY.md Step C - post findings

## Overrides

### Comment Style

[only what differs from the base]
```

### Duplication Audit

When touching a skill family, verify no concept is defined twice:

```bash
python3 -c "
import glob,itertools,os
F=sorted(glob.glob('skills/*/SKILL.md'))
S={f:set(l.strip() for l in open(f) if len(l.strip())>30) for f in F}
for a,b in itertools.combinations(F,2):
    n=len(S[a]&S[b])
    if n>=12: print(n,'shared lines:',os.path.basename(os.path.dirname(a)),'<->',os.path.basename(os.path.dirname(b)))
"
```

Any pair over ~12 shared substantive lines needs a base extracted. Run this from the repo root before finishing.

## Phase 0.5: Writing Principles

Load the `writing-for-agents` primitive and apply it to every sentence you write or edit. For a skill, also apply its SKILL-MECHANICS.md. Do not restate those principles here.

## Phase 1: Categorize

Match the instruction against the Category Detection table in [ROUTING.md](ROUTING.md). A `--category=<name>` flag overrides detection. If two categories fit equally, ask the user which owns it.

Done when you can name the category and its owning files.

## Phase 2: Resolve Target Files

List every file the rule must touch: the ONE owner that states it, and each consumer that must point to it (see Propagation Targets in [ROUTING.md](ROUTING.md)).

```text
Category: [detected]
Owner: [the one file that states the rule]
Pointers: [files that reference the owner]
```

## Phase 3: Search for Existing Rules

Search the owner and every candidate consumer for the concept, by keyword and by synonym:

```bash
grep -rniE "<keyword>|<synonym>" CLAUDE.md rules agents skills/*/SKILL.md
```

- A rule with more than half the concept already exists: UPDATE it in place and merge the new guidance
- The concept is stated in more than one place already: that is an existing SSOT violation. Collapse it to the owner as part of this change
- Nothing matches: ADD it to the owner

## Phase 4: Place It

Read the owner's headings (`grep -n '^#' <file>`) and place the rule under the most specific existing section. Create a section only when none fits.

When the rule concerns code, generate a Bad/Good pair that matches the complexity of the file's existing examples:

```typescript
// Bad - [what the rule forbids]
[realistic bad example]

// Good - [what the rule asks for]
[realistic good example]
```

Script behaviour changes go through `tdd` like any other code: a failing test in `scripts/**/tests/` first.

## Phase 5.5: Format Conformance Validation (MANDATORY)

Before writing any new or modified file, verify that the output matches the formatting conventions of the target file type. Skipping this phase is NOT allowed.

### Step 1: Read an Exemplar

For each file being created or significantly modified, read one existing file of the same type first:

| File Type            | Exemplar to Read                                                        |
| -------------------- | ----------------------------------------------------------------------- |
| `skills/*/SKILL.md`  | `skills/react-component/SKILL.md` or `skills/typescript-types/SKILL.md` |
| `agents/*.md`        | `agents/architect-agent.md`                                             |
| `rules/*.md`         | `rules/coding-style.md`                                                 |
| `scripts/hooks/*.js` | `scripts/hooks/evaluate-session.js`                                     |
| `scripts/lib/*.js`   | `scripts/lib/files.js`                                                  |

Use the exemplar to confirm field order, heading levels, list character, and code fence language tags before writing.

### Step 2: Apply Per-Type Formatting Rules

Apply the rules for the target file type from [FORMATS.md](FORMATS.md): frontmatter field order, heading depth, and the cross-file rules. That file is the single source for formatting; do not restate it here.

### Step 3: Pre-Write Validation Checklist

Run through this checklist before writing each file. Do NOT write the file if any item fails.

```markdown
Format Conformance Checklist:
- [ ] Read an exemplar of the same file type (Step 1 completed)
- [ ] Frontmatter fields are in the correct order for this file type
- [ ] name field is kebab-case and matches directory/filename
- [ ] All list items use - (not * or bullet characters)
- [ ] No bold text in prose (**...** removed or restructured)
- [ ] All code fences have a language identifier
- [ ] Bad/Good examples use // Bad - [reason] / // Good - [description] pattern
- [ ] Checklist items use - [ ] syntax
- [ ] Heading hierarchy does not exceed h3 (skills) or h2 (rules)
- [ ] # notation used for all headings (not underline style)
- [ ] Tables use standard pipe format with |---|---| separator row
- [ ] Exactly one h1 per file
- [ ] For skills: reference only some branches need is split into supporting files (see Supporting Files in FORMATS.md), not inlined into SKILL.md
- [ ] For skills: every supporting file is linked from SKILL.md by relative path
```

If any item fails, correct the draft before proceeding to Phase 6.

## Phase 6: Apply Changes

Present the proposed change: each file, the section, and a one-line summary of what changes. Wait for explicit user confirmation. Only then create the bypass lock the config-edit guard checks (it expires after 30 minutes):

```bash
echo $(date +%s) > ~/.claude/.config-edit-unlocked
```

Apply the edits. For an existing rule, merge rather than append, and keep the file's formatting.

## Phase 7: Propagate And Sync

1. Every consumer from Phase 2 now points to the owner by name. Remove any restatement it carried
2. If the change adds, removes, or renames a skill, agent, hook, or rule file, update `README.md` (catalog tables and counts, read from `ls`) and `rules/models.md` when a tier is declared
3. Learnings from `/review` or `/extract-learning` integrate into the existing domain skill that owns the topic. There is no `learned/` folder

## Phase 8: Verify And Report

Run the static suite; it is the executable form of most rules above (SSOT across bases, dangling references, frontmatter, counts):

```bash
npm test
```

Done when it passes. Then remove the lock and report:

```bash
rm -f ~/.claude/.config-edit-unlocked
```

```markdown
## /improve-claude Report

Instruction: [instruction]
Category: [category]

| File | Action | Section |
|---|---|---|
| [owner] | Added / Updated | [section] |
| [consumer] | Pointer added | [section] |

Verification: npm test [pass count] passing
```

## Usage Examples

```bash
/improve-claude "never use 'any' type - use proper typing or type guards"
/improve-claude "always use http-status-codes instead of raw numbers like res.status(500)"
/improve-claude "validate all inputs" --category=backend
```

## Checklist

- [ ] The rule lives in exactly one owner; every other file points to it
- [ ] No base or primitive already owned it
- [ ] Format validated against FORMATS.md
- [ ] The user confirmed before any edit
- [ ] `npm test` passes and the lock file is removed
