---
name: testing-patterns
description: Boundary testing conventions - mock ONLY at system edges (HTTP, DB, file I/O), NEVER internal functions. Tests must pass the Library Swap Test.
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
user-invocable: false
---

# Testing Conventions

## Boundary Testing (Black-Box, Contract-Based)

Tests MUST be boundary tests. Mock ONLY at system boundaries, NEVER internal functions or libraries.

### The Library Swap Test

If you swap ANY internal library or restructure ANY internal code, your tests MUST still pass. If they break, your tests are coupled to implementation - rewrite them.

Examples that MUST pass without test changes:
- axios to fetch (HTTP client swap)
- Prisma to TypeORM (ORM swap)
- Redis to Memcached (cache swap)
- Refactor service internals (code restructure)

### What is a Boundary?

A boundary is where your code interacts with external systems:

| Boundary | Mock Tool | Example |
|----------|-----------|---------|
| HTTP requests | MSW, nock | API calls to backend or third-party |
| Database | Test DB | Use real test database, not mock repository |
| File system | memfs, temp files | File read/write operations |
| Time | vi.useFakeTimers | Date.now(), setTimeout |
| Environment | process.env mocks | Config values |

### Prefer a Local Substitute Over a Mock

When a boundary has a real local stand-in, use it instead of a mock. A stand-in runs the real code path; a mock only asserts you called something.

| Boundary | Local substitute | Fall back to a mock when |
|----------|------------------|--------------------------|
| Postgres | PGLite, testcontainers, a test DB | No container runtime available in CI |
| File system | memfs, a temp directory | Never, temp dirs always work |
| Redis | ioredis-mock, testcontainers | No container runtime available |
| Third-party HTTP API | MSW or nock at the HTTP boundary | This IS the fallback, there is no local Stripe |

Classify a dependency before choosing: in-process (no adapter needed), local-substitutable (use the stand-in), remote but owned (define a port, in-memory adapter in tests), or true external (intercept at HTTP). See `codebase-design` DEEPENING.md for the full categories.

### Designing for Mockability

At true-external boundaries, design interfaces that are easy to substitute.

Pass external dependencies in rather than constructing them internally:

```typescript
// Easy to substitute
function processPayment(order: Order, paymentClient: PaymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to substitute
function processPayment(order: Order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

Prefer SDK-style interfaces over one generic fetcher, so each operation is independently substitutable and no conditional logic is needed in test setup:

```typescript
// GOOD: each function returns one specific shape
const api = {
  getUser: (id: string) => fetch(`/users/${id}`),
  getOrders: (userId: string) => fetch(`/users/${userId}/orders`),
  createOrder: (data: OrderInput) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: substituting requires conditional logic inside the stand-in
const api = {
  fetch: (endpoint: string, options: RequestInit) => fetch(endpoint, options),
};
```

### The Pattern

```
[Test] -> [Your Code] -> [BOUNDARY] -> [Mock]
                              ^
                        ONLY mock HERE

WRONG:   [Test] -> vi.mock(axios) -> [Code]     // Knows about axios
WRONG:   [Test] -> vi.mock(service) -> [Code]   // Knows about internal structure
CORRECT: [Test] -> [Code] -> [HTTP] -> [MSW]    // Only knows HTTP contract
```

Test the WHAT (input to output), not the HOW (internal logic).

### What Should NOT Break Tests

```typescript
// These internal changes should NOT break tests:
// - Rename env var: process.env.API_URL -> process.env.BASE_URL
// - Change config key: config.timeout -> config.requestTimeout
// - Refactor internals: split function, rename variables
// - Change algorithm: different sorting, different caching strategy
// - Restructure code: move files, rename internal functions

// ONLY contract changes break tests:
// - API endpoint changes: GET /users -> GET /accounts
// - Response shape changes: { name } -> { fullName }
// - Public function signature changes
```

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

## Cloud Service Mocking

### AWS Services with @aws-sdk/client-mock

```typescript
import { mockClient } from '@aws-sdk/client-mock';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);

beforeEach(() => {
  s3Mock.reset();
  dynamoMock.reset();
  sqsMock.reset();
});

// S3 examples
s3Mock.on(GetObjectCommand).resolves({
  Body: sdkStreamMixin(Readable.from([Buffer.from('test content')])),
});

s3Mock.on(PutObjectCommand).resolves({
  ETag: '"abc123"',
});

// DynamoDB examples
dynamoMock.on(GetItemCommand).resolves({
  Item: { id: { S: '123' }, name: { S: 'Test' } },
});

// SQS examples
sqsMock.on(SendMessageCommand).resolves({
  MessageId: 'msg-123',
});
```

### GCP Services

Use official emulators or mock libraries:

```typescript
// Firestore: use @google-cloud/firestore with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Cloud Storage: use mock-cloud-storage
import { MockStorage } from 'mock-cloud-storage';
const storage = new MockStorage();

// Pub/Sub: use @google-cloud/pubsub with emulator
process.env.PUBSUB_EMULATOR_HOST = 'localhost:8085';
```

### Azure Services

Use official emulators where available:

```typescript
// Blob Storage: use Azurite emulator
process.env.AZURE_STORAGE_CONNECTION_STRING = 
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;...';

// Cosmos DB: use emulator
process.env.COSMOS_ENDPOINT = 'https://localhost:8081';
```

## Dependency Injection for Testability

DI is HOW you achieve decoupled tests - inject dependencies at boundaries, tests stay ignorant of internals.

```typescript
// Bad - Test coupled to internal logic
class UserService {
  async getUser(id: string) {
    const url = process.env.API_URL;  // Test needs to know env var name
    return axios.get(`${url}/users/${id}`);  // Test needs to mock axios
  }
}

// Good - Test decoupled from internal logic
class UserService {
  constructor(
    private httpClient: HttpClient,
    private config: { baseUrl: string }
  ) {}

  async getUser(id: string) {
    return this.httpClient.get(`${this.config.baseUrl}/users/${id}`);
  }
}
// Rename env var? Test does not care. Change HTTP client? Test does not care.
```

### DI Patterns

```typescript
// Pattern 1: Constructor injection (preferred)
class OrderService {
  constructor(
    private httpClient: HttpClient,
    private cache: CacheInterface,
  ) {}
}

// Pattern 2: Factory with defaults
function createUserService(deps = defaultDeps) {
  return new UserService(deps.httpClient);
}

// Pattern 3: React Context
const ApiContext = createContext<ApiClient>(defaultClient);
function useApi() { return useContext(ApiContext); }
```

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

### Testing Components with API Calls

```typescript
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('UserProfile', () => {
  it('should display user data from API', async () => {
    server.use(
      http.get('/api/users/123', () => {
        return HttpResponse.json({ id: '123', name: 'John Doe' });
      })
    );

    render(<UserProfile userId="123" />);

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
render(
  <DependencyProvider overrides={{ dataService: mockService }}>
    <ComponentUnderTest />
  </DependencyProvider>
);
```

## Analytics Testing

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

### FORBIDDEN: Direct Service/Library Mocking

These patterns are blockers - they MUST be rewritten. See `/review-test` for full audit.

| Code | Anti-Pattern | Fix |
|------|-------------|-----|
| B1 | Library mocking (`vi.mock('axios')`) | Use MSW/nock at HTTP boundary |
| B2 | Internal service mocking (`vi.mock('../services/...')`) | Let real code execute, mock at boundaries |
| B3 | Implementation assertions (`vi.spyOn(axios, 'get')`) | Assert on outputs, not internal calls |
| B4 | Third-party internals (`expect(prisma.user.findMany).toHaveBeenCalled()`) | Test observable output |

```typescript
// B1 - FORBIDDEN - Mocking HTTP libraries
vi.mock('axios');                    // or fetch, got, ky, superagent
vi.mock('node-fetch');               // If you switch libraries, tests break
vi.mock('aws-sdk');                  // Use @aws-sdk/client-mock instead
vi.mock('@aws-sdk/client-s3');       // Use @aws-sdk/client-mock instead

// B2 - FORBIDDEN - Mocking internal services/repositories
vi.mock('../services/dataService');  // Coupled to internal structure
vi.mock('../repositories/userRepo'); // Coupled to data layer

// B1 - FORBIDDEN - Mocking ORM/database clients
vi.mock('prisma');                   // or typeorm, sequelize, knex
vi.mock('@prisma/client');

// B1 - FORBIDDEN - Mocking caching/queue libraries
vi.mock('redis');                    // or ioredis, memcached
vi.mock('bull');                     // or agenda, bee-queue

// B3 - FORBIDDEN - Spying on library methods
vi.spyOn(axios, 'get');              // Test knows implementation details
vi.spyOn(prisma.user, 'findMany');   // Test knows ORM details
```

The fix for each boundary:
- HTTP: MSW/nock intercepts requests
- Database: Use test database (Docker, SQLite)
- File system: Use temp files or memfs
- Time: vi.useFakeTimers()

## Go Beyond Basic Render Tests

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

## When to Use Each Approach

| Scenario | Approach | Tool |
|----------|----------|------|
| Component fetching data | HTTP Interception | MSW |
| Service calling external API | HTTP Interception | MSW/nock |
| Hook with API calls | HTTP Interception | MSW |
| Pure utility function (no I/O) | Direct unit test | vitest |
| Redux/state logic | State snapshot testing | vitest |

## Quick Reference

### DO (Boundary Testing)

- Apply the Library Swap Test: would test pass if you swapped axios for fetch?
- Mock at HTTP boundary only (MSW/nock) - not at service/function level
- Test INPUT to OUTPUT contracts, not internal implementation
- Write tests that survive internal refactoring
- Use semantic queries (getByRole, getByLabelText)
- Test user interactions with userEvent
- Test error states with HTTP error responses
- Test analytics events to prevent regression

### NEVER (Forbidden Patterns)

- NEVER `vi.mock('axios')` - couples test to HTTP client choice
- NEVER `vi.mock('fetch')` - same problem
- NEVER `vi.mock('../services/...')` - couples test to internal structure
- NEVER `vi.mock('../repositories/...')` - bypasses real data layer
- NEVER `vi.spyOn(axios, 'get')` - test knows about implementation
- NEVER test implementation details or internal function signatures
- NEVER write tests that break when you refactor (but I/O stays same)
- NEVER use getByTestId when semantic queries work
- NEVER ignore async operations (use waitFor)
- NEVER write only basic render tests

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

## Test Quality Checklist

Before submitting tests, verify:

- [ ] Library Swap Test: Would test pass if you swapped ANY internal library?
- [ ] Uses MSW/nock for HTTP (NEVER vi.mock on axios/fetch)
- [ ] Uses @aws-sdk/client-mock for AWS (NEVER vi.mock on SDK)
- [ ] No mocking of internal services, repositories, or utilities
- [ ] Asserts on outputs/UI, not internal function calls
- [ ] Error scenarios use boundary-level errors (HTTP 4xx/5xx)
- [ ] Uses semantic queries (getByRole, getByLabelText) not getByTestId
- [ ] Tests user interactions with userEvent
- [ ] Each test is independent (no shared mutable state)

## Related Skills

| Skill | Purpose |
|-------|---------|
| `/plan-test` | Interactive test planning - design edge cases before writing tests |
| `/review-test` | Audit tests for anti-patterns (B1-B4, N1-N5, S1-S3) |
| `tdd` | RED-GREEN-REFACTOR loop, what a good test is, seams |
| `codebase-design` | The seam definition and dependency categories |

Run `/plan-test [file]` before writing tests. Run `/review-test [file]` after to audit quality.
