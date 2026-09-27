# ARIA States, Labels, and Live Regions

Supporting reference for [SKILL.md](SKILL.md).

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

## Label in Name (WCAG 2.5.3)

When a button or link has visible text, the accessible name (computed from `aria-label` or `aria-labelledby` when present) MUST contain that visible text. Voice-control users speak what they see — if `aria-label` overrides the visible text with different wording, "click Exit" or "click John" silently fails.

```tsx
// Bad - visible text "Exit" not contained in accessible name
<button aria-label="Exit customer view">Exit</button>

// Bad - visible name (avatar initials + "John Doe") overridden by aria-label
<button aria-label={`Open user menu for ${user.displayName}`}>
  <Avatar name={user.displayName} />
  <span>{user.displayName}</span>
</button>

// Bad - visible text "Search…" not in accessible name
<button aria-label="Open search">
  <SearchIcon aria-hidden="true" />
  <span>Search…</span>
</button>

// Good - aria-label contains the visible text verbatim
<button aria-label="Exit customer view">Exit customer view</button>

// Good - drop aria-label and let visible content compute the name
<button>
  <Avatar name={user.displayName} aria-hidden="true" />
  <span>{user.displayName}</span>
</button>

// Good - icon-only button (no visible text), aria-label is the only name source
<button aria-label="Close" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>
```

**When to apply:** Any interactive element with visible text content. Voice-control activation ("click Exit") matches against the accessible name, so the visible label must appear in it. Icon-only controls are exempt — their `aria-label` IS the accessible name.

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
