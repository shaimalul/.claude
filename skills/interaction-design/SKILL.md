---
name: interaction-design
description: UI interaction patterns for modals, forms, loading states, error handling, and notifications
globs: "**/*.tsx,**/*.jsx"
---

# Interaction Design Patterns

Apply these patterns for consistent, accessible user interactions.

## Modal/Dialog Patterns

### Requirements

- Focus trap - Tab cycles within modal only
- Escape key closes modal
- Click outside (backdrop) closes modal
- Focus restoration - Return focus to trigger element
- `aria-modal="true"` and `role="dialog"`
- Accessible close button with aria-label

### Implementation

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog">
            <CloseIcon aria-hidden="true" />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
};
```

## Confirmation Dialogs

### Destructive Actions

```tsx
const ConfirmDeleteDialog: React.FC<{
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, itemName, onConfirm, onCancel }) => (
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-desc"
  >
    <h2 id="confirm-title">Delete {itemName}?</h2>
    <p id="confirm-desc">
      This action cannot be undone. All associated data will be permanently removed.
    </p>
    <footer>
      {/* Cancel first, focused by default for destructive actions */}
      <button onClick={onCancel} autoFocus>Cancel</button>
      <button onClick={onConfirm} className="btn-destructive">
        Delete
      </button>
    </footer>
  </div>
);
```

**Guidelines:**
- Use `role="alertdialog"` for confirmations
- Focus Cancel button by default for destructive actions
- Make consequences clear in description
- Use destructive styling for dangerous actions

## Form UX Patterns

### Validation Timing

| Event | Validate |
|-------|----------|
| Initial render | Never show errors |
| On change (while typing) | Only if already has error (clear error as user fixes) |
| On blur | Required fields, format validation |
| On submit | All fields |

### Implementation

```tsx
const useFormField = <T extends string>(
  validate: (value: T) => string | null
) => {
  const [value, setValue] = useState<T>('' as T);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: T) => {
    setValue(newValue);
    // Clear error while typing if user is fixing it
    if (error && touched) {
      setError(validate(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(value));
  };

  return {
    value,
    error: touched ? error : null,
    onChange: handleChange,
    onBlur: handleBlur,
    reset: () => {
      setValue('' as T);
      setError(null);
      setTouched(false);
    },
  };
};
```

### Submit Button States

```tsx
type SubmitState = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

const SubmitButton: React.FC<{
  state: SubmitState;
  isValid: boolean;
}> = ({ state, isValid }) => {
  const isDisabled = !isValid || state === 'submitting' || state === 'validating';

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={state === 'submitting'}
    >
      {state === 'submitting' && <Spinner aria-hidden="true" />}
      {state === 'submitting' ? 'Submitting...' : 'Submit'}
    </button>
  );
};
```

## Multi-Step Forms

### Stepper Component

```tsx
interface Step {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

const Stepper: React.FC<{ steps: Step[] }> = ({ steps }) => (
  <nav aria-label="Form progress">
    <ol className="stepper">
      {steps.map((step, index) => (
        <li
          key={step.id}
          aria-current={step.status === 'current' ? 'step' : undefined}
          className={`step step-${step.status}`}
        >
          <span className="step-number" aria-hidden="true">
            {step.status === 'complete' ? <CheckIcon /> : index + 1}
          </span>
          <span className="step-label">{step.label}</span>
          <span className="sr-only">
            {step.status === 'complete' ? '(completed)' : ''}
            {step.status === 'current' ? '(current step)' : ''}
          </span>
        </li>
      ))}
    </ol>
  </nav>
);
```

**Guidelines:**
- Show progress clearly
- Allow going back to previous steps
- Save drafts between steps when possible
- Validate each step before proceeding

## Loading States

### When to Use Each Pattern

| Pattern | Use When |
|---------|----------|
| Skeleton | Content structure is known |
| Spinner | Content structure is unknown |
| Progress bar | Operation has known progress |
| Inline loading | Small component update |

### Skeleton Loader

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

### Button Loading State

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

## Error States

### Inline Field Errors

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

### Page-Level Errors

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

### Empty States

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

## Toast Notifications

### Types and Timing

| Type | Icon | Duration | Dismissible |
|------|------|----------|-------------|
| Success | Check | 5s auto | Optional |
| Error | X | Persistent | Required |
| Warning | Alert | 8s auto | Optional |
| Info | Info | 5s auto | Optional |

### Implementation

```tsx
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
  <div
    className="toast-container"
    aria-live="polite"
    aria-label="Notifications"
  >
    {toasts.map((toast) => (
      <Toast key={toast.id} {...toast} />
    ))}
  </div>
);

const Toast: React.FC<Toast & { onDismiss: (id: string) => void }> = ({
  id,
  type,
  message,
  onDismiss,
}) => (
  <div
    role={type === 'error' ? 'alert' : 'status'}
    className={`toast toast-${type}`}
  >
    <ToastIcon type={type} aria-hidden="true" />
    <span>{message}</span>
    <button
      onClick={() => onDismiss(id)}
      aria-label="Dismiss notification"
      className="toast-dismiss"
    >
      <CloseIcon aria-hidden="true" />
    </button>
  </div>
);
```

## Confirmation Feedback

### Success with Undo

```tsx
const UndoableSuccess: React.FC<{
  message: string;
  onUndo: () => void;
  undoTimeout?: number;
}> = ({ message, onUndo, undoTimeout = 5000 }) => {
  const [timeLeft, setTimeLeft] = useState(undoTimeout / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div role="status" className="toast toast-success">
      <CheckIcon aria-hidden="true" />
      <span>{message}</span>
      <button onClick={onUndo}>
        Undo ({timeLeft}s)
      </button>
    </div>
  );
};
```

## Drawer/Side Panel

```tsx
const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, position = 'right', children }) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={classNames('drawer', `drawer-${position}`, { open: isOpen })}
      >
        <header className="drawer-header">
          <h2 id={titleId}>{title}</h2>
          <button onClick={onClose} aria-label="Close panel">
            <CloseIcon aria-hidden="true" />
          </button>
        </header>
        <div className="drawer-content">{children}</div>
      </aside>
    </>
  );
};
```

## Dropdown Menus

### Keyboard Support

| Key | Action |
|-----|--------|
| Enter / Space | Open menu, select item |
| Arrow Down | Move to next item |
| Arrow Up | Move to previous item |
| Home | Move to first item |
| End | Move to last item |
| Escape | Close menu |
| Type character | Jump to matching item |

### Implementation

```tsx
const DropdownMenu: React.FC<{
  trigger: React.ReactNode;
  items: { id: string; label: string; onClick: () => void }[];
}> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        items[activeIndex].onClick();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="dropdown">
      <button
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>
      {isOpen && (
        <ul
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Checklist

- [ ] Modals trap focus and restore focus on close
- [ ] Forms validate on appropriate events (blur, submit)
- [ ] Loading states are accessible (aria-busy, aria-live)
- [ ] Errors are clearly communicated with role="alert"
- [ ] Success feedback is provided after actions
- [ ] Destructive actions require confirmation
- [ ] Toasts auto-dismiss appropriately or are dismissible
- [ ] Empty states guide users to take action
- [ ] Dropdowns support full keyboard navigation
- [ ] All interactive elements work with Enter/Space
