---
name: styling-rtl
description: CSS/SCSS conventions with RTL support, logical properties, and design tokens. Use when writing CSS/SCSS styles, implementing RTL support with logical properties, or applying design tokens.
globs: "**/*.css,**/*.scss"
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

Import and use common UI color variables:

```scss
@use 'styles/design-tokens/colors';
@use 'styles/design-tokens/typography';

.component {
  background: colors.$blue-20;
  color: colors.$gray-80;
}

// Bad - hardcoded colors
.component {
  background: #3c87cd;
}
```

## CSS Variables for Spacing

```scss
:root {
  --spacing-unit: 8px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --header-height: 60px;
}

.component {
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  height: calc(100vh - var(--header-height));
}

// Bad - magic numbers
.component {
  padding: 17px;
  margin-bottom: 23px;
  height: calc(100vh - 60px);
}
```

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
