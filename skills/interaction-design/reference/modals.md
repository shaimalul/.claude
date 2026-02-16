# Modal, Dialog, Drawer & Dropdown Patterns

## Table of Contents

- [Modal Implementation](#modal-implementation)
- [Confirmation Dialogs](#confirmation-dialogs)
- [Drawer / Side Panel](#drawer--side-panel)
- [Dropdown Menus](#dropdown-menus)

---

## Modal Implementation

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

Guidelines:
- Use `role="alertdialog"` for confirmations
- Focus Cancel button by default for destructive actions
- Make consequences clear in description
- Use destructive styling for dangerous actions

## Drawer / Side Panel

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
