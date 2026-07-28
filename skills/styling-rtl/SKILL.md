---
name: styling-rtl
description: CSS/SCSS conventions with RTL support, logical properties, and design tokens. Use when writing CSS/SCSS styles, implementing RTL support with logical properties, or applying design tokens.
globs: "**/*.css,**/*.scss"
user-invocable: false
---

# Styling & RTL Conventions

## Logical CSS Properties (RTL Support)

Always use logical properties for RTL language support:

```scss
// Good - works for RTL and LTR
.component {
  padding-inline-start: 1rem;  // Instead of padding-left
  padding-inline-end: 1rem;    // Instead of padding-right
  margin-inline-start: 0.5rem; // Instead of margin-left
  margin-inline-end: 0.5rem;   // Instead of margin-right
  border-inline-start: 1px solid; // Instead of border-left
  text-align: start;           // Instead of text-align: left
}

// Bad - breaks RTL layouts
.component {
  padding-left: 1rem;
  margin-right: 0.5rem;
  text-align: left;
}
```

## RTL-Safe Prop and Variable Naming

When naming props, variables, or CSS classes that relate to horizontal direction, always use `start`/`end` instead of `left`/`right`. This ensures the API is RTL-agnostic.

```typescript
// Bad - directional prop names break RTL mental model
interface Props {
  borderLeft?: boolean;
  paddingRight?: number;
  alignLeft?: boolean;
}

// Good - logical prop names work for both LTR and RTL
interface Props {
  borderStart?: boolean;
  paddingEnd?: number;
  alignStart?: boolean;
}
```

```scss
// Bad - directional class names
.align-left { text-align: left; }
.border-left { border-left: 2px solid blue; }

// Good - logical class names with logical CSS
.align-start { text-align: start; }
.border-start { border-inline-start: 2px solid blue; }
```

**Naming conversion table:**

| Physical (Avoid) | Logical (Use) |
|------------------|---------------|
| left | start |
| right | end |
| borderLeft | borderStart |
| paddingRight | paddingEnd |
| marginLeft | marginStart |
| alignLeft | alignStart |

**When to apply:** Any time you're naming props, variables, or CSS classes that involve horizontal positioning or alignment.

## Design System Colors

Import and use the design system's color tokens:

```scss
@use '@your-design-system/colors';
@use '@your-design-system/data-visualization-colors' as viz-colors;

// Good - UI colors
.component {
  background: colors.$blue-20;
  color: colors.$gray-80;
}

// Good - data visualization colors
.chart {
  fill: viz-colors.$data-blue;
}

// Bad - hardcoded colors
.component {
  background: #3c87cd;
}

// Bad - plausible-looking token names that don't exist in the package
.component {
  background: colors.$white; // palettes often expose $gray-0 instead
  color: colors.$black;      // palettes often expose $gray-100 instead
}
```

ALWAYS verify the exact token name exists in the design system source before using it. Do not guess based on naming patterns.

## Typography

Prefer design system typography scales. Use custom values only when design system has no matching scale:

```scss
@use '@your-design-system/typography';

// Good - use typography mixins
.page-title {
  @include typography.t-heading-1;
}

.section-title {
  @include typography.t-heading-3;
}

.body-text {
  @include typography.t-body;
}

.small-text {
  @include typography.t-small;
}

.button-text {
  @include typography.t-action-medium;
}

// Acceptable - custom value when no design system match exists
$custom-code-size: 13px;

.code {
  font-size: $custom-code-size;
  font-family: 'Monaco', monospace;
}

// Bad - hardcoded without checking design system first
.heading {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.3;
}
```

**Available typography scales:** `t-heading-1` through `t-heading-6`, `t-body`, `t-body-large`, `t-small`, `t-mini`, `t-tag`, `t-action-large`, `t-action-medium`, `t-action-small`, `t-number-large`

## CSS Variables for Spacing

ALWAYS reuse shared spacing variables for spacing and sizing properties. NEVER use px directly for properties like `margin`, `padding`, `width`, `height`, `gap`, `min-height`, `max-width`, etc.

```scss
// Good - always use variables
.component {
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  gap: var(--space-lg);
  width: var(--container-width);
  height: calc(100dvh - var(--header-height));
}

// Bad - direct px values
.component {
  padding: 17px;
  margin-bottom: 23px;
  width: 1200px;
  height: calc(100dvh - 60px);
}
```

**Spacing variable naming varies by project.** Check your repo's design system for the naming scheme. Common patterns include:
- `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`
- `--spacing-1`, `--spacing-2`, `--spacing-4`, etc.
- `--gap-small`, `--gap-medium`, `--gap-large`

Use whatever naming convention your project defines.

**When to create custom variables:** If a value doesn't fit the standard scale, create a SCSS variable:

```scss
// Good - custom variable for non-standard value
$custom-tooltip-offset: 12px;

.tooltip {
  margin-top: $custom-tooltip-offset;
}

// Bad - inline px value
.tooltip {
  margin-top: 12px;
}
```

## Viewport Heights on Mobile

`100vh` is broken on iOS Safari — it includes the area behind the URL bar, so a `height: 100vh` shell overflows the visible viewport and gets clipped. Use `100dvh` (dynamic viewport height), which shrinks/grows with the URL bar. For browsers that lack `dvh` support, fall back to `100vh`.

```scss
// Bad - 100vh overflows on iOS Safari (URL bar)
.app-shell {
  height: 100vh;
  max-height: 100vh;
}

// Good - 100dvh tracks the visible viewport on mobile
.app-shell {
  height: 100dvh;
  max-height: 100dvh;
}

// Good - with fallback for older browsers
.app-shell {
  height: 100vh;
  height: 100dvh;
}
```

**When to apply:** Any full-viewport layout (app shells, modals, drawers, hero sections). Also applies to `min-height` and `max-height` — substitute `min-block-size: 100dvh` / `max-block-size: 100dvh` for RTL safety.

## Margin vs Padding

- **Margin**: Spacing between elements
- **Padding**: Internal spacing within an element

```scss
.card {
  margin-bottom: var(--space-md); // Space between cards
  padding: var(--space-md);       // Internal spacing
}
```

## Layout Patterns

### Flexbox with Gap
```scss
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.card {
  flex: 1 1 300px;
}
```

### Grid Auto-Fit
```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
}
```

### Responsive Breakpoints
```scss
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-sm);
  }
}
```

## Dynamic Elements

```scss
// Hide empty elements
.optional-element:empty {
  display: none;
}

// Spacing for list items except last
.list-item:not(:last-child) {
  margin-bottom: var(--space-sm);
}
```

## Things to Avoid

- Unnecessary CSS animations impacting performance
- Universal selectors (`*`)
- Inline styles (unless absolutely necessary)
- Magic numbers (use variables)
- Over-specificity in global CSS
- Directional properties (use logical properties)

## Selector Specificity

```scss
// Good - simple, locally scoped
.button {
  padding: 10px 20px;
}

.icon {
  display: inline-block;
}

// Bad - over-specific, targets HTML elements
.notificationContainer span {
  margin: 20px 0;
}

.notificationContainer button {
  margin: 70px 40px 10px;
}
```

## SCSS Variables

Define variables for frequently used values:

```scss
// Good
$default-padding: 1rem;
$border-radius: 4px;
$transition-speed: 200ms;

.component {
  padding: $default-padding;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
}

// Bad - repeated values
.component1 {
  padding: 1rem;
}
.component2 {
  padding: 1rem;
}
```
