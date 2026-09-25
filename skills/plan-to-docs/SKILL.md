---
name: plan-to-docs
description: Plan a task with the mastermind-agent, grill interview, then output numbered vertical-slice phase documents to ai_plans/{task-slug}/
argument-hint: "[task-description]"
allowed-tools: Task, Read, Grep, Glob, Bash, Write, Edit, AskUserQuestion
model: opus
disable-model-invocation: true
---

# Document-Driven Planning

Plan a task, then generate a folder of numbered, independently verifiable phase documents.

Use this when the work is too big to hold in one session. For a task that fits in one session, use `/plan-task`.

Extends: `plan-base`

## Input

Task description via `$ARGUMENTS`. If empty, prompt user.

If `$ARGUMENTS` is a cleared `wayfinder` map (an issue URL or an `ai_plans/<effort>/map.md` path):

- The map's Destination is the task, and its Decisions so far are already locked. Zoom into a ticket only when a phase needs its detail
- The grill covers only what the map left open. Do not reopen a closed ticket's decision unless the code contradicts it
- For a local map, write the phase docs into the map's own folder. Do not treat its existence as a name clash

## Output

```
ai_plans/{task-slug}/
├── README.md
├── 01-{phase-name}.md
├── 02-{phase-name}.md
└── ...
```

## Workflow

### Phase 1: Initialize

1. Extract task description from `$ARGUMENTS`
2. If empty, use AskUserQuestion to get it
3. Derive `task-slug` from description (kebab-case, max 40 chars)
4. Set output path: `ai_plans/{task-slug}/`
5. Check if folder exists: `ls ai_plans/{task-slug} 2>/dev/null`
6. If exists, ask user: overwrite or pick new name

### Phase 2: Domain Discovery

Run Domain Discovery from `plan-base`. Additionally, `ls ai_plans/` to see whether a related plan folder already exists.

### Phase 3: Mastermind Agent Planning

Run Mastermind Invocation from `plan-base`, replacing step 3 (Task Breakdown) with vertical slice decomposition:

```
  3. Vertical Slice Decomposition
     Break the work into 3-8 phases. Each phase is a TRACER BULLET:
     - Cuts a narrow but COMPLETE path through every layer it touches
       (schema, API, UI, tests). Vertical, NOT a horizontal slice of one layer
     - Is demoable or verifiable on its own when complete
     - Is sized to fit in a single fresh context window
     - Declares its BLOCKING EDGES: the phases that must complete before it
       can start. A phase with no blockers can start immediately

     Any prefactoring goes FIRST. Make the change easy, then make the easy change.

     WIDE REFACTOR EXCEPTION. A wide refactor is one mechanical change
     (rename a column, retype a shared symbol) whose blast radius fans across
     the codebase, so a single edit breaks thousands of call sites at once and
     no vertical slice can land green. Do not force it into a tracer bullet.
     Sequence it as expand-contract:
       - EXPAND: add the new form beside the old so nothing breaks
       - MIGRATE: move call sites over in batches sized by blast radius
         (per package, per directory), each batch its own phase blocked by the
         expand, keeping CI green batch to batch because the old form still exists
       - CONTRACT: remove the old form once no caller remains, in a phase
         blocked by every migrate batch

  4. Dependency Graph
     For each phase, identify:
     - Blocked by: which phases gate it, or "None"
     - What it receives from its blockers
     - What it provides to the phases it unblocks
     - Files to add
     - Files to edit

  5. Risk Assessment
     - What could go wrong?
     - What decisions need to be locked?
```

### Phase 4: Grill Interview

Run Grill Interview from `plan-base`, including its mandatory seams branch. Additional branches specific to a multi-session build:

- Slice granularity: too coarse or too fine? Should any phase be merged or split?
- Blocking edges: does each phase depend only on phases that genuinely gate it?
- Rollback strategy if a phase fails midway
- Migration and deployment sequencing across phases

### Phase 5: Lock Decisions

Synthesize answers into a decisions table:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [topic] | [what was decided] | [why] |

### Phase 6: Generate Phase Documents

For each phase, create a numbered markdown file using the template below.

## Phase Document Template

```markdown
# Phase N: [Title]

## Goal

[1-2 sentences describing what this phase achieves]

## Why Now

[Why this phase comes at this point. What prerequisite is now available.]

## Dependencies

- Blocked by: [phase numbers that gate this one, or "None - can start immediately"]
- Receives: [what the blocking phases provide]
- Provides: [what this phase produces for the phases it unblocks]

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| ... | ... | ... |

Tests in this phase are written ONLY at these seams. They were agreed during the grill.

## Scope

In:
- [Included in this phase]

Out:
- [Deferred to later phases]

## Files to Add

- path/to/new-file.ts - description
- path/to/another.ts - description

## Files to Edit

- path/to/existing.ts - what changes and why

## Implementation Steps

1. [Action verb] [specific step]
   - Technical detail
   - Code pattern to follow

2. [Action verb] [specific step]
   - Technical detail

## Tests

Each entry names the seam it is written at.

- [ ] [seam]: [specific behaviour under test]
- [ ] [seam]: [specific behaviour under test]

## Verification

```bash
npm test -- [relevant-test-pattern]
npx tsc --noEmit
npm run lint
```

## Done When

- [ ] [Observable outcome 1]
- [ ] [Observable outcome 2]
- [ ] All verification commands pass

## Notes for Next Phase

[Bridge to Phase N+1. What patterns are established. What the next phase should know.]
```

### Phase 7: Generate README.md

```markdown
# [Task Name]

[1-2 paragraph description]

## Decisions Locked

| Decision | Choice |
|----------|--------|
| [topic] | [choice made] |

## Phase Index

| # | File | Blocked by | Delivers | Done When |
|---|------|------------|----------|-----------|
| 1 | [01-phase.md](01-phase.md) | None | [end-to-end behaviour] | [key verification] |
| 2 | [02-phase.md](02-phase.md) | 1 | [end-to-end behaviour] | [key verification] |

## How to Use

1. Work the FRONTIER: any phase whose blockers are all done. For a linear chain that is top to bottom
2. Run `/implement-phase ai_plans/{task-slug}/0N-phase.md`
3. Complete verification, tick Done When, clear context, move to the next frontier phase

Do NOT start a phase whose blockers are unfinished.

## Out of Scope

- [Item 1 deferred]
- [Item 2 deferred]

## Generated

Created by `/plan-to-docs` on [YYYY-MM-DD].
```

### Phase 8: Write Files

1. Create `ai_plans/` if needed: `mkdir -p ai_plans/{task-slug}`
2. Write `README.md`
3. Write each numbered phase: `01-{phase-slug}.md`, `02-{phase-slug}.md`, etc.
4. Report paths created

### Phase 9: Report

```markdown
## Plan Generated

Task: [name]
Location: ai_plans/{task-slug}/
Generated: [date]

### Files Created

| File | Description |
|------|-------------|
| README.md | Overview and decisions |
| 01-{phase}.md | [goal summary] |
| 02-{phase}.md | [goal summary] |

### Summary

| Metric | Value |
|--------|-------|
| Phases | [N] |
| Questions Answered | [N] |
| Decisions Locked | [N] |

### Next Steps

1. Review ai_plans/{task-slug}/README.md
2. Run `/implement-phase ai_plans/{task-slug}/01-{first-phase}.md`
```

## Design Principles

- Every phase is a vertical slice: narrow but complete through every layer it touches, demoable on its own
- Blocking edges, not just sequence. A phase declares what gates it, so the frontier is always visible
- One phase fits one fresh context window. Clear context between phases
- Tests only at seams agreed during the grill
- Verification commands and a Done When checklist in every phase
- Prefactor first: make the change easy, then make the easy change
