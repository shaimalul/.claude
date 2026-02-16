# Notification Patterns

## Table of Contents

- [Toast Implementation](#toast-implementation)
- [Success with Undo](#success-with-undo)

---

## Toast Implementation

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

## Success with Undo

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
