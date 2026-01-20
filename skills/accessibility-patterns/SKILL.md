---
name: accessibility-patterns
description: WCAG 2.1 AA accessibility patterns including semantic HTML, ARIA, keyboard navigation, and focus management
globs: "**/*.tsx,**/*.jsx"
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

## ARIA States & Properties

### aria-expanded

```tsx
// Accordion or collapsible section
<button
  aria-expanded={isOpen}
  aria-controls="details-content"
  onClick={toggle}
>
  View Details
</button>
<div id="details-content" hidden={!isOpen}>
  Detailed content here
</div>
```

### aria-selected

```tsx
// In selectable lists or tabs
<div role="listbox" aria-label="Choose color">
  <div role="option" aria-selected={selected === 'red'}>Red</div>
  <div role="option" aria-selected={selected === 'blue'}>Blue</div>
</div>
```

### aria-current

```tsx
// Navigation - current page indicator
<nav>
  <a href="/" aria-current={currentPath === '/' ? 'page' : undefined}>Home</a>
  <a href="/about" aria-current={currentPath === '/about' ? 'page' : undefined}>About</a>
</nav>

// Steps - current step
<ol>
  <li aria-current={step === 1 ? 'step' : undefined}>Shipping</li>
  <li aria-current={step === 2 ? 'step' : undefined}>Payment</li>
</ol>
```

### aria-hidden

```tsx
// Hide decorative content from screen readers
<button>
  <span aria-hidden="true">*</span>
  Required
</button>

// Hide icon that has accompanying text
<button>
  <TrashIcon aria-hidden="true" />
  Delete
</button>

// Never hide interactive elements!
// Bad - button is hidden but focusable
<button aria-hidden="true">Hidden Button</button>
```

### aria-disabled vs disabled

```tsx
// disabled attribute - removes from tab order
<button disabled>Can't Click</button>

// aria-disabled - keeps in tab order, announces as disabled
// Use when you want to explain why it's disabled
<button aria-disabled="true" onClick={e => e.preventDefault()}>
  Save
</button>
```

## Labels & Descriptions

### aria-label

```tsx
// Icon-only buttons must have aria-label
<button aria-label="Close" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>

<button aria-label="Search" type="submit">
  <SearchIcon aria-hidden="true" />
</button>
```

### aria-labelledby

```tsx
// Reference existing visible text
<h2 id="billing-heading">Billing Address</h2>
<form aria-labelledby="billing-heading">
  {/* form fields */}
</form>

// Multiple labels
<span id="name-label">Full Name</span>
<span id="name-required">(required)</span>
<input aria-labelledby="name-label name-required" />
```

### aria-describedby

```tsx
// Additional descriptions (hints, errors)
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-describedby="password-hint password-error"
/>
<span id="password-hint">Must be at least 8 characters</span>
<span id="password-error" role="alert">Password is too short</span>
```

## Live Regions

### aria-live="polite"

```tsx
// Non-urgent updates - wait for user to finish
<div aria-live="polite">
  {searchResults.length} results found
</div>
```

### aria-live="assertive"

```tsx
// Urgent updates - interrupt immediately
<div aria-live="assertive">
  {criticalError}
</div>
```

### role="alert"

```tsx
// Shorthand for aria-live="assertive" aria-atomic="true"
<div role="alert">
  Form submission failed. Please try again.
</div>
```

### role="status"

```tsx
// Shorthand for aria-live="polite" aria-atomic="true"
<div role="status">
  Changes saved successfully.
</div>
```

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

```tsx
// Modal must trap focus - users can't Tab outside
// See ux-principal agent for useFocusTrap implementation
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
