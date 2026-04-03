# Testing Requirements

## CORE PRINCIPLE: I/O-Based Testing

**MANDATORY**: All tests must be I/O-based (Input/Output). Mock at the HTTP boundary using **MSW** (frontend) or **nock** (backend), NOT internal functions.

Why:
- Tests survive refactoring (internal changes don't break tests)
- Tests validate the contract (same I/O = same test result)
- Tests are decoupled from implementation details

```
[Test] → [Real Code] → [HTTP Call] → [MSW Interceptor] → [Mock Response]
```

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Pure functions, utilities (no I/O)
2. **Integration Tests** - API endpoints with HTTP interception (MSW/nock)
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
- Mock at HTTP boundary only (MSW/nock)

## Mocking Rules (STRICT)

### CORRECT: HTTP Interception
```typescript
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/users', () => HttpResponse.json(mockUsers))
);
```

### WRONG: Internal Function Mocking
```typescript
// NEVER DO THIS - couples tests to implementation
vi.mock('../services/userService', () => ({
  getUsers: vi.fn().mockResolvedValue(mockUsers),
}));
```

The test should make real function calls. Only HTTP is intercepted.

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

## Test Quality Checklist

Before submitting tests:
- [ ] Uses MSW/nock for HTTP mocking (not vi.mock on services)
- [ ] Test would pass if internal implementation changed (but I/O stayed same)
- [ ] No direct mocking of functions that make HTTP calls
- [ ] Test validates input → output contract
- [ ] Error scenarios use HTTP error responses (not thrown mocks)
