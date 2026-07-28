---
name: plan-base
description: Shared planning framework with domain discovery, the mastermind invocation prompt, the seams-under-test agreement, and the plan output format. Use when building or extending a planning skill.
user-invocable: false
---

# Planning Framework

Shared patterns for every planning skill (`plan-task`, `plan-to-docs`).

## Extending This Base

A consumer skill MUST NOT restate anything defined here. It declares only what it overrides.

Inherited by default, never copy into a consumer:

| What | Section here |
| ---------------------------- | ---------------------- |
| Domain discovery | Domain Discovery |
| Mastermind invocation prompt | Mastermind Invocation |
| Specialist roster | Mastermind Invocation |
| Plan output format | Plan Output Format |
| Grill interview | Grill Interview |
| Seams under test | Grill Interview |

A consumer skill contains only:

1. Its frontmatter
2. An `Extends: plan-base` declaration
3. An Overrides section listing every deviation
4. Its own output stage, if it writes files rather than returning a plan

If a consumer needs to change a rule for everyone, change it here, not in the consumer.

## Domain Discovery

Runs FIRST, before the mastermind is spawned. Load `domain-modeling` and follow its Consumer Rules:

- Read `CONTEXT.md`, or `CONTEXT-MAP.md` plus the relevant per-context glossaries
- Read the ADRs in `docs/adr/` that touch the area being planned
- Scan `docs/` for architecture, workflow, and convention docs relevant to the task

Every term the plan uses for a domain concept comes from the glossary. If the plan contradicts an ADR, say so explicitly rather than silently overriding.

If none of these files exist, proceed silently. Do not stop to suggest creating them.

## Mastermind Invocation

Spawn the planning agent with the Task tool:

```
subagent_type: mastermind-agent
prompt: |
  Plan the implementation of this task: $ARGUMENTS

  Domain context (from CONTEXT.md and docs/adr/):
  [paste the glossary terms and ADRs found in Domain Discovery, or "none found"]

  As the mastermind agent, you should:

  1. Gather Requirements
     - What problem does this solve?
     - Who is the user?
     - What are the acceptance criteria?
     - What are the constraints?

  2. Domain Analysis
     Identify which specialists are needed:
     - frontend-agent (React, TypeScript, UI/UX)
     - backend-agent (APIs, services, databases)
     - ai-agent (LLM features, prompts)
     - devops-agent (infrastructure, CI/CD)
     - security-agent (auth, vulnerabilities)
     - architect-agent (system design, patterns)
     - product-agent (strategy, prioritization, metrics)
     - ux-agent (accessibility, interaction design)

  3. Task Breakdown
     Create atomic tasks with:
     - Clear description
     - Expected output
     - Dependencies
     - Assigned specialist

  4. Seams Under Test
     Propose the seams this work will be tested at. A seam is the public
     interface where behaviour is observed without reaching inside
     (see the `codebase-design` skill). Prefer EXISTING seams to new ones,
     prefer the HIGHEST seam that reaches the behaviour, and prefer FEWER
     seams. Say why each one is the right place.

  5. Dependency Graph
     Order tasks by phases:
     - Phase 1: No dependencies (can start immediately)
     - Phase 2: Depends on Phase 1
     - Phase 3: Depends on Phase 2

  6. Output Format
     Generate a structured plan in markdown format, using the project's
     glossary vocabulary throughout.
```

The mastermind-agent has access to:
- Tools: Read, Grep, Glob, Bash, Edit, Write, Task
- Specialists: all specialist agents via Task tool delegation (see `rules/models.md` for the roster)

## Plan Output Format

```markdown
## Task Plan: [Task Name]

### Overview
[Brief description of the task]

### User Story
As a [user type], I want to [action] so that [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Domain Involvement
| Domain | Involved | Complexity |
|--------|----------|------------|
| Frontend | Yes/No | Low/Medium/High |
| Backend | Yes/No | Low/Medium/High |
| AI | Yes/No | Low/Medium/High |
| DevOps | Yes/No | Low/Medium/High |
| Security | Yes/No | Low/Medium/High |

### Task Breakdown

#### Phase 1: Foundation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 1 | ... | ... | ... | None |

#### Phase 2: Core Implementation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 2 | ... | ... | ... | Task 1 |

### Seams Under Test
| Seam | New or Existing | What it covers |
|------|-----------------|----------------|
| ... | ... | ... |

### Decisions Locked
| Decision | Choice | Rationale |
|----------|--------|-----------|
| ... | ... | ... |

### Risks & Considerations
- [Risk and mitigation]

### Quality Gates
- [ ] Tests at every agreed seam
- [ ] Security review for sensitive features
- [ ] Performance testing if applicable
- [ ] Documentation updated
```

Return the mastermind-agent's full plan to the user.

## Grill Interview

After presenting the plan, run the `grilling` protocol against it. That skill owns the technique. This section owns only what a planning grill must cover.

### Mandatory branches

Every planning grill MUST resolve these before the plan is final:

1. Seams under test. Confirm the seams the mastermind proposed. No test is written at an unconfirmed seam, so the plan is not done until the user has agreed them. Push back on new seams when an existing one reaches the behaviour, and on low seams when a higher one would do
2. Scope boundaries. What is explicitly NOT in this work
3. Error handling and failure modes for the paths being built

### Doc updates land inline

When a branch of the interview sharpens a term or settles a hard-to-reverse decision, load `domain-modeling` and write it down THEN, not at the end:

- A resolved term updates `CONTEXT.md` immediately
- A decision that clears all three ADR gates (hard to reverse, surprising without context, the result of a real trade-off) becomes an ADR. Offer it; do not create one unasked
- A decision that fails the gates goes in the plan's Decisions Locked table and nowhere else

### Challenge against what exists

- Contradiction with an existing doc or ADR: surface it, do not silently override
- Contradiction between what the user said and what the code does: surface it, ask which is right
- Vague or overloaded terminology: propose the canonical term
