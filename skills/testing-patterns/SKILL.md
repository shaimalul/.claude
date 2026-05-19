---
name: testing-patterns
description: Boundary testing conventions - mock ONLY at system edges (HTTP, DB, file I/O), NEVER internal functions. Tests must pass the Library Swap Test.
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Testing Conventions

## CORE PRINCIPLE: Boundary Testing (Black-Box, Contract-Based)

**MANDATORY**: Tests must be **boundary tests**. Mock ONLY at system boundaries, NEVER internal functions or libraries.

### The Library Swap Test

> **If you swap ANY internal library or restructure ANY internal code, your tests MUST still pass.**
> If they break, your tests are coupled to implementation - rewrite them.

Examples that MUST pass without test changes:
- axios → fetch (HTTP client swap)
- Prisma → TypeORM (ORM swap)
- Redis → Memcached (cache swap)
- Refactor service internals (code restructure)

### Why Boundary Testing?

- **Tests survive refactoring**: Swap libraries, restructure code - tests stay green
- **Tests validate contracts**: Same input/output = same test result
- **Tests are implementation-agnostic**: No knowledge of internal libraries
- **Tests are meaningful**: They test what users/consumers actually experience
- **Tests are decoupled from logic**: Internal implementation details don't break tests

### Tests Don't Know About Internal Logic

The test should NEVER break when you change internal logic. Only contract changes break tests.

```typescript
// These internal changes should NOT break tests:
- Rename env var: process.env.API_URL → process.env.BASE_URL
- Change config key: config.timeout → config.requestTimeout  
- Refactor internals: split function, rename variables
- Change algorithm: different sorting, different caching strategy
- Restructure code: move files, rename internal functions

// ONLY contract changes break tests:
- API endpoint changes: GET /users → GET /accounts
- Response shape changes: { name } → { fullName }
- Public function signature changes
```

**Test the WHAT (input → output), not the HOW (internal logic).**

### What is a Boundary?

A boundary is where your code interacts with external systems:

| Boundary | Mock Tool | Example |
|----------|-----------|---------|
| HTTP requests | MSW, nock | API calls to backend or third-party |
| AWS services | @aws-sdk/client-mock | S3, DynamoDB, SQS, Lambda |
| GCP services | Test emulators, mock-cloud-storage | Firestore, Cloud Storage, Pub/Sub |
| Database | Test DB | Use real test database, not mock repository |
| File system | memfs, temp files | File read/write operations |
| Time | vi.useFakeTimers | Date.now(), setTimeout |
| Environment | process.env mocks | Config values |

### The Pattern

```
[Test] → [Your Code] → [BOUNDARY] → [Mock]
                            ↑
                      ONLY mock HERE

WRONG:  [Test] → vi.mock(axios) → [Code]     // Knows about axios
WRONG:  [Test] → vi.mock(service) → [Code]   // Knows about internal structure
CORRECT: [Test] → [Code] → [HTTP] → [MSW]    // Only knows HTTP contract
```

The test calls real code. The code makes real HTTP calls. MSW intercepts at the HTTP layer and returns mock responses. The test verifies final output.

## Dependency Injection for Testability

**DI is HOW you achieve decoupled tests** - inject dependencies at boundaries, tests stay ignorant of internals.

### Why DI Enables Decoupled Tests

```typescript
// WITHOUT DI - Test coupled to internal logic
class UserService {
  async getUser(id: string) {
    const url = process.env.API_URL;  // Test needs to know env var name!
    return axios.get(`${url}/users/${id}`);  // Test needs to mock axios!
  }
}
// If you rename API_URL → BASE_URL, test breaks - WRONG

// WITH DI - Test decoupled from internal logic
class UserService {
  constructor(
    private httpClient: HttpClient,
    private config: { baseUrl: string }
  ) {}
  
  async getUser(id: string) {
    return this.httpClient.get(`${this.config.baseUrl}/users/${id}`);
  }
}
// Rename env var? Test doesn't care. Change HTTP client? Test doesn't care.
```

### DI Patterns for Testing

```typescript
// Pattern 1: Constructor injection (preferred)
class OrderService {
  constructor(
    private httpClient: HttpClient,
    private cache: CacheInterface,
  ) {}
}

// Pattern 2: Factory with defaults (for simpler cases)
function createUserService(deps = defaultDeps) {
  return new UserService(deps.httpClient);
}

// Pattern 3: React Context (for frontend)
const ApiContext = createContext<ApiClient>(defaultClient);
function useApi() { return useContext(ApiContext); }
```

### Testing with DI

```typescript
// The SERVICE uses real code
const userService = new UserService(realHttpClient);

// MSW intercepts at HTTP boundary
server.use(
  http.get('/api/users/:id', () => HttpResponse.json(mockUser))
);

// Test validates INPUT → OUTPUT
const result = await userService.getUser('123');
expect(result.name).toBe('Test User');
```

**Key insight**: DI decouples tests from internal logic. Change env var names, config keys, libraries - tests don't break because they don't know about those details.

## HTTP Interception (REQUIRED)

### Frontend: MSW (Mock Service Worker)

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '123', ...body }, { status: 201 });
  }),

  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'User 1' },
      { id: '2', name: 'User 2' },
    ]);
  }),
];
```

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Backend: nock

```typescript
// For Node.js backend tests
import nock from 'nock';

beforeEach(() => {
  nock('https://api.external-service.com')
    .get('/data')
    .reply(200, { items: mockItems });
});

afterEach(() => {
  nock.cleanAll();
});
```

## I/O Test Examples

### CORRECT: Test calls real code, HTTP is intercepted

```typescript
// Good - I/O based test
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('UserProfile', () => {
  it('should display user data from API', async () => {
    // Setup: MSW intercepts the HTTP call
    server.use(
      http.get('/api/users/123', () => {
        return HttpResponse.json({ id: '123', name: 'John Doe' });
      })
    );

    // Act: Render component (it makes REAL HTTP call, intercepted by MSW)
    render(<UserProfile userId="123" />);

    // Assert: Verify the OUTPUT
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should show error when API fails', async () => {
    server.use(
      http.get('/api/users/123', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
```

### WRONG: Mocking Internal Functions or Libraries

```typescript
// BAD - Mocking HTTP client library
vi.mock('axios');  // Test now KNOWS you use axios
vi.mock('node-fetch');  // Test now KNOWS you use fetch

// BAD - Mocking internal service
vi.mock('../services/userService', () => ({
  userService: {
    getUser: vi.fn().mockResolvedValue({ id: '123', name: 'John Doe' }),
  },
}));

// BAD - Mocking internal utilities
vi.mock('../utils/apiClient');
vi.mock('../repositories/userRepository');
```

**Why this is wrong:**
- Test BREAKS if you replace axios with fetch (fails Library Swap Test)
- Test BREAKS if you rename/restructure userService
- Test has knowledge of internal implementation details
- You can't refactor freely - tests block you

## When to Use Each Approach

| Scenario | Approach | Tool |
|----------|----------|------|
| Component fetching data | HTTP Interception | MSW |
| Service calling external API | HTTP Interception | MSW/nock |
| Hook with API calls | HTTP Interception | MSW |
| Pure utility function (no I/O) | Direct unit test | vitest |
| Redux/state logic | State snapshot testing | vitest |

## Test Structure

### Behavior-Driven Test Organization
```typescript
describe('ComponentName', () => {
  describe('when initialized', () => {
    it('should render with default props', () => {});
    it('should display the correct title', () => {});
  });

  describe('when user interacts', () => {
    it('should call onSubmit when form is submitted', () => {});
    it('should show validation error for invalid input', () => {});
  });

  describe('when loading data', () => {
    it('should show loading state', () => {});
    it('should display error message on failure', () => {});
  });
});
```

## Testing Patterns

### Testing React Components
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### Testing Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('should fetch data', async () => {
  const { result } = renderHook(() => useDataItems(filters), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toHaveLength(5);
});
```

### Testing with Dependency Injection
```typescript
const mockService = {
  getAll: vi.fn().mockResolvedValue(mockData),
  getById: vi.fn(),
};

render(
  <DependencyProvider overrides={{ dataService: mockService }}>
    <ComponentUnderTest />
  </DependencyProvider>
);
```

## Analytics Testing

### Structure for Analytics Events
```typescript
describe('Analytics', () => {
  let mockTrack: Mock;

  beforeEach(() => {
    mockTrack = vi.fn();
    vi.mocked(useAnalytics).mockReturnValue({ track: mockTrack });
  });

  it('should track page view on mount', () => {
    render(<Dashboard />);

    expect(mockTrack).toHaveBeenCalledWith('dashboard_viewed', {
      source: 'navigation',
    });
  });

  it('should track button click with correct properties', async () => {
    render(<ActionButton itemId="123" />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockTrack).toHaveBeenCalledWith('action_clicked', {
      itemId: '123',
      timestamp: expect.any(Number),
    });
  });
});
```

## Mocking Patterns

### PREFERRED: HTTP Interception (MSW)
```typescript
// Define handlers for your API endpoints
server.use(
  http.get('/api/data', () => {
    return HttpResponse.json(mockData);
  }),
  http.get('/api/data/:id', ({ params }) => {
    return HttpResponse.json(mockData.find(d => d.id === params.id));
  }),
  http.post('/api/data', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'new-id', ...body }, { status: 201 });
  })
);
```

### FORBIDDEN: Direct Service/Library Mocking

These are **examples** - the principle applies to ANY internal implementation:

```typescript
// FORBIDDEN - Mocking HTTP libraries (ANY of them)
vi.mock('axios');                    // or fetch, got, ky, superagent...
vi.mock('node-fetch');               // If you switch libraries, tests break

// FORBIDDEN - Mocking cloud SDKs (bypasses the service boundary)
vi.mock('aws-sdk');                  // Use @aws-sdk/client-mock instead
vi.mock('@aws-sdk/client-s3');       // Use @aws-sdk/client-mock instead
vi.mock('@google-cloud/storage');    // Use GCP emulators or mock-cloud-storage

// FORBIDDEN - Mocking ORM/database clients
vi.mock('prisma');                   // or typeorm, sequelize, knex...
vi.mock('@prisma/client');

// FORBIDDEN - Mocking internal services/repositories
vi.mock('../services/dataService');  // Coupled to internal structure
vi.mock('../repositories/userRepo'); // Coupled to data layer

// FORBIDDEN - Mocking caching/queue libraries
vi.mock('redis');                    // or ioredis, memcached...
vi.mock('bull');                     // or agenda, bee-queue...

// FORBIDDEN - Spying on library methods
vi.spyOn(axios, 'get');              // Test knows implementation details
vi.spyOn(prisma.user, 'findMany');   // Test knows ORM details
```

**The principle**: Mock at BOUNDARIES (HTTP, DB connection, file system), not at libraries or internal code.

**The fix**: 
- HTTP → MSW/nock intercepts requests
- Database → Use test database (Docker, SQLite)
- File system → Use temp files or memfs
- Time → vi.useFakeTimers()

### Mocking React Query
```typescript
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### Mocking Context
```typescript
const mockContextValue = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
};

render(
  <AuthContext.Provider value={mockContextValue}>
    <ComponentUnderTest />
  </AuthContext.Provider>
);
```

## Go Beyond Basic Render Tests

Testing components goes beyond just ensuring they render without error. Write tests that validate behavior, user interaction, and response to prop changes.

```typescript
// Bad - only tests that component renders
it('renders without error', () => {
  render(<MyComponent />);
});

// Good - tests actual behavior
it('displays success message when form is submitted', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText('Form submitted successfully')).toBeVisible();
});
```

## Best Practices

### DO (Boundary Testing)
- **Apply the Library Swap Test**: Would test pass if you swapped axios for fetch?
- **Mock at HTTP boundary only** (MSW/nock) - not at service/function level
- Test INPUT → OUTPUT contracts, not internal implementation
- Write tests that survive internal refactoring
- Use semantic queries (getByRole, getByLabelText)
- Test user interactions with userEvent
- Test error states with HTTP error responses
- Test analytics events to prevent regression

### DON'T (Forbidden Patterns)
- **NEVER vi.mock('axios')** - couples test to HTTP client choice
- **NEVER vi.mock('fetch')** - same problem
- **NEVER vi.mock('../services/...')** - couples test to internal structure
- **NEVER vi.mock('../repositories/...')** - bypasses real data layer
- **NEVER vi.spyOn(axios, 'get')** - test knows about implementation
- Test implementation details or internal function signatures
- Write tests that break when you refactor (but I/O stays same)
- Use getByTestId when semantic queries work
- Ignore async operations (use waitFor)
- Write only basic render tests

## Assertions
```typescript
// Presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// State
expect(button).toBeDisabled();
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();

// Visibility
expect(element).toBeVisible();
expect(element).toHaveClass('active');

// Text
expect(element).toHaveTextContent('Expected text');

// Calls
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
```
