---
name: plan-to-docs
description: Plan a task with mastermind agent, grill interview, then output numbered phase documents to ai_plans/{task-slug}/ folder
argument-hint: "[task-description]"
allowed-tools: Task, Read, Grep, Glob, Bash, Write, AskUserQuestion
model: opus
---

# Document-Driven Planning

Plan a task using mastermind agent with grill interview, then generate a folder of numbered, testable phase documents.

## Input

Task description via `$ARGUMENTS`. If empty, prompt user.

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

Before planning, scan the project:

```bash
# Look for existing documentation
ls docs/*.md 2>/dev/null
ls ai_plans/ 2>/dev/null

# Check for architecture docs
cat ARCHITECTURE.md 2>/dev/null | head -100
cat CLAUDE.md 2>/dev/null | head -50
```

Read up to 5 relevant files to understand existing patterns.

### Phase 3: Mastermind Planning

Spawn mastermind via Task tool:

```
subagent_type: mastermind
prompt: |
  Plan the implementation of this task: [task-description]

  As the mastermind principal engineer, analyze deeply:

  1. Requirements Analysis
     - What problem does this solve?
     - Who is the user/consumer?
     - What are the acceptance criteria?
     - What are the constraints?

  2. Domain Analysis
     Identify which specialists are needed:
     - frontend-principal (React, TypeScript, UI/UX)
     - backend-principal (APIs, services, databases)
     - ai-principal (LLM features, prompts)
     - devops-principal (infrastructure, CI/CD)
     - security-principal (auth, vulnerabilities)
     - architect-principal (system design, patterns)

  3. Phase Decomposition
     Break into 3-8 phases where each phase:
     - Has a clear, testable goal
     - Can be verified independently
     - Builds on previous phases
     - Takes 1-4 hours to implement

  4. Dependency Graph
     For each phase, identify:
     - What it receives from the previous phase
     - What it provides to the next phase
     - Files to add
     - Files to edit

  5. Risk Assessment
     - What could go wrong?
     - What decisions need to be locked?

  Output a comprehensive plan with phase breakdown.
```

### Phase 4: Grill Interview

Interview the user using AskUserQuestion. Ask ONE question at a time.

For each question:

- Provide your recommended answer as context
- Include option: "I'm good with the plan - stop asking questions"
- If user selects stop, proceed immediately to Phase 5

Topics to grill:

- Scope boundaries (what is explicitly out?)
- Error handling strategy
- Testing approach for each phase
- Rollback strategy if phase fails
- Performance requirements
- Security considerations
- Migration/deployment concerns

Cross-reference answers against existing docs. Challenge contradictions.

### Phase 5: Lock Decisions

Synthesize answers into a decisions table:

| Decision | Choice             | Rationale |
| -------- | ------------------ | --------- |
| [topic]  | [what was decided] | [why]     |

### Phase 6: Generate Phase Documents

For each phase, create a numbered markdown file using the template below.

## Phase Document Template

````markdown
# Phase N: [Title]

## Goal

[1-2 sentences describing what this phase achieves]

## Why Now

[Why this phase comes at this point. What prerequisite is now available.]

## Dependencies

- Receives from Phase N-1: [what the previous phase provides]
- Provides to Phase N+1: [what this phase produces for the next]

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

- [ ] Unit: [specific test case]
- [ ] Unit: [specific test case]
- [ ] Integration: [specific test case]

## Verification

```bash
npm test -- [relevant-test-pattern]
npx tsc --noEmit
npm run lint
```
````

## Done When

- [ ] [Observable outcome 1]
- [ ] [Observable outcome 2]
- [ ] All verification commands pass

## Notes for Next Phase

[Bridge to Phase N+1. What patterns are established. What the next phase should know.]

````

### Phase 7: Generate README.md

```markdown
# [Task Name]

[1-2 paragraph description]

## Decisions Locked

| Decision | Choice |
|----------|--------|
| [topic] | [choice made] |

## Phase Index

| # | File | Surface | Done When |
|---|------|---------|-----------|
| 1 | [01-phase.md](01-phase.md) | [what it produces] | [key verification] |
| 2 | [02-phase.md](02-phase.md) | [what it produces] | [key verification] |

## How to Use

1. Open the lowest-numbered phase MD that is not done
2. Run `/p-implement-phase ai_plans/{task-slug}/0N-phase.md`
3. Complete verification, tick Done When, move on

Do NOT skip ahead - each phase assumes the previous one is in place.

## Out of Scope

- [Item 1 deferred]
- [Item 2 deferred]

## Generated

Created by `/p-plan-to-docs` on [YYYY-MM-DD].
````

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

| File          | Description            |
| ------------- | ---------------------- |
| README.md     | Overview and decisions |
| 01-{phase}.md | [goal summary]         |
| 02-{phase}.md | [goal summary]         |

### Summary

| Metric             | Value |
| ------------------ | ----- |
| Phases             | [N]   |
| Questions Answered | [N]   |
| Decisions Locked   | [N]   |

### Next Steps

1. Review ai_plans/{task-slug}/README.md
2. Run `/p-implement-phase ai_plans/{task-slug}/01-{first-phase}.md`
```

## Design Principles

- Each phase is testable and encapsulated
- Forward/backward dependency references
- Verification commands in each phase
- Done When checklist for observable outcomes
- Grill interview forces precision before implementation
