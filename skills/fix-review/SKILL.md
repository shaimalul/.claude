---
name: fix-review
description: Fix ALL findings from a review report autonomously - blockers, nice-to-haves, suggestions. Investigate deeply, ask questions only as last resort at the end.
argument-hint: [path to review report or CLAUDE.md]
skills: tdd, testing-patterns, find-bug
---

# Fix Review Findings

Extends: `review-base` - the severity vocabulary comes from there.

Systematically work through ALL findings from a code review report - not just blockers, but EVERY finding including nice-to-haves and suggestions. For each finding: identify root cause, write a failing test, fix the root cause, verify test passes. Tests are MANDATORY - they prevent regressions and build reliable software.

## Core Principles (NON-NEGOTIABLE)

1. **Fix EVERYTHING** - Blockers, Nice-to-haves, AND Suggestions. No stopping after blockers.
2. **Investigate Autonomously** - Before asking any question, exhaust all investigation options (git blame, codebase search, related tests, documentation).
3. **Questions ONLY at the End** - If investigation cannot resolve an issue, queue the question. ALL questions batched at the very end.
4. **Tests for EVERY Fix** - No exceptions. Every fix gets a test that would have caught the issue.
5. **No Prompt Needed** - When triggered, process the entire report autonomously.

## Phase 1: Locate Report

Find the review findings to process:

1. If `$ARGUMENTS` is a file path, read that file
2. Otherwise, search for review output:
   - Check current CLAUDE.md for embedded review findings
   - Look for recent review output in conversation context
   - Search for `review-report.md` or similar in the project root

Parse the report to extract all findings with their severity, using the prefix table from `review-base`.

A `/review` report has TWO axes. Process BOTH. Standards-axis findings carry prefixes; Spec-axis findings are grouped under Missing or partial, Not asked for, and Implemented but wrong. Treat a Spec-axis "missing or partial" as a `[Blocker]`, and a "not asked for" as a decision to raise with the user rather than silently remove.

## Phase 2: Create Progress Tracker

Create or update a tracking section in the project's CLAUDE.md:

```markdown
## Review Findings Progress

| # | Severity | File | Finding | Status |
|---|----------|------|---------|--------|
| 1 | [Blocker] | path:line | Summary | [ ] Pending |
| 2 | [Nice to have] | path:line | Summary | [ ] Pending |
...

### Questions for User
- [ ] Q1: [Question text]
- [ ] Q2: [Question text]
```

If CLAUDE.md does not exist, create a temporary `_review-progress.md` file.

## Phase 3: Process ALL Findings (TDD Workflow)

Work through ALL findings using Red-Green-Refactor for EVERY fix. Do NOT stop after blockers - continue through the entire list.

### Processing Order (ALL are fixed)
1. **Blockers** - Fix first (highest priority)
2. **Nice to have** - Fix after blockers (still mandatory)
3. **Suggestions** - Fix after nice-to-haves (still mandatory)
4. **Need to check** - Investigate DEEPLY, then fix or dismiss with documented reasoning

**IMPORTANT**: The only acceptable end states are `[x] Fixed` or `[-] Skipped: [documented reason]`. No finding should remain `[ ] Pending` when complete.

### For Each Finding - The TDD Loop

#### Step 1: Root Cause Analysis (MANDATORY)

NEVER fix symptoms. Always find the root cause first:

1. Read the finding and affected code
2. Use `find-bug` agent patterns to trace the issue
3. Ask: "Why did this happen? What allowed this bug/issue to exist?"
4. Search for similar patterns elsewhere in codebase
5. Check git blame for context on how it was introduced
6. Document the root cause before proceeding

#### SSOT Check (MANDATORY)

Before writing ANY fix code:

1. Search: Is this logic/constant/type already defined elsewhere?
2. If YES: import and reuse - do NOT duplicate
3. If fixing a bug caused by duplication: fix ALL occurrences, then consolidate to single source
4. Ask: "After my fix, can this be changed in one place?" - if no, refactor first

#### Step 2: RED - Write Failing Test First

Load `testing-patterns` skill. Write a test that:

1. Reproduces the exact issue from the finding
2. Fails with the current code (proves the bug exists)
3. Tests the ROOT CAUSE, not just the symptom
4. Follows boundary testing rules - mock only at system boundaries
5. Uses proper assertions that will pass after the fix

```bash
npm test -- --testPathPattern="[test-file]"
```

Verify the test FAILS before proceeding.

#### Step 3: GREEN - Fix the Root Cause

1. Implement the minimal fix that makes the test pass
2. Fix the ROOT CAUSE, not a workaround
3. Run the test to verify it passes
4. Run related tests to check for regressions

```bash
npm test -- --testPathPattern="[test-file]"
npm test -- --testPathPattern="[related-tests]"
```

#### Step 4: REFACTOR (if needed)

1. Clean up the fix if needed
2. Remove any duplication introduced
3. Ensure tests still pass
4. Run full test suite if changes are broad

#### Step 5: Update Tracker

1. Change status from `[ ] Pending` to `[x] Fixed`
2. Add note: `Test: [test-file:line]`
3. Move to next finding

### Deep Investigation (BEFORE Asking Anything)

For `[Need to check]` items or ANY unclear aspect, investigate EXHAUSTIVELY before considering a question:

1. **Code Archaeology**
   - `git blame` on affected lines - who wrote it, when, why?
   - `git log -p --follow [file]` - full history of changes
   - Search commit messages for related context

2. **Pattern Analysis**
   - Search codebase for similar implementations
   - Check how other modules handle the same scenario
   - Look for tests that demonstrate expected behavior

3. **Context Gathering**
   - Read related documentation, README files, CLAUDE.md
   - Check for comments explaining non-obvious choices
   - Review PR/PR descriptions if accessible

4. **Reasoning Through It**
   - What would a reasonable developer intend here?
   - What's the safest interpretation that fixes the issue?
   - Can you make a defensible choice and document your reasoning?

**ONLY after exhausting ALL above steps**, if the issue TRULY cannot be resolved without human input, queue the question for the end. Most "questions" can be answered through investigation.

### When Tests Are Not Possible

Rare cases where tests cannot be added:
- Pure configuration changes
- Documentation-only fixes
- Third-party dependency updates

Mark these as `[x] Fixed (no test: [reason])` in tracker.

## Phase 4: Questions (LAST RESORT ONLY)

Questions should be RARE. Most issues can be resolved through investigation. If you have more than 2-3 questions, you haven't investigated deeply enough.

**Question Criteria** - ONLY ask if ALL are true:
- [ ] Exhausted all investigation techniques from Phase 3
- [ ] Cannot make a defensible choice with documentation
- [ ] The decision has significant impact that justifies blocking
- [ ] Not something that can be fixed and adjusted later if wrong

**If questions remain after ALL findings are processed:**

```markdown
## Questions (After Processing X/Y Findings)

I fixed X findings and need input on Y remaining items:

1. **[path:line]** - [Specific question with what you already investigated]
   - Investigated: [what you checked]
   - Options: A) [option] B) [option]
   - My recommendation: [what you'd do and why]

Please answer, then I'll complete the remaining fixes.
```

**Preferred approach**: Make a defensible choice, document the reasoning in the commit/code, and note it in the completion report. The user can adjust later if needed.

## Phase 5: Verification (MANDATORY)

**DO NOT report completion until ALL checks pass:**

```markdown
## Verification Checklist

### Coverage (ALL findings must be resolved)
- [ ] Read the progress tracker
- [ ] Count: Total findings = Fixed + Skipped (with reasons)
- [ ] ZERO findings remain `[ ] Pending`
- [ ] ALL Blockers: `[x] Fixed`
- [ ] ALL Nice to haves: `[x] Fixed` or `[-] Skipped: [reason]`
- [ ] ALL Suggestions: `[x] Fixed` or `[-] Skipped: [reason]`
- [ ] ALL Need to check: Resolved (fixed, skipped with reason, or converted to other category)

### Quality (NO REGRESSIONS)
- [ ] EVERY fix has a corresponding test (except documented exceptions)
- [ ] Full test suite passes: `npm test`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] No new warnings introduced

### Autonomy
- [ ] Questions section is empty OR contains only truly unresolvable items
- [ ] Each question includes: what was investigated, options considered, recommendation

If ANY item fails, continue processing. Do NOT ask user for permission to continue.
```

### Final Test Run

Run the complete test suite to ensure no regressions:

```bash
npm test
npx tsc --noEmit
npm run lint
```

ALL must pass before marking complete.

## Phase 6: Completion Report

Only after Phase 5 passes:

```markdown
## Review Findings - Complete

### Summary
| Severity | Total | Fixed | Skipped | Tests Added |
|----------|-------|-------|---------|-------------|
| Blocker | X | X | 0 | X |
| Nice to have | X | X | X | X |
| Suggestion | X | X | X | X |
| Need to check | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** |

### Changes Made
- [file1]: [brief description of fix] - Test: [test-file:line]
- [file2]: [brief description of fix] - Test: [test-file:line]

### Tests Added (Regression Prevention)
| Test File | Test Name | Covers Finding | Would Have Caught |
|-----------|-----------|----------------|-------------------|
| [path] | [test name] | [finding #] | [yes/no - did test fail before fix?] |

### Skipped Items (Must Have Documented Reason)
- [path:line]: [reason for skipping - e.g., "code no longer exists", "superseded by finding #X"]

### Quality Gates
[x] All tests pass
[x] TypeScript compiles
[x] Lint passes
[x] No regressions introduced

### Verification
[x] ALL findings processed (Blockers + Nice-to-haves + Suggestions)
[x] Progress tracker updated - zero pending items
[x] Every fix has a test (prevents future regressions)
[x] No human-in-the-loop required (or questions batched at end)
```

## Status Markers

Use these status markers in the progress tracker:

| Marker | Meaning |
|--------|---------|
| `[ ]` | Pending - not yet processed |
| `[x]` | Fixed - implemented and verified |
| `[-]` | Skipped - with documented reason |
| `[?]` | Needs input - waiting for user answer |
| `[!]` | Blocked - cannot proceed, needs external action |

## Edge Cases

- **Finding references deleted code**: Mark as `[-] Skipped: code no longer exists`
- **Finding already fixed**: Verify fix is present, mark as `[x] Already fixed`
- **Conflicting findings**: Flag both, add to Questions section
- **Finding is unclear**: Investigate first, if still unclear add to Questions
- **User answers question mid-process**: Update status, continue processing
