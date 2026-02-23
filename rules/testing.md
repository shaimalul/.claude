# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

## Test-Driven Development (RGR)

MANDATORY workflow for new logic, bug fixes, and behavior changes:

1. RED: Write a failing test for the desired behavior
2. Run test - verify it FAILS (confirms test is meaningful)
3. GREEN: Write the minimum code to make the test pass
4. Run ALL tests - verify they PASS
5. REFACTOR: Improve code structure while keeping tests green
6. Run ALL tests again - verify they STILL PASS
7. Verify coverage (80%+)

Load `rgr-patterns` skill for detailed RED/GREEN/REFACTOR patterns.

### When to Use RGR

- New functions, hooks, services, components with logic
- Bug fixes (reproduce the bug with a failing test first)
- API endpoint implementation
- Significant refactors that change behavior

### When to Skip RGR

- Config/env changes only
- Documentation-only changes
- Styling-only (CSS/SCSS with no logic)
- Renaming/moving files with no behavior change
- Adding types/interfaces with no runtime code

## Behavior-Driven Tests

Follow testing-patterns skill conventions:
- Describe what the function/component DOES
- Use clear, readable test names
- Proper mocking and isolation

## Troubleshooting Test Failures

1. Use **bug-finder** agent for root cause analysis
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

## Post-Implementation Verification (REQUIRED)

After completing any implementation, ALWAYS run in order:
1. `npm test` - Run tests
2. `npx tsc --noEmit` - TypeScript check
3. `npm run lint` - Lint check
4. `npm run build` - Build verification

Fix ALL errors before considering task complete.
