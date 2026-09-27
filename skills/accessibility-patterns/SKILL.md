---
name: accessibility-patterns
description: WCAG 2.1 AA accessibility patterns including semantic HTML, ARIA, keyboard navigation, and focus management. Use when implementing accessible UI components, adding ARIA attributes, keyboard navigation, or reviewing for WCAG 2.1 AA compliance.
globs: "**/*.tsx,**/*.jsx"
user-invocable: false
---

# Accessibility Patterns

Apply these patterns for WCAG 2.1 AA compliance.

## WCAG 2.1 AA Quick Reference

### Perceivable
- Text alternatives for non-text content (images, icons)
- Captions for video/audio content
- Content adaptable and distinguishable
- Color contrast: 4.5:1 normal text, 3:1 large text

### Operable
- All functionality available via keyboard
- Users have enough time to read content
- No content causes seizures (no flashing > 3x/sec)
- Navigation is clear and consistent

### Understandable
- Text is readable and understandable
- Web pages appear and operate predictably
- Users are helped to avoid and correct mistakes

### Robust
- Content compatible with current and future assistive technologies
- Valid HTML markup
- Correct ARIA usage

## Semantic HTML

```tsx
// Bad - div soup
<div class="header">
  <div class="nav">
    <div class="nav-item" onclick={goHome}>Home</div>
  </div>
</div>
<div class="main-content">...</div>

// Good - semantic elements
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>...</main>
```

### Landmark Elements

| Element | ARIA Role | Purpose |
|---------|-----------|---------|
| `<header>` | banner | Page header (once per page) |
| `<nav>` | navigation | Navigation links |
| `<main>` | main | Main content (once per page) |
| `<aside>` | complementary | Related but separate content |
| `<footer>` | contentinfo | Page footer |
| `<section>` | region | When has accessible name |

### Buttons vs Links

```tsx
// Use <a> for navigation
<a href="/dashboard">Go to Dashboard</a>

// Use <button> for actions
<button type="button" onClick={handleSave}>Save</button>
<button type="submit">Submit Form</button>

// Never use div/span for clickable elements
// Bad
<div onClick={handleClick} className="fake-button">Click me</div>
```

## ARIA Roles

### When to Use ARIA Roles

**First rule of ARIA**: Don't use ARIA if semantic HTML can do the job.

```tsx
// Unnecessary - button already has role="button"
<button role="button">Click</button>

// Necessary - custom widget needs role
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
```

### Widget Roles

```tsx
// Tab panel
<div role="tablist" aria-label="Settings sections">
  <button role="tab" aria-selected={activeTab === 0} aria-controls="panel-0">
    General
  </button>
  <button role="tab" aria-selected={activeTab === 1} aria-controls="panel-1">
    Security
  </button>
</div>
<div role="tabpanel" id="panel-0" aria-labelledby="tab-0">
  {/* content */}
</div>

// Menu
<button aria-haspopup="menu" aria-expanded={isOpen}>Options</button>
<ul role="menu">
  <li role="menuitem">Edit</li>
  <li role="menuitem">Delete</li>
</ul>
```

## ARIA States, Labels, and Live Regions

See [aria.md](aria.md) when a component needs `aria-expanded`, `aria-selected`, `aria-current`, `aria-hidden`, `aria-disabled`, an accessible name (`aria-label`, `aria-labelledby`, `aria-describedby`), Label in Name (WCAG 2.5.3), or a live region (`aria-live`, `role="alert"`, `role="status"`).

## Keyboard Navigation

### Required Keys

| Element | Keys | Action |
|---------|------|--------|
| All interactive | Tab / Shift+Tab | Move focus |
| Button, Link | Enter | Activate |
| Button | Space | Activate |
| Checkbox | Space | Toggle |
| Menu, Listbox | Arrow keys | Navigate options |
| Dialog | Escape | Close |
| Tabs | Arrow Left/Right | Switch tabs |

### Roving Tabindex

```tsx
// Only one item in group has tabindex="0"
// Others have tabindex="-1"
// Arrow keys move tabindex="0" between items

<div role="tablist">
  <button role="tab" tabIndex={activeTab === 0 ? 0 : -1}>Tab 1</button>
  <button role="tab" tabIndex={activeTab === 1 ? 0 : -1}>Tab 2</button>
  <button role="tab" tabIndex={activeTab === 2 ? 0 : -1}>Tab 3</button>
</div>
```

## Icon-Only Interactive Elements

Icon-only buttons, tabs, and links must always have an accessible name via `aria-label`.

```tsx
// Bad - contradictory condition (iconOnly means label is falsy)
const iconOnly = !label;
// iconOnly && label is ALWAYS false - aria-label never applied
{iconOnly && label && <span aria-label={label} />}

// Bad - aria-label derived from the missing label
<button aria-label={label}>{icon}</button> // label is undefined in icon-only mode

// Good - require explicit aria-label prop for icon-only mode
interface Props {
  label?: string;
  icon?: ReactNode;
  'aria-label'?: string; // Required when label is omitted
}

const accessibleName = label || ariaLabel;
if (!accessibleName) {
  console.warn('Icon-only element missing accessible name');
}
<button aria-label={!label ? ariaLabel : undefined}>{icon}</button>
```

When to apply: Any component that can render without visible text (icon-only buttons, icon tabs, icon links).

## Focus Management

### Visible Focus Styles

```scss
// Always provide visible focus
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

// Remove default only if providing alternative
button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-focus);
}
```

### Focus Trap

Modal must trap focus - users can't Tab outside:

```tsx
const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
};
```

### Focus Restoration

```tsx
// After closing modal, return focus to trigger element
const previousFocus = useRef<HTMLElement | null>(null);

const openModal = (triggerElement: HTMLElement) => {
  previousFocus.current = triggerElement;
  setIsOpen(true);
};

const closeModal = () => {
  setIsOpen(false);
  previousFocus.current?.focus();
};
```

## Skip Links

```tsx
// First focusable element on page
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Images & Media

### Informative Images

```tsx
// Describe what the image conveys
<img src="chart.png" alt="Sales increased 25% in Q4 2023" />
```

### Decorative Images

```tsx
// Empty alt for purely decorative images
<img src="decorative-border.png" alt="" />

// Or use CSS background-image
.card {
  background-image: url('pattern.png');
}
```

### Complex Images

```tsx
// Link to full description
<figure>
  <img
    src="complex-chart.png"
    alt="Quarterly revenue comparison"
    aria-describedby="chart-desc"
  />
  <figcaption id="chart-desc">
    Full description: Q1 showed $1.2M revenue...
  </figcaption>
</figure>
```

## Accessible Forms

```tsx
// Complete accessible form field pattern
<div className="form-field">
  <label htmlFor="email">
    Email address
    <span aria-hidden="true"> *</span>
  </label>

  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={`email-hint ${error ? 'email-error' : ''}`}
  />

  <span id="email-hint" className="hint">
    We'll never share your email
  </span>

  {error && (
    <span id="email-error" role="alert" className="error">
      {error}
    </span>
  )}
</div>
```

## Color & Contrast

### Minimum Ratios

- **4.5:1** - Normal text (under 18pt / 24px)
- **3:1** - Large text (18pt+ / 24px+ or 14pt+ bold)
- **3:1** - UI components and graphical objects

### Don't Rely on Color Alone

```tsx
// Bad - color only
<span className={isValid ? 'green' : 'red'}>Status</span>

// Good - color + icon + text
<span className={isValid ? 'success' : 'error'}>
  {isValid ? <CheckIcon /> : <XIcon />}
  {isValid ? 'Valid' : 'Invalid'}
</span>
```

## aria-label Suppresses All Child Content on Links

When `aria-label` is placed on a link (`<a>`) that wraps rich content (status badges, counts, tags, dates), the label completely overrides all child content. Screen readers announce only the `aria-label` value and skip everything inside the link.

```tsx
// Bad - aria-label suppresses status, count, date inside link
<a href={url} aria-label={metadata.title}>
  <StatusBadge status={metadata.status} />
  <span>{metadata.interactionsCount} interactions</span>
  <span>{formattedDate}</span>
</a>

// Good - remove aria-label and let visible text content be announced naturally
<a href={url}>
  <StatusBadge status={metadata.status} />
  <span>{metadata.interactionsCount} interactions</span>
  <span>{formattedDate}</span>
</a>

// Good - if you must use aria-label, compose a full description
<a href={url} aria-label={`${metadata.title}, ${metadata.status}, ${metadata.interactionsCount} interactions`}>
  ...
</a>
```

**When to apply:** Any `<a>` or `<button>` that wraps multiple pieces of meaningful content (status, count, date, type tag). Only use `aria-label` on links if they contain only decorative/icon content with no visible text.

## Empty States Must Have `role="status"`

When a section accordion or container renders an empty state (no items), wrap it in `role="status"` so screen readers announce the absence of content when the section is expanded.

```tsx
// Bad - empty div gives no programmatic feedback
{items.length === 0 && (
  <div className={styles.emptyState}>
    <p>No items found</p>
  </div>
)}

// Good - role="status" announces to screen readers
{items.length === 0 && (
  <div role="status" className={styles.emptyState}>
    <p>No items found</p>
  </div>
)}
```

**When to apply:** Any conditional empty state inside an accordion, tab panel, or dynamic section. `role="status"` is equivalent to `aria-live="polite"` and announces the content without interrupting the user.

## Reduced Motion at the Token Level

`prefers-reduced-motion: reduce` should suppress position, scale, and translate animations — NOT all transitions. Color, border, and opacity transitions provide essential interactive feedback (hover, focus, selection) and remain expected even with reduced-motion enabled. Zeroing global motion-duration tokens kills both, leaving the UI feeling broken.

```css
/* Bad - zeros every transition that uses these tokens, including hover/focus colour changes */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-medium: 0ms;
    --motion-duration-slow: 0ms;
  }
}

/* Good - keep state-transition durations; suppress motion only on the components that animate position/scale */
@media (prefers-reduced-motion: reduce) {
  .modal,
  .drawer,
  .toast {
    transition: none;
    animation: none;
  }

  .card:hover {
    transform: none;
  }
}
```

**When to apply:** Any time you define motion-duration / transition-duration design tokens at the `:root` level. Override per-component for animations that move or scale; leave color/border/opacity transitions intact so hover, focus, and selected states still animate.

## Checklist

- [ ] All images have appropriate alt text (informative or empty)
- [ ] Color contrast meets 4.5:1 for normal text, 3:1 for large text
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicator is visible on all focusable elements
- [ ] Form fields have associated labels
- [ ] Error messages are linked to fields with aria-describedby
- [ ] Page has proper heading hierarchy (h1 > h2 > h3)
- [ ] Landmark regions are defined (header, nav, main, footer)
- [ ] Dynamic content changes use aria-live regions
- [ ] Modals trap focus and restore on close
- [ ] Skip link provided for keyboard users
- [ ] No content flashes more than 3 times per second
