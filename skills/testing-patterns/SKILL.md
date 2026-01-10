---
name: testing-patterns
description: Testing conventions with behavior-driven tests, analytics tracking, and proper mocking
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Testing Conventions

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

### Mocking API Services
```typescript
vi.mock('../services/dataService', () => ({
  dataService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(dataService.getAll).mockResolvedValue(mockData);
});
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

## Best Practices

### Do
- Test behavior, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Test user interactions with userEvent
- Mock at service boundaries
- Use beforeEach for common setup
- Test error states and edge cases

### Don't
- Test implementation details
- Use getByTestId when semantic queries work
- Mock internal hooks/utilities
- Write tests that pass when code is broken
- Ignore async operations (use waitFor)

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
