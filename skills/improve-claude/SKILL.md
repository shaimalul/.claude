---
name: improve-claude
description: Analyze instructions and add/update them across all Claude Code configuration files maintaining single source of truth
argument-hint: "[rule-or-standard-to-add]"
---

# Improve Claude Configuration

I'll analyze your instruction and add/update it across all relevant Claude Code configuration files, maintaining single source of truth.

Arguments: `$ARGUMENTS` - The rule/standard to add (e.g., "never use 'any' type", "always use http-status-codes package")

## What I Do

0. **Base Foundation Check** - never duplicate what a base skill already defines (Phase 0, runs first)

When you provide an instruction, I will:

1. **Categorize** - Detect the domain (TypeScript, Frontend, Backend, Security, DevOps, AI, Testing, Styling)
2. **Find Target Files** - Identify which config files should contain this rule
3. **Search for Existing** - Find similar rules to UPDATE (never duplicate)
4. **Auto-Generate Examples** - Create Bad/Good code patterns from your instruction
5. **Apply Changes** - Update files directly, no confirmation needed
6. **Sync README** - Update project documentation if structural changes were made
7. **Report** - Show exactly what was updated/created

## Configuration Files I Manage

| Location                       | Purpose                                                            | Format                      |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------- |
| `~/.claude/CLAUDE.md`          | Global standards document (source of truth)                        | Markdown                    |
| `~/.claude/rules/*.md`         | Personal coding guidelines, security checklists, workflow patterns | Markdown                    |
| `~/.claude/agents/*.md`        | Specialized AI agent personalities with model assignments          | Markdown + YAML frontmatter |
| `~/.claude/skills/*/SKILL.md`  | Domain-specific patterns and user-invocable skill definitions      | Markdown + YAML frontmatter |
| `~/.claude/scripts/hooks/*.js` | Session lifecycle automation hooks                                 | JavaScript                  |
| `~/.claude/scripts/lib/*.js`   | Shared utility functions for scripts                               | JavaScript                  |
| `~/.claude/README.md`          | Project documentation (skill catalog, agent table, hooks)          | Markdown                    |

### Directory Overview

| Directory        | Files      | Content                                                                                                                                                                |
| ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rules/`         | 8 files    | agents.md, coding-style.md, git-workflow.md, models.md, performance.md, python.md, security.md, testing.md                                                             |
| `agents/`        | 11 files   | frontend-agent, backend-agent, ai-agent, devops-agent, security-agent, architect-agent, ux-agent, mastermind-agent, bug-finder-agent, pr-resolver-agent, product-agent |
| `skills/`        | 50 folders | Each with SKILL.md containing YAML frontmatter + patterns/workflows                                                                                                    |
| `scripts/hooks/` | 3 files    | session-start.js, session-end.js, evaluate-session.js                                                                                                                  |
| `scripts/lib/`   | 2 files    | utils.js, package-manager.js                                                                                                                                           |

## Category Detection

I analyze your instruction keywords to determine the category:

| Category     | Keywords                                                                     | Target Files                                             | Commands Affected                          |
| ------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| TypeScript   | type, interface, enum, any, unknown, casting, generic                        | CLAUDE.md, typescript-types skill, rules/coding-style.md | quality-gate skill (Code Standards)        |
| Frontend     | react, component, hook, useState, jsx, tsx, prop                             | CLAUDE.md, frontend-agent agent, rules/coding-style.md   | quality-gate skill (Code Standards)        |
| Backend      | express, nestjs, controller, service, repository, api, http                  | CLAUDE.md, backend-agent agent, rules/coding-style.md    | quality-gate skill (Code Standards)        |
| Security     | auth, jwt, password, injection, xss, csrf, owasp                             | CLAUDE.md, security-agent agent, rules/security.md       | quality-gate skill (Security Review)       |
| DevOps       | docker, kubernetes, terraform, ci, cd, pipeline                              | CLAUDE.md, devops-agent agent, rules/performance.md      | quality-gate skill (Performance)           |
| Architect    | architecture, design, pattern, ADR, scalability, system, integration, module | CLAUDE.md, architect-agent agent, architect skill        | quality-gate skill (Code Standards)        |
| AI/ML        | openai, llm, prompt, gpt, embedding                                          | CLAUDE.md, ai-agent agent                                | quality-gate skill (Code Standards)        |
| Testing      | test, jest, vitest, mock, spec, coverage                                     | CLAUDE.md, testing-patterns skill, rules/testing.md      | quality-gate skill (Test Coverage)         |
| Styling      | css, scss, style, rtl, color                                                 | CLAUDE.md, styling-rtl skill                             | quality-gate skill (Code Standards)        |
| Git/Workflow | git, commit, branch, merge, pr, mr, workflow                                 | CLAUDE.md, rules/git-workflow.md                         | commit-all skill, pr-description skill     |
| Performance  | performance, optimization, context, cost, compaction                         | CLAUDE.md, rules/performance.md                          | quality-gate skill (Performance)           |
| Models       | model, opus, sonnet, haiku, tier, model selection                            | CLAUDE.md, rules/models.md                               | agents/_.md, skills/_/SKILL.md frontmatter |
| Agents       | agent, consult, orchestration, delegate                                      | CLAUDE.md, rules/agents.md, mastermind-agent agent       | consult skill, plan-task skill             |
| Scripts      | hook, lifecycle, session, automation, startup                                | scripts/hooks/_.js, scripts/lib/_.js                     | N/A (runtime behavior)                     |
| General      | (none of above)                                                              | CLAUDE.md, all relevant agents                           | Review all skills                          |

## Phase 0: Base Foundation Check (MANDATORY, RUNS FIRST)

Skills inherit from a base. Before creating or editing ANY skill, check whether a base already owns the concept - and never duplicate what a base defines.

### Base Registry

A base is a skill that owns shared content for a family. Consumers declare `Extends: <base>`.

| Base          | Owns                                                                                                                                                                     | Consumers                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `review-base` | Finding prefixes, severity, comment style, agent routing, the fixed point, the two axes, the Fowler smell baseline, review machinery, discussion handling, learning loop | review, review-test, fix-review |
| `plan-base`   | Domain discovery, mastermind invocation, specialist roster, plan output format, seams under test, the planning grill                                                     | plan-task, plan-to-docs         |

### Primitive Registry

A primitive is a skill that owns ONE concept outright, referenced by name from anywhere. Not a base: consumers do not extend it, they cite it.

| Primitive         | Owns                                                                                                                        | Cited by                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `grilling`        | The decision-tree interview: one question at a time, recommended answer, explore instead of asking, the stop option         | plan-base, plan-test, domain-modeling                                 |
| `domain-modeling` | `CONTEXT.md` glossary format, ADR format and the 3-of-3 gate, single vs multi-context layout, lazy creation, consumer rules | plan-base, tdd, review-base, find-bug                                 |
| `codebase-design` | Deep-module vocabulary: module, interface, depth, seam, adapter, leverage, locality. The deletion test. Design-it-twice     | tdd, testing-patterns, refactoring-patterns, architect-agent          |
| `tdd`             | Red-green-refactor loop, what a good test is, seams, test anti-patterns                                                     | rules/testing.md, fix-review, implement-phase, plan-test, review-test |

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

1. Shared Machinery Step A - mode detection
2. Agent Routing Table - categorize and spawn
3. Shared Machinery Step C - post findings

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

## Phase 0.5: Skill Authoring Principles (MANDATORY when writing or editing a skill)

A skill's job is to wrangle determinism out of a stochastic system. The goal is not the same OUTPUT every run, it is the same PROCESS. PREDICTABILITY is the root virtue. Judge every choice against it, never against how clever, complete, or exhaustive the skill reads.

### Cognitive Load vs Context Load

Every skill spends one or the other. This, not habit, is how you choose the visibility switches:

| Setting                          | Cost                                                                   | Choose when                                                                              |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Model-invocable (default)        | CONTEXT load: its description sits in the window every turn            | The model should reach for it on its own, and the description earns its tokens           |
| `disable-model-invocation: true` | COGNITIVE load: the user is now the index that must remember it exists | The skill has real side effects (writes files, commits, posts) or is a deliberate ritual |
| `user-invocable: false`          | Zero menu clutter, still model-reachable                               | Pattern libraries, bases, and primitives that should load silently when relevant         |

When user-invocable skills multiply past what the user can hold in their head, the cure is a ROUTER skill that names the others and when to reach for each. Not more skills.

### Leading Words

Prefer a compact concept already in the model's pretraining over a paragraph restating it: TIGHT loop, RED-capable, SEAM, TRACER BULLET, DEEP module, BLAST RADIUS, FRONTIER. One such word anchors both execution and invocation in the fewest tokens.

When editing, hunt restatements that a single leading word can retire.

### Information Hierarchy and Progressive Disclosure

Three rungs, in order:

1. An in-skill STEP: the model must do this every run
2. An in-skill REFERENCE section: the model needs it while running, but not as a step
3. An EXTERNAL file behind a context pointer (`See [X.md](./X.md)`): needed only sometimes

Move content DOWN the ladder so the top stays legible. A `SKILL.md` past roughly 250 lines is a signal that a rung-3 file is waiting to be extracted.

Rung-3 files are not a convention we invented - they're the official Claude Code "supporting files" pattern documented at [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills#add-supporting-files). Before creating or restructuring a skill, check that page (or fetch it) for the current supported layout and frontmatter fields rather than assuming this file's summary is exhaustive - the upstream docs are the source of truth and can add fields or patterns after this file was last updated. See the Supporting Files subsection under File Format Reference for the layout to apply.

### Pruning Tests

Apply these sentence by sentence when editing:

- SINGLE SOURCE OF TRUTH: is this already owned by a base, a primitive, a rule file, or `CLAUDE.md`? Then reference it, do not restate it
- RELEVANCE: does this sentence change what the model does? If not, cut it
- NO-OP TEST: would the model behave identically with this sentence removed? Then it is a no-op. Cut it

### Failure Modes

Diagnose a misbehaving skill against these:

| Failure mode         | Symptom                                                          | Fix                                                           |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Premature completion | The skill stops before the work is actually done                 | Add an explicit completion criterion with observable evidence |
| Duplication          | Two files give contradictory guidance on the same concept        | Extract to a base or primitive, reference from both           |
| Sediment             | Layers of edits nobody removed, each half-contradicting the last | Rewrite the section whole, do not patch it again              |
| Sprawl               | The skill grew to cover adjacent concerns it does not own        | Split, or hand the adjacent concern to the skill that owns it |
| No-op                | Sentences that read well and change nothing                      | Cut them                                                      |

### Description Field

The `description:` is the ONLY thing a model sees before deciding to invoke. Write it as trigger conditions, not as a summary of the body. Name the situations, the verbs, and the vocabulary a user would actually type.

## Phase 1: Parse & Categorize

First, I'll analyze your instruction:

```
Instruction: $ARGUMENTS
```

**Analysis Steps:**

1. Extract key concepts and keywords from the instruction
2. Match against category keyword lists
3. If ambiguous, ask you to clarify the category
4. If `--category=<name>` flag provided, use that category

**Category Override:**
You can force a category with: `/improve-claude "your rule" --category=backend`

## Phase 2: Resolve Target Files

Based on detected category, I'll identify all files that need updating:

**Target Resolution:**

```
Category: [detected]
Target Files:
- ~/.claude/CLAUDE.md (Section: [determined])
- ~/.claude/rules/[relevant-rule].md (if applicable)
- ~/.claude/agents/[relevant-agent].md (if applicable)
- ~/.claude/skills/[relevant-skill]/SKILL.md (if applicable)
- ~/.claude/scripts/[hooks|lib]/[file].js (if applicable - for automation rules)
```

## Phase 3: Search for Existing Rules

I'll search each target file for similar existing rules:

**Search Strategy:**

1. Extract key concepts from your instruction
2. Search each file for rules with >50% concept overlap
3. If found: **UPDATE** the existing rule (single source of truth)
4. If not found: **ADD** new rule in appropriate section

**CRITICAL: Single Source of Truth**

- Never create duplicate rules
- Always update existing rules to improve/expand them
- Merge new instruction with existing guidance

## Phase 3.5: Directory-Specific Routing

Based on category detection, I route rules to specific directories:

### Rules Directory Routing (`~/.claude/rules/`)

| Rule Topic                                       | Target File       | Section to Update            |
| ------------------------------------------------ | ----------------- | ---------------------------- |
| Immutability, naming, exports, file organization | `coding-style.md` | Relevant subsection          |
| Test coverage, TDD, mocking, specs               | `testing.md`      | Relevant subsection          |
| Auth, secrets, OWASP, validation                 | `security.md`     | Security checklist           |
| Git commits, branches, PRs, workflow             | `git-workflow.md` | Workflow section             |
| Context window, compaction                       | `performance.md`  | Optimization section         |
| Model tiers, per-agent/skill model assignment    | `models.md`       | Tier or assignment table     |
| Agent usage, orchestration, agents               | `agents.md`       | Agent table or usage section |

### Scripts Directory Routing (`~/.claude/scripts/`)

| Script Type        | Location                                         | When to Reference             |
| ------------------ | ------------------------------------------------ | ----------------------------- |
| Session lifecycle  | `hooks/session-start.js`, `hooks/session-end.js` | Session automation rules      |
| Session evaluation | `hooks/evaluate-session.js`                      | Learning extraction rules     |
| Shared utilities   | `lib/utils.js`, `lib/package-manager.js`         | When adding utility functions |

**Note:** Scripts are JavaScript files. When a rule affects script behavior, document the expected behavior change rather than the code modification.

### Agent Directory Routing (`~/.claude/agents/`)

| Agent File             | Domain                                | Invocation                     |
| ---------------------- | ------------------------------------- | ------------------------------ |
| `frontend-agent.md`    | React, TypeScript, components         | `/consult frontend`            |
| `backend-agent.md`     | Node.js, NestJS, APIs                 | `/consult backend`             |
| `ai-agent.md`          | OpenAI, prompts, RAG                  | `/consult ai`                  |
| `devops-agent.md`      | Docker, K8s, Terraform                | `/consult devops`              |
| `security-agent.md`    | OWASP, auth, vulnerabilities          | `/consult security`            |
| `architect-agent.md`   | System design, ADRs                   | `/consult architect`           |
| `ux-agent.md`          | Accessibility, WCAG, ARIA             | `/consult ux`                  |
| `mastermind-agent.md`  | Orchestrator, multi-domain            | `/plan-task`, `/build-feature` |
| `bug-finder-agent.md`  | Root cause analysis                   | `/find-bug`                    |
| `pr-resolver-agent.md` | PR discussion analysis and resolution | `/resolve-pr`                  |

## Phase 4: Determine Section Placement

**CLAUDE.md Section Mapping:**
| Rule Pattern | Target Section |
|--------------|----------------|
| "never use X" / "always use Y" | ## Code Style |
| "extract X to Y" / "when you see X" | ## Refactoring Patterns |
| Backend patterns | ## Backend Refactoring Patterns |
| Security rules | ## Security Standards |
| DevOps rules | ## DevOps Standards |
| AI/ML rules | ## AI/ML Integration Standards |
| Testing rules | ## Testing Considerations |

**Rules Files Section Mapping:**

| Rules File        | Sections Available                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `coding-style.md` | Immutability, File Organization, Error Handling, Input Validation, Code Quality Checklist               |
| `testing.md`      | Minimum Test Coverage, Test-Driven Development, Behavior-Driven Tests, Post-Implementation Verification |
| `security.md`     | Mandatory Security Checks, Secret Management, Security Response Protocol, OWASP Top 10                  |
| `git-workflow.md` | Commit Message Format, Pull Request Workflow, Feature Implementation Workflow, GitHub Integration       |
| `performance.md`  | Context Window Management, Strategic Compaction, Build Troubleshooting                                  |
| `models.md`       | Never Hardcode a Model Version, Tier Definitions, Agent Assignments, Skill Assignments                  |
| `agents.md`       | Available Specialist Agents, Immediate Agent Usage, Parallel Task Execution, Multi-Perspective Analysis |

**Agent Files:**

- Find most semantically relevant section
- Default to guidelines/best practices section
- Agents use YAML frontmatter with: name, description, tools, model, skills

**Skill Files:**

- Append to relevant pattern section
- Or add new subsection if needed
- Skills use YAML frontmatter with: name, description, globs

**Script Files (Reference Only):**

- Document expected behavior changes
- Do not modify JavaScript code directly through this command
- Reference script file and describe the behavior to implement

## Phase 5: Auto-Generate Code Examples

I'll create Bad/Good code examples from your instruction:

**Example Generation:**

```typescript
// Bad - [what to avoid]
[generated bad example]

// Good - [what to do]
[generated good example]
```

**Generation Rules:**

- Infer the "bad" pattern from "never use X" or "avoid X"
- Infer the "good" pattern from "always use Y" or "prefer Y"
- Use realistic, contextual examples
- Match the complexity level of existing examples in the file

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
| `scripts/lib/*.js`   | `scripts/lib/utils.js`                                                  |

Use the exemplar to confirm field order, heading levels, list character, and code fence language tags before writing.

### Step 2: Apply Per-Type Formatting Rules

#### Skills (`skills/*/SKILL.md`)

Frontmatter field order (only include fields that apply):

```yaml
---
name: kebab-case-matching-directory
description: Single sentence starting with what it does.
globs: "**/*.ext,**/*.ext2"
user-invocable: false
argument-hint: "[hint text]"
---
```

Rules:

- `name` is kebab-case and MUST match its directory name exactly
- `description` is one sentence, starts with the action the skill performs
- `globs` is a single quoted string with comma-separated patterns, no spaces after commas
- `user-invocable: false` only when the skill is auto-loaded; omit entirely for user-invocable skills
- `argument-hint` only when the skill accepts a `$ARGUMENTS` variable
- h1 heading immediately follows frontmatter
- Sections: h2 for major sections, h3 for subsections - NEVER h4 or deeper
- Code examples use the `// Bad - [reason]` / `// Good - [description]` comment pattern inside fences
- All code fences MUST have a language identifier: `typescript`, `bash`, `yaml`, `markdown`, etc.
- Lists use `-` exclusively - NEVER `*` or bullet characters
- No bold (`**text**`) in prose - use CAPS for emphasis or restructure as a heading
- End with a quick reference table or checklist section

#### Agents (`agents/*.md`)

Frontmatter field order:

```yaml
---
name: kebab-case
description: When/why to use this agent, phrased as trigger conditions (one or two sentences).
tools: Read, Grep, Glob, Bash, Edit, Write
disallowedTools: Write, Edit
model: opus
effort: high
skills: skill-name-1, skill-name-2
memory: project
maxTurns: 25
color: purple
---
```

Rules:

- `tools` values are capitalized and comma-space separated: `Read, Grep, Glob, Bash, Edit, Write`
- `disallowedTools` (optional): same format as `tools`. Applied before `tools` resolves, so it strips even what `memory:` would otherwise auto-grant - use it to keep an advisory-only agent (architect, product, security) unable to write source, at the cost of it also being unable to write memory notes. See `rules/agents.md` Memory Protocol
- `model` is one of: `opus`, `sonnet`, `haiku` - NEVER a versioned id like `claude-opus-4-6`. Assignments live in `rules/models.md`
- `effort` (optional): `low`, `medium`, `high`, or `max`. Only agents doing deep, ambiguous, multi-step reasoning declare `high` - see `rules/models.md` Agent Assignments
- `skills` is comma-space separated, uses the skill's `name` value (kebab-case)
- `memory` is `project` for every agent - it makes the agent's learnings shareable via version control. Declaring `memory` without a body section instructing the agent to read/write it is a no-op; every agent body must carry the Memory Protocol section
- `maxTurns` is an integer, no quotes
- `color` (optional): one of `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`. Assign one per agent so parallel spawns (e.g. `/review`) are visually distinguishable in the task list
- Content opens with a role statement paragraph (one to two sentences, plain text, no bold)
- Sections follow: domain standards, review checklist or analysis framework, output format, Memory Protocol (see `rules/agents.md`), coordination with other agents
- Use `- [ ]` for checklist items
- Lists use `-`, NEVER `*` or bullet characters
- Do NOT restate content that already lives in a preloaded skill (per `skills:`) - reference the skill by name instead. A body that duplicates its own skills has failed SSOT and should be trimmed
- Keep the file under ~250 lines. Past that, the content belongs in a skill, not the agent body

#### Rules (`rules/*.md`)

Frontmatter is optional; use only when path-scoping is needed:

```yaml
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
```

Rules:

- h1 for the file title, h2 for sections - NEVER h3 in rules files
- `ALWAYS` and `NEVER` in CAPS for emphasis - not bold
- Checklist items use GitHub task list syntax: `- [ ] Item`
- Code blocks MUST have a language identifier
- Lists use `-`

### Step 3: Pre-Write Validation Checklist

Run through this checklist before writing each file. Do NOT write the file if any item fails.

```
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
- [ ] For skills: reference material, examples, or scripts that belong on rung 2/3 are split into supporting files (see Supporting Files subsection), not inlined into SKILL.md
- [ ] For skills: every supporting file is linked from SKILL.md by relative path
```

If any item fails, correct the draft before proceeding to Phase 6.

## Phase 6: Apply Changes

Before editing, present the proposed changes to the user — which files will be updated, which sections, and a summary of what will change. Wait for explicit user confirmation before proceeding. Only after user confirms, create the bypass lock file:

```bash
echo $(date +%s) > ~/.claude/.config-edit-unlocked
```

Then update each target file directly:

**For New Rules:**

````markdown
### [Rule Title]

[Description of the rule]

```typescript
// Bad
[bad example]

// Good
[good example]
```
````

````

**For Existing Rules (Update):**
- Merge new guidance with existing rule
- Expand examples if needed
- Preserve existing formatting

## Phase 6.5: Review and Update Skills

After updating the core configuration files, I'll review skill files for related content:

**Skill Review Strategy:**
1. Search all `skills/*/SKILL.md` files for keywords from the instruction
2. Check if any skill has embedded rules, checklists, or examples that should include the new standard
3. Update affected skills to maintain consistency

**Key Skills to Check:**

| Skill | What to Update |
|-------|----------------|
| `quality-gate` | Add new check to relevant section (Code Standards, Security, etc.) |
| `refactor` | Add new refactoring pattern if applicable |
| `review` | Add new review criterion if applicable |
| `commit-all` | Add new commit convention if applicable |

**Update Logic:**
- **Code Style rule** -> Add to quality-gate skill "Code Standards" checklist
- **Security rule** -> Add to quality-gate skill "Security Review" checklist
- **Refactoring pattern** -> Consider adding to refactor skill patterns
- **Testing rule** -> Add to quality-gate skill "Test Coverage" checklist

**Example Update:**
If instruction is "never use console.log in production":
- Add `- [ ] No console.log in production code` to quality-gate skill's Code Standards section

## Phase 6.9: README Documentation Sync

After applying config changes, verify that `~/.claude/README.md` reflects the current state. The README is the project's public documentation and MUST stay in sync with structural changes.

### When to Update README

Check README whenever changes affect:
- New or removed skills (Pattern Libraries section)
- New or removed agents (Specialist Agents table)
- Changes to agent auto-loaded skills (Auto-Loaded Skills column)
- New or removed hooks (Hooks & Notifications table)
- New or removed rules files (Rules section)
- New user-invocable skills (Skills Reference table)
- Changes to folder structure (Folder Structure section)

### README Sections to Check

| Change Type | README Section to Update |
|-------------|--------------------------|
| New auto-loaded skill | "Pattern Libraries" - add to correct category, update count |
| New user-invocable skill | "User-Invocable Skills" table |
| New agent | "12 Specialist Agents" table (update count in heading too) |
| Agent skill list changed | "12 Specialist Agents" table - Auto-Loaded Skills column |
| New hook | "Hooks & Notifications" table |
| New rule file | "Rules" section |

### Sync Process

1. Read `~/.claude/README.md`
2. Compare against the changes just made in Phase 6/6.5
3. Update any stale sections
4. Verify counts match (run the count commands in the Verification section, do not guess)

CRITICAL: README.md is NOT a protected config file - it can be edited directly without the unlock file. But it MUST be kept accurate.

## Phase 7: Integrate Learnings into Existing Skills

When processing rules from code reviews or session learning, I **integrate patterns into existing skill files** rather than creating separate files. This maintains single source of truth.

**This happens automatically when:**
- Rule comes from a review (`/review`)
- Pattern is marked as [Blocker], [Nice to have], or [Suggestion]
- `/extract-learning` command is used

**Integration Process:**

1. **Identify target skill:** Match the learning to the appropriate domain skill
   - RTL/CSS patterns -> `skills/styling-rtl/SKILL.md`
   - React patterns -> `skills/react-component/SKILL.md`
   - TypeScript patterns -> `skills/typescript-types/SKILL.md`
   - Backend patterns -> `skills/js-backend-patterns/SKILL.md`

2. **Search for duplicates:** Check if similar pattern already exists in target skill

3. **Add or update:** Integrate the new pattern into the appropriate section

**Format for new patterns:**

```markdown
## [Pattern Name]

[Problem description with specific triggers]

```[language]
// Bad - [what causes the problem]
[problematic code]

// Good - [the fix]
[correct code]
````

**When to apply:** [Trigger conditions]

````

**Important:** Do NOT create separate files in a `learned/` folder. All learnings belong in existing domain skills.

## Phase 8: Report Results

First, clean up the lock file:
```bash
rm -f ~/.claude/.config-edit-unlocked
````

After applying changes, I'll show:

```
## /improve-claude Report

**Instruction:** [your instruction]
**Category:** [detected category]

### Files Updated

| File | Action | Section |
|------|--------|---------|
| CLAUDE.md | Updated | Code Style |
| rules/coding-style.md | Updated | Immutability |
| rules/testing.md | Added | New subsection |
| frontend-agent.md | Added | Guidelines |
| react-component/SKILL.md | Added | Patterns |
| quality-gate.md | Added | Code Standards Checklist |

### Scripts Referenced (if applicable)

| Script | Behavior Change |
|--------|-----------------|
| hooks/session-start.js | [Description of expected change] |

### Skills Saved

| Skill File | Type | Category |
|------------|------|----------|
| typescript-avoid-any.md | rule | typescript-types |

### Changes Applied

**CLAUDE.md:**
- Updated existing rule about [topic]
- Added code example for [scenario]

**rules/coding-style.md:**
- Added new subsection: [title]

**frontend-agent.md:**
- Added new section: [title]

**quality-gate.md:**
- Added new check: "[check description]"

**skills/[domain]/SKILL.md:**
- Updated: [skill-name] with new pattern

### Verification
- [x] Format conformance validated (Phase 5.5 checklist passed)
- [x] Rule synced across all target files
- [x] No duplicates created
- [x] Code examples generated
- [x] Commands reviewed for related content
- [x] Quality gate checklist updated (if applicable)
- [x] Rules files updated (if applicable)
- [x] Scripts referenced (if applicable)
- [x] Learning integrated into existing skill (if applicable)
- [x] README.md updated if structural changes were made (Phase 6.9)
```

## File Format Reference

This section is the authoritative source for per-file-type formatting. Phase 5.5 applies these rules during validation. Update this section whenever a new convention is discovered.

### Skills (`skills/*/SKILL.md`)

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

#### Supporting Files

Per the official pattern ([code.claude.com/docs/en/skills#add-supporting-files](https://code.claude.com/docs/en/skills#add-supporting-files)), a skill directory can hold more than `SKILL.md`. Use this whenever content belongs on rung 2 or 3 of Information Hierarchy and Progressive Disclosure (Phase 0.5) instead of stuffing it into the main file:

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

### Agents (`agents/*.md`)

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
- `disallowedTools`: comma-space separated, same format as `tools`. Optional - use to keep an advisory-only agent unable to write source even though `memory:` would otherwise grant Write/Edit
- `model`: alias only (`opus`, `sonnet`, `haiku`) - never a versioned id. Pick the tier from `rules/models.md` and record the assignment there
- `effort`: optional, `low`/`medium`/`high`/`max`. Record any `high` assignment in `rules/models.md`
- `skills`: comma-space separated kebab-case skill names
- `memory`: `project` for every agent (see `rules/agents.md` Memory Protocol)
- `maxTurns`: integer, typical range 10-30
- `color`: optional, one of red/blue/green/yellow/purple/orange/pink/cyan
- Body must NOT restate content already in a preloaded skill - reference the skill instead. Keep the file under ~250 lines

### Rules (`rules/*.md`)

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
- h1 title, h2 sections - no h3 in rules files

### Hook Scripts (`scripts/hooks/*.js`)

```javascript
#!/usr/bin/env node
/**
 * Hook Description
 */

const { utilFunction } = require("../lib/utils");

async function main() {
  // Hook logic
  process.exit(0);
}

main().catch((err) => {
  console.error("[HookName] Error:", err.message);
  process.exit(0); // Don't block on errors
});
```

### Library Scripts (`scripts/lib/*.js`)

```javascript
/**
 * Utility function description
 */
function utilityFunction(param) {
  // Implementation
}

module.exports = { utilityFunction };
```

### Cross-File Rules (apply to ALL file types)

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

## Usage Examples

```bash
# TypeScript rule
/improve-claude "never use 'any' type - use proper typing or type guards"

# HTTP status codes (backend)
/improve-claude "always use http-status-codes package instead of raw numbers like res.status(500)"

# React rule
/improve-claude "never pass setState directly to child components - use callback handlers with semantic names"

# Force specific category
/improve-claude "validate all inputs" --category=backend

# Security rule
/improve-claude "always sanitize user input before database queries to prevent SQL injection"
```

## Safety Guarantees

I will NEVER:

- Create duplicate rules across files
- Remove existing rules without merging
- Break file formatting
- Modify files outside ~/.claude configuration
- Add AI attribution or signatures

I will ALWAYS:

- Read an exemplar file of the same type before creating any new config file (Phase 5.5)
- Validate format conformance against the Pre-Write Checklist before writing (Phase 5.5)
- Create `~/.claude/.config-edit-unlocked` at the start of Phase 6, before editing config files
- Remove it after completing changes (Phase 8)

## Important Notes

1. **CLAUDE.md is source of truth** - It always gets updated for code standards
2. **Rules files get specific guidelines** - Categorized enforcement rules (coding-style, testing, security, etc.)
3. **Agents get specialized context** - Additional guidance specific to their domain
4. **Skills get pattern examples** - Focus on code patterns and examples
5. **Scripts are reference-only** - Document behavior changes, don't modify JS directly
6. **Skills get workflow rules** - Rules that affect skill behavior

### Directory Quick Reference

| Need to add...          | Update...                                                  |
| ----------------------- | ---------------------------------------------------------- |
| Coding style rule       | `rules/coding-style.md` + `CLAUDE.md`                      |
| Testing requirement     | `rules/testing.md` + `CLAUDE.md`                           |
| Security checklist item | `rules/security.md` + `CLAUDE.md`                          |
| Git workflow step       | `rules/git-workflow.md` + `CLAUDE.md`                      |
| Performance guideline   | `rules/performance.md` + `CLAUDE.md`                       |
| Agent usage pattern     | `rules/agents.md` + relevant agent file                    |
| React pattern           | `frontend-agent.md` + `react-component` skill              |
| Backend pattern         | `backend-agent.md` + `js-backend-patterns` skill           |
| Quality check           | `quality-gate` skill checklist                             |
| Session automation      | Reference `scripts/hooks/` + document behavior             |
| New skill/agent/hook    | `README.md` (Pattern Libraries, Agents table, Hooks table) |

**Ready to improve your Claude configuration!**
