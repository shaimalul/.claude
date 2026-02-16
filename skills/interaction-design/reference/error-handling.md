# Error State Patterns

## Table of Contents

- [Inline Field Errors](#inline-field-errors)
- [Page-Level Errors](#page-level-errors)
- [Empty States](#empty-states)
- [Retry Patterns](#retry-patterns)

---

## Inline Field Errors

```tsx
const FormField: React.FC<{
  id: string;
  label: string;
  error?: string;
}> = ({ id, label, error, ...inputProps }) => (
  <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...inputProps}
    />
    {error && (
      <span id={`${id}-error`} role="alert" className="field-error">
        {error}
      </span>
    )}
  </div>
);
```

## Page-Level Errors

```tsx
const PageError: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => (
  <div role="alert" className="page-error">
    <ErrorIcon aria-hidden="true" className="error-icon" />
    <h1>{title}</h1>
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry}>Try again</button>
    )}
  </div>
);
```

## Empty States

```tsx
const EmptyState: React.FC<{
  icon?: React.ComponentType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state" role="status">
    {Icon && <Icon aria-hidden="true" className="empty-icon" />}
    <h3>{title}</h3>
    <p>{description}</p>
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
);

// Usage examples
<EmptyState
  icon={SearchIcon}
  title="No results found"
  description="Try adjusting your search or filters."
  action={{ label: 'Clear filters', onClick: handleClear }}
/>

<EmptyState
  icon={InboxIcon}
  title="No messages yet"
  description="When you receive messages, they'll appear here."
/>
```

## Retry Patterns

### Automatic Retry

```tsx
// With React Query - automatic retry
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### Manual Retry

```tsx
const RetryError: React.FC<{
  error: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div role="alert" className="error-with-retry">
    <p>Failed to load: {error.message}</p>
    <button onClick={onRetry}>
      <RefreshIcon aria-hidden="true" />
      Try again
    </button>
  </div>
);
```
