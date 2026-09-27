---
name: implement-phase
description: Implement a single phase from ai_plans folder using TDD workflow, with cascade updates to future phases when changes occur
argument-hint: "<path/to/phase.md>"
allowed-tools: Task, Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion
model: opus
---

# Phase Implementation with TDD

Implement a single phase from a plan folder using strict TDD workflow. Automatically update future phases when implementation reveals needed changes.

## Input

Phase path via `$ARGUMENTS` (e.g., `ai_plans/feature/03-api-layer.md`)

## Output

- Implemented code following TDD
- Tests written before implementation
- Updated future phase MDs if changes occurred
- Completion report

## Workflow

### Phase 1: Parse Phase Document

Read the phase MD and extract structured sections:

```bash
cat $ARGUMENTS
```

Look for these sections:

| Section | Headers to Match |
|---------|------------------|
| Goal | `## Goal` |
| Scope | `## Scope` |
| Dependencies | `## Dependencies` |
| Files to Add | `## Files to Add` |
| Files to Edit | `## Files to Edit` |
| Implementation Steps | `## Implementation Steps` |
| Tests | `## Tests` |
| Verification | `## Verification` |
| Done When | `## Done When` |

Extract the phase number from the filename (e.g., `03-api-layer.md` -> 3).

### Phase 2: TDD Execution

Spawn mastermind-agent via Task tool for each implementation step:

```
subagent_type: mastermind-agent
prompt: |
  Implement this phase using strict TDD workflow.

  ## Phase Context
  [Insert parsed phase content]

  ## Workflow for EACH implementation step:

  ### RED: Write Failing Test First
  1. Identify test case(s) for this step
  2. Delegate to appropriate specialist:
     - frontend-agent for React/UI tests
     - backend-agent for API/service tests
  3. Write test following testing-patterns:
     - Mock ONLY at boundaries (HTTP, DB, file I/O)
     - Tests must pass the Library Swap Test
  4. Run test - verify it FAILS:
     npm test -- --run [test-file]
  5. If test passes, behavior already exists - write different test

  ### GREEN: Minimal Implementation
  1. Write ONLY enough code to make test pass
  2. Follow CLAUDE.md standards
  3. Run test - verify it PASSES

  ### REFACTOR: Clean Up
  1. Improve code quality while tests stay green
  2. Extract helpers, reduce duplication
  3. Run ALL tests after each refactor

  ## Skills to Load
  - tdd (TDD workflow)
  - testing-patterns (boundary mocking)
  - Domain-specific skills per mastermind-agent routing

  Report progress after each TDD cycle.
```

### Phase 3: Track Progress

Maintain checklist during implementation:

```markdown
## Implementation Progress

### Tests Written (RED)
- [ ] Step 1: [test] - FAILING
- [ ] Step 2: [test] - FAILING

### Implementations (GREEN)
- [ ] Step 1: [impl] - PASSING
- [ ] Step 2: [impl] - PASSING

### Refactors
- [ ] Extracted [helper]
- [ ] Cleaned up [file]
```

### Phase 4: Run Verification

Execute all verification commands from the phase MD:

```bash
npm test
npm run test:integration 2>/dev/null || true
npx tsc --noEmit
npm run lint
npm run build
```

Plus any phase-specific verification commands.

### Phase 5: Check Done When

Compare actual state against each Done When criterion:

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | [criterion] | pass/fail | [test name, file] |

If any fail, either complete the work or report as blocker.

### Phase 5.5: Review Against the Phase Document

Run `/review` on the branch. Its Spec axis picks this phase document up from `ai_plans/` and judges the diff against it; its Standards axis applies the repo's standards and the smell baseline.

- Fix every `[Blocker]` test-first via `tdd`, then re-run Phase 4 verification
- Carry `[Nice to have]` and `[Suggestion]` findings into the Completion Report rather than fixing them silently
- A Spec finding of scope creep or a missing requirement is resolved here, not deferred to the next phase

Done when the review reports no `[Blocker]` on either axis.

### Phase 6: Cascade Update to Future Phases

After implementation, check if changes invalidate future phases.

List all phase files:

```bash
ls $(dirname $ARGUMENTS)/*.md | sort
```

For each FUTURE phase (number > current), scan for references to:
- Files modified in this phase
- Interfaces/types changed
- Dependencies added/removed
- Steps that depended on this phase's output

Update patterns:

| Discovery | Update Action |
|-----------|---------------|
| Interface method changed | Update Files to Edit section |
| New dependency required | Add to Dependencies section |
| Step no longer needed | Remove or mark "Already done in Phase X" |
| New prerequisite step | Add with "(added from Phase X)" |
| File path changed | Update all file references |

When updating a future phase, add comment:

```markdown
<!-- Updated by Phase X implementation on YYYY-MM-DD -->
<!-- Change: [brief description] -->
```

Use Edit tool for surgical updates, preserving structure.

### Phase 7: Manual Testing Prompt

Use AskUserQuestion:

```
Implementation complete. All automated tests pass.

## Manual Testing Required

Based on phase requirements, please verify:

1. [UI check if applicable]
2. [API check via Postman/curl if applicable]
3. [End-to-end flow if applicable]

Options:
1. "All manual tests pass - mark complete"
2. "Found issue: [describe]" - I'll help fix
3. "Skip manual testing - mark complete anyway"
```

### Phase 8: Completion Report

```markdown
## Phase Implementation Complete

### Phase: [number] - [title]
Path: $ARGUMENTS
Status: Complete

### TDD Summary
| Metric | Count |
|--------|-------|
| Tests Written | X |
| Implementation Steps | Y |
| Refactors | Z |

### Files Modified
- path/to/file1.ts - [change summary]
- path/to/file2.ts - [change summary]

### Tests Added
- path/to/test1.test.ts - [coverage summary]

### Quality Gates
- [x] Unit Tests: PASS
- [x] TypeScript: PASS
- [x] Lint: PASS
- [x] Build: PASS
- [x] Review: no [Blocker] on Standards or Spec

### Review Findings Carried Forward
[Nice to have] and [Suggestion] findings left for later, or "None"

### Done When
- [x] [Criterion 1]
- [x] [Criterion 2]

### Cascade Updates
- 04-next-phase.md - Updated Files section
- 05-another.md - Added dependency

### Manual Testing
- [x] Verified by user

### Next Phase
Ready: ai_plans/[feature]/[next-phase].md
```

## Error Handling

### Test Failures

If test fails during GREEN phase:
1. Do NOT modify the test
2. Fix the implementation
3. If impossible, flag for user decision

### Verification Failures

If quality gates fail:
1. Fix the issue
2. Re-run verification
3. Do NOT mark complete until all pass

### Cascade Conflicts

If update would break in-progress phase:
1. Report the conflict
2. Ask user how to proceed
3. Document decision in both phase files

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Writing impl before test | Strict RED-first |
| Modifying test to pass | Fix implementation |
| Skipping REFACTOR | Always clean up |
| Cascade updates without comment | Always add comment |
| Complete with failing tests | All gates must pass |
