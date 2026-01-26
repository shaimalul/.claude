# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

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
