---
name: review-test
description: Audit test files for anti-patterns - finds redundant tests, implementation coupling, Library Swap Test failures, and missing edge coverage. Use when reviewing test quality.
argument-hint: [test file path or directory]
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
allowed-tools: Read, Grep, Glob, Bash
model: opus
---

# Test Audit

Review existing test files against the `testing-patterns` boundary testing standard. Identify tests that are redundant, coupled to implementation, or missing critical coverage.

**Core question for every test**: "Would this test still pass if we swapped the internal library or restructured the code?"

## Phase 1: Discovery

Determine which test files to audit:

1. If `$ARGUMENTS` is a file path ending in `.test.ts`/`.spec.ts`, read that file
2. If `$ARGUMENTS` is a directory, glob for all test files in it: `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`
3. If `$ARGUMENTS` is a source file (not a test), look for its corresponding test file
4. If no arguments, find test files changed on the current branch:
   ```bash
   git diff --name-only main...HEAD | grep -E '\.(test|spec)\.(ts|tsx)$'
   ```
   If no branch changes, fall back to all test files in `src/`.

For each test file:
- Read the full test file
- Locate and read the corresponding source file (strip `.test`/`.spec` from the filename)
- If source file not found, note it and proceed with test-only analysis

## Phase 2: Anti-Pattern Detection

Scan each test file for these specific anti-patterns. Use the exact detection heuristics listed.

### Blocker Anti-Patterns (Must Rewrite)

**B1: Library Mocking**
- Detection: `vi.mock('axios')`, `vi.mock('node-fetch')`, `vi.mock('got')`, `vi.mock('ky')`, `vi.mock('superagent')`, `vi.mock('prisma')`, `vi.mock('@prisma/client')`, `vi.mock('redis')`, `vi.mock('ioredis')`, `vi.mock('bull')`, `vi.mock('mongoose')`, `vi.mock('sequelize')`, `vi.mock('typeorm')`, `vi.mock('knex')` or any `vi.mock` of a third-party package name (no relative path)
- Exception: `vi.mock` of test utilities (`__mocks__/`, `test/`, `__tests__/`, `fixtures/`, `mocks/`) is acceptable
- Why: Couples tests to a specific library choice. Fails the Library Swap Test.
- Fix: Use MSW/nock to intercept at the HTTP boundary, test DB for database.

**B2: Internal Service/Repository Mocking**
- Detection: `vi.mock('../services/...')`, `vi.mock('../repositories/...')`, `vi.mock('../utils/...')`, `vi.mock('../lib/...')`, `vi.mock('../hooks/...')` - any `vi.mock` with a relative path pointing to production source code
- Exception: Mocking context providers, test wrappers, or files in test directories is acceptable
- Why: Couples tests to internal code structure. Restructuring breaks tests.
- Fix: Let real code execute. Mock only at boundaries (HTTP, DB, FS).

**B3: Implementation-Coupled Assertions**
- Detection: `vi.spyOn(module, 'internalHelper')`, `vi.spyOn(axios, 'get')`, `vi.spyOn(prisma.user, 'findMany')`, assertions on how many times an internal function was called, assertions on internal state not exposed through the public API
- Why: Tests internal HOW instead of external WHAT. Refactoring breaks tests.
- Fix: Assert on outputs, rendered UI, or HTTP responses - not internal calls.

**B4: Third-Party Internals Testing**
- Detection: Assertions that axios was called with specific config, that Prisma used `findMany` vs `findFirst`, that Redis used `hget` vs `get`, assertions on library-specific method signatures
- Why: Tests the library, not your code's contract.
- Fix: Test the observable output. The library is someone else's responsibility.

### Nice-to-Have Anti-Patterns (Should Improve)

**N1: Render-Only Tests**
- Detection: Test body contains only `render(<Component />)` with no meaningful assertion, or only asserts `toBeTruthy()` / `toBeDefined()` on the container itself
- Why: Tests that the component doesn't throw. Catches almost nothing.
- Fix: Test actual behavior - user interactions, displayed data, state changes.

**N2: Missing Error Path Coverage**
- Detection: Source file has `try/catch`, `.catch()`, error states, or HTTP error handling, but test file has zero tests with error/failure scenarios (no `status: 500`, no `reject`, no error assertions)
- Why: Happy path passes; production breaks on the first error.
- Fix: Add tests for API failures, network errors, invalid data, timeout.

**N3: Missing Boundary Coverage**
- Detection: Source file imports `axios`/`fetch`/`prisma`/`fs` or makes external calls, but test file does not use MSW (`setupServer`, `http.get`), nock, or test database setup
- Why: Tests don't exercise the real code path through the boundary.
- Fix: Add MSW/nock handlers to intercept HTTP calls in tests.

**N4: Test Interdependence**
- Detection: Shared mutable `let` variables modified inside `it()` blocks without `beforeEach` reset, tests that rely on execution order, tests sharing state via module-level variables
- Why: Tests pass in sequence, fail when run in isolation or parallel.
- Fix: Each test should set up its own state. Use `beforeEach` for shared setup.

**N5: Happy Path Only**
- Detection: All `it()` blocks describe success scenarios. Zero tests for: error states, empty data, null/undefined inputs, network failures, unauthorized access, timeout
- Why: 100% of tests pass, 0% of production errors are caught.
- Fix: Add at least: one error path, one empty state, one boundary value test.

### Suggestion Anti-Patterns (Consider Fixing)

**S1: Env Var / Config Key Coupling**
- Detection: Test directly references `process.env.API_URL`, `process.env.DATABASE_URL`, or hardcoded config keys that are internal implementation details
- Why: Renaming an env var breaks tests even though behavior is unchanged.
- Fix: Use DI to inject config. Tests should not know internal config key names.

**S2: Redundant Tests**
- Detection: Multiple tests asserting the exact same behavior with trivially different inputs (e.g., three tests for "renders user name" with different names), or testing behavior already guaranteed by TypeScript types (e.g., testing that a required prop throws when missing)
- Why: More tests without more coverage. Maintenance cost with zero value.
- Fix: Use one test per behavior. Use triangulation only when it forces generalization.

**S3: Snapshot Abuse**
- Detection: `toMatchSnapshot()` or `toMatchInlineSnapshot()` capturing large DOM trees (>20 lines), full API response objects, or entire component renders
- Why: Snapshots become noise. Any change triggers update. Nobody reads the diff.
- Fix: Assert on specific values. Use snapshots only for small, stable structures.

## Phase 3: Library Swap Test Simulation

For each test file, run this mental simulation:

1. Identify which libraries the source code uses (from Phase 1 source file read)
2. For each library, ask: "If we replaced [library] with an alternative, which tests would break?"
3. Categorize each test as:
   - **PASS**: Test would survive a library swap (tests contract/output)
   - **FAIL**: Test would break on library swap (tests implementation)
4. Record results in the report

## Phase 4: Missing Coverage Analysis

Compare source file complexity against test coverage:

1. Count decision points in source (if/else, switch cases, try/catch, ternary operators, `?.` chains, `||`/`??` fallbacks)
2. Count test scenarios in test file
3. Flag significant gaps:
   - Untested error paths (catch blocks with no corresponding test)
   - Untested empty/null states
   - Untested conditional branches
   - Untested state transitions
4. For each gap, estimate production risk: High (data loss/corruption), Medium (degraded UX), Low (cosmetic)

## Phase 5: Audit Report

Generate the report using `review-base` severity prefixes:

```markdown
## Test Audit Report

### Files Reviewed
| Test File | Source File | Test Count | Blockers | Warnings |
|-----------|------------|------------|----------|----------|
| [path] | [path] | X | X | X |

### Summary
| Severity | Count | Action |
|----------|-------|--------|
| Blocker | X | Must rewrite before merge |
| Nice to have | X | Should improve |
| Suggestion | X | Consider fixing |
| Missing coverage | X areas | Should add tests |

---

### [Blocker] Findings - Must Rewrite

| # | Test File | Line(s) | Anti-Pattern | Current Code | Fix |
|---|-----------|---------|--------------|--------------|-----|
| 1 | [path:line] | [lines] | [B1/B2/B3/B4] | `vi.mock('axios')` | Use MSW: `server.use(http.get(...))` |

### [Nice to have] Findings - Should Improve

| # | Test File | Line(s) | Issue | Recommendation |
|---|-----------|---------|-------|----------------|
| 1 | [path:line] | [lines] | [N1-N5] | [specific fix] |

### [Suggestion] Findings - Consider Fixing

| # | Test File | Issue | Recommendation |
|---|-----------|-------|----------------|
| 1 | [path:line] | [S1-S3] | [specific fix] |

---

### Library Swap Test Results

| Test File | Current Library | Would Survive Swap? | Failing Tests |
|-----------|----------------|--------------------|----|
| [path] | axios | Yes/No | [list of test names that would break] |

### Missing Coverage

| Source File | Untested Scenario | Risk | Suggested Test |
|-------------|-------------------|------|----------------|
| [path:line] | API returns 500 | High | `it('should show error when API fails')` |
| [path:line] | Empty array response | Medium | `it('should show empty state')` |

---

### Action Items (Priority Order)

#### Tests to DELETE (Zero Value)
- [path:line] - [reason: e.g., "only tests that component renders without error"]
- [path:line] - [reason: e.g., "tests axios internals, not your code"]

#### Tests to REWRITE (Implementation-Coupled)
- [path:line] - [reason + what to replace with]

#### Tests to ADD (Missing Coverage)
1. [highest risk gap] - [suggested test description]
2. [second priority] - [suggested test description]
3. [third priority] - [suggested test description]
```

## Edge Cases in Auditing

- **No source file found**: Note in report, skip missing coverage analysis, still check anti-patterns in test file
- **Test file uses both good and bad patterns**: Report specific lines with bad patterns, acknowledge good patterns exist
- **Custom test utilities that wrap vi.mock**: Flag if the wrapper ultimately mocks production code. Acceptable if it only sets up MSW/nock.
- **Legacy test files with many issues**: Prioritize blockers. Suggest incremental rewrite, not a complete teardown.

## Post-Audit

After presenting the report:
- Suggest running `/plan-test` on source files with missing coverage to design proper tests
- Reference `testing-patterns` for the correct boundary mocking patterns
- Reference `rgr-patterns` for the TDD workflow when rewriting tests
