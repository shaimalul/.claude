# Loading State Patterns

## Table of Contents

- [Skeleton Loader](#skeleton-loader)
- [Button Loading State](#button-loading-state)
- [Optimistic Updates](#optimistic-updates)

---

## Skeleton Loader

```tsx
const CardSkeleton: React.FC = () => (
  <div className="card skeleton" aria-busy="true" aria-label="Loading">
    <div className="skeleton-image" />
    <div className="skeleton-title" />
    <div className="skeleton-text" />
  </div>
);

// CSS
.skeleton {
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .skeleton-image,
  .skeleton-title,
  .skeleton-text {
    background: linear-gradient(
      90deg,
      var(--gray-200) 25%,
      var(--gray-100) 50%,
      var(--gray-200) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}
```

## Button Loading State

```tsx
const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>> = ({
  isLoading,
  children,
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    aria-busy={isLoading}
    className={classNames('btn', { 'btn-loading': isLoading })}
  >
    {isLoading && <Spinner className="btn-spinner" aria-hidden="true" />}
    <span className={isLoading ? 'sr-only' : undefined}>{children}</span>
    {isLoading && <span aria-live="polite">Loading...</span>}
  </button>
);
```

## Optimistic Updates

```tsx
const useOptimisticMutation = <T,>(
  mutationFn: (data: T) => Promise<T>,
  optimisticUpdate: (data: T) => void,
  rollback: (data: T) => void
) => {
  const mutate = async (data: T) => {
    // Apply optimistic update immediately
    optimisticUpdate(data);

    try {
      await mutationFn(data);
    } catch (error) {
      // Rollback on failure
      rollback(data);
      throw error;
    }
  };

  return { mutate };
};

// With React Query
const { mutate } = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['items'] });
    const previousItems = queryClient.getQueryData(['items']);
    queryClient.setQueryData(['items'], (old) => [...old, newItem]);
    return { previousItems };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['items'], context.previousItems);
  },
});
```
