---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/__tests__/**"
  - "**/test/**"
  - "**/tests/**"
  - "**/*.py"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

## Test-Driven Development (TDD)

MANDATORY workflow for new logic, bug fixes, and behavior changes:

1. RED: Write a failing test for the desired behavior
2. Run test - verify it FAILS (confirms test is meaningful)
3. GREEN: Write the minimum code to make the test pass
4. Run ALL tests - verify they PASS
5. REFACTOR: Improve code structure while keeping tests green
6. Run ALL tests again - verify they STILL PASS
7. Verify coverage (80%+)

Load `tdd` skill for detailed RED/GREEN/REFACTOR patterns.

### Seams (MANDATORY)

A SEAM is the public interface where behavior is observed without reaching inside. Tests live at seams, never against internals. The `codebase-design` skill owns the definition.

TEST ONLY AT PRE-AGREED SEAMS. The seams under test are written down and confirmed before any test is written. `/plan-task` and `/plan-to-docs` produce them in the plan; `/plan-test` confirms them; otherwise ask.

Prefer EXISTING seams to new ones. Prefer the HIGHEST seam that reaches the behavior. Prefer FEWER seams.

### Test Anti-Patterns (ALWAYS a blocker in review)

- IMPLEMENTATION-COUPLED: mocks internal collaborators, tests private methods, or verifies through a side channel such as querying the DB instead of using the interface. The tell is a test that breaks on refactor when behavior did not change
- TAUTOLOGICAL: the assertion recomputes the expected value the way the code does, so it passes by construction. Expected values come from an independent source: a known-good literal, a worked example, the spec
- HORIZONTAL SLICING: all tests written first, then all implementation. Bulk tests verify IMAGINED behavior. Work in vertical slices instead, one test then one implementation, each a tracer bullet

### When to Use TDD

- New functions, hooks, services, components with logic
- Bug fixes (reproduce the bug with a failing test first)
- API endpoint implementation
- Significant refactors that change behavior

### When to Skip TDD

- Config/env changes only
- Documentation-only changes
- Styling-only (CSS/SCSS with no logic)
- Renaming/moving files with no behavior change
- Adding types/interfaces with no runtime code

## Boundary Testing (MANDATORY)

Tests MUST mock ONLY at system boundaries (HTTP, DB, file I/O, time), NEVER internal functions or libraries.

The Library Swap Test: if you swap ANY internal library (axios to fetch, Prisma to TypeORM) or restructure internal code, your tests MUST still pass. If they break, the tests are coupled to implementation - rewrite them.

| Blocker Code | Anti-Pattern | Fix |
|--------------|-------------|-----|
| B1 | `vi.mock('axios')` | MSW/nock at HTTP boundary |
| B2 | `vi.mock('../services/...')` | Let real code execute |
| B3 | `vi.spyOn(axios, 'get')` | Assert on outputs |
| B4 | Testing library internals | Test observable output |

Load `testing-patterns` skill for full patterns, DI examples, MSW/nock setup, and cloud service mocking (@aws-sdk/client-mock, GCP emulators).

## Behavior-Driven Tests

Follow testing-patterns skill conventions:
- Describe what the function/component DOES
- Use clear, readable test names
- Test INPUT to OUTPUT contracts, not internal implementation

## Test Failure Discipline (STRICT)

- Treat test failures as indications that YOUR code needs fixing, not that tests are wrong
- NEVER remove or disable pre-existing tests unless the user explicitly orders it
- If a test fails after your changes, fix the implementation to make the test pass
- Only modify a test if you can prove the test itself is incorrect (not just inconvenient)

## Troubleshooting Test Failures

1. Use **bug-finder-agent** agent for root cause analysis
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are provably wrong)

## Post-Implementation Verification (REQUIRED)

After completing any implementation, run the appropriate verification commands:

**JavaScript/TypeScript projects:**
1. `npm test` - Run tests
2. `npx tsc --noEmit` - TypeScript check
3. `npm run lint` - Lint check
4. `npm run build` - Build verification

**Python projects:**
1. `poetry run pytest` (or `make test`) - Run tests
2. `poetry run ruff check .` - Lint check
3. `poetry run ruff format --check .` - Format check

Fix ALL errors before considering task complete.
