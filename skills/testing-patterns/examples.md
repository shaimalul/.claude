# Testing Examples

Supporting reference for [SKILL.md](SKILL.md).

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
