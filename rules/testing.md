# Testing Requirements

## CORE PRINCIPLE: Boundary Testing (I/O-Based, Black-Box)

**MANDATORY**: All tests must be **boundary tests**. Mock ONLY at system boundaries (HTTP, database, file I/O), NEVER internal functions or libraries.

### The Library Swap Test

> If you swap ANY internal library or restructure ANY internal code, your tests MUST still pass.
> If they break, your tests are coupled to implementation - fix them.

Examples:
- Swap axios → fetch: tests pass
- Swap Prisma → TypeORM: tests pass  
- Refactor userService internals: tests pass
- Change caching from Redis to Memcached: tests pass

### Why Boundary Testing?

- **Tests survive refactoring** - Change internals freely, tests stay green
- **Tests validate contracts** - Same input/output = same test result
- **Tests are implementation-agnostic** - No knowledge of internal libraries
- **Tests are meaningful** - They test what users/consumers experience
- **Tests are decoupled from logic** - Internal details don't break tests

### Tests Don't Know About Internal Logic

If the test breaks when you change internal logic (not the contract), the test is wrong:

```typescript
// Internal changes that should NOT break tests:
- Rename env var: API_URL → BASE_URL
- Change config key: 'timeout' → 'requestTimeout'
- Refactor function: split into smaller functions
- Change algorithm: bubble sort → quick sort
- Rename internal variable: 'data' → 'response'

// ONLY these should break tests (contract changes):
- Change API endpoint path: /users → /accounts
- Change response shape: { name } → { fullName }
- Change function signature: getUser(id) → getUser(id, options)
```

**The principle**: Test the WHAT (input/output), not the HOW (internal logic).

### Boundary Diagram

```
[Test] → [Your Code] → [BOUNDARY] → [Mock]
                            ↑
                      ONLY mock HERE
                    (HTTP, DB, File I/O)

Examples of what NOT to mock (implementation details):
- HTTP clients: axios, fetch, got, ky, node-fetch
- Internal services: userService, authService, apiClient
- Repositories: userRepository, dataRepository
- Utilities: formatDate, validateInput
```

### Dependency Injection for Testability

**DI is HOW you achieve decoupled tests** - inject dependencies at boundaries, not internals.

```typescript
// GOOD: Inject config and dependencies
class UserService {
  constructor(
    private httpClient: HttpClient,     // Injected interface
    private config: { baseUrl: string } // Injected config
  ) {}
  
  async getUser(id: string) {
    return this.httpClient.get(`${this.config.baseUrl}/users/${id}`);
  }
}

// Test doesn't know about:
// - Which HTTP client is used (axios? fetch?)
// - What the env var is called (API_URL? BASE_URL?)
// - How config is loaded (dotenv? AWS Secrets?)
```

DI enables you to:
- **Decouple tests from internal logic** - rename env vars, tests don't break
- **Swap implementations** - change libraries, tests don't break
- **Test real code paths** - mock only at boundaries
- **Keep tests ignorant** - no knowledge of HOW, only WHAT

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

### What is a Boundary?

Boundaries are edges where your code interacts with external systems:
- **HTTP** - API calls (use MSW/nock)
- **Database** - Queries (use test database, not mock repository)
- **File System** - File I/O (use temp files or mock fs)
- **Time** - Date/timers (use vi.useFakeTimers)
- **External Services** - Third-party APIs (use MSW/nock)

### NEVER Mock (Implementation Details)

These are **examples** - the principle applies to ANY internal implementation:

```typescript
// WRONG - Mocking HTTP client libraries (ANY of them)
vi.mock('axios');           // or fetch, got, ky, superagent...
vi.mock('node-fetch');

// WRONG - Mocking ORM/database clients
vi.mock('prisma');          // or typeorm, sequelize, knex...
vi.mock('../db/connection');

// WRONG - Mocking internal services/repositories
vi.mock('../services/userService');
vi.mock('../repositories/userRepository');

// WRONG - Mocking internal utilities
vi.mock('../utils/apiClient');
vi.mock('../lib/cache');
```

**The principle**: If it's YOUR code or a library YOUR code uses internally, don't mock it.

### ALWAYS Mock at Boundary (HTTP Layer)

```typescript
// CORRECT - MSW intercepts HTTP regardless of what library makes the call
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/users', () => HttpResponse.json(mockUsers))
);

// Your code can use axios, fetch, got, ky, etc. - test doesn't care
```

### Why This Matters

```typescript
// Your service today:
const response = await axios.get('/api/users');

// You refactor to:
const response = await fetch('/api/users');

// With boundary testing: Tests still pass (MSW intercepts both)
// With vi.mock('axios'): Tests BREAK (coupled to implementation)
```

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
- [ ] **Library Swap Test**: Would test pass if you swapped ANY internal library?
- [ ] **DI Used**: Dependencies injected at boundaries, not hardcoded
- [ ] Uses MSW/nock/test-DB for boundary mocking (NEVER vi.mock on libraries/services)
- [ ] Test would pass if internal implementation changed (but I/O stayed same)
- [ ] No mocking of: HTTP clients, ORMs, internal services, repositories, utilities
- [ ] Test validates input → output contract at boundaries only
- [ ] Error scenarios use boundary-level errors (HTTP 4xx/5xx, DB errors)
- [ ] Test has no knowledge of which libraries the code uses internally
