---
name: testing-patterns
description: Testing conventions with I/O-based tests, HTTP interception, and behavior-driven patterns. Use when writing or reviewing test files. MANDATORY - all tests must use HTTP interception (MSW/nock), not internal function mocks.
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Testing Conventions

## CORE PRINCIPLE: I/O-Based Testing (Black-Box)

**MANDATORY**: Tests must be I/O-based (Input/Output). Mock at the HTTP boundary, NOT internal functions.

### Why I/O-Based Testing?

- **Tests survive refactoring**: Internal implementation can change without breaking tests
- **Tests validate contracts**: If input/output stays the same, tests stay green
- **Tests are meaningful**: They test what users/consumers actually experience
- **No coupling to implementation**: Function internals can be rewritten freely

### The Pattern

```
[Test] → [Real Code] → [HTTP Request] → [MSW/nock Interceptor] → [Mock Response]
```

The test calls real code. The code makes real HTTP calls. An interceptor catches the request and returns a mock response. The test verifies the final output.

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

### WRONG: Mocking internal functions

```typescript
// BAD - Mocking internal service directly
vi.mock('../services/userService', () => ({
  userService: {
    getUser: vi.fn().mockResolvedValue({ id: '123', name: 'John Doe' }),
  },
}));

// This test will BREAK when you refactor userService internals
// Even if the API contract stays exactly the same!
```

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

### DEPRECATED: Direct Service Mocking
Avoid this pattern - it couples tests to implementation:
```typescript
// AVOID - breaks when you refactor service internals
vi.mock('../services/dataService', () => ({
  dataService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));
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

### Do
- **Use HTTP interception (MSW/nock)** for all API mocking
- Test I/O contracts (input → output), not internal implementation
- Use semantic queries (getByRole, getByLabelText)
- Test user interactions with userEvent
- Mock at the HTTP boundary, not at service/function level
- Write tests that survive internal refactoring
- Test error states and edge cases
- Test analytics events to prevent regression

### Don't
- **NEVER mock internal functions/services directly** (use HTTP interception instead)
- Test implementation details
- Use vi.mock() for services that make HTTP calls
- Write tests coupled to specific function signatures
- Use getByTestId when semantic queries work
- Write tests that break when you refactor (but I/O stays same)
- Ignore async operations (use waitFor)
- Write only basic render tests
- Use dynamic imports or require() inside test bodies

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
