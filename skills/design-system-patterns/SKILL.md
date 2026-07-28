---
name: design-system-patterns
description: Design system usage patterns including component preference over native HTML, design tokens for colors and typography, RTL-safe styling, and component API conventions. Use when consuming or authoring design system components, applying tokens, or reviewing UI code for design system compliance.
globs: "**/*.tsx,**/*.scss"
user-invocable: false
---

# Design System Patterns

Conventions for consuming and authoring design system components. These rules are library-agnostic: they apply whether the project uses an in-house system, MUI, Chakra, Radix, shadcn/ui, or Ant Design.

## Detection Gate

BEFORE applying any design system convention:

1. Identify the design system from `package.json` dependencies
2. If one is present: ALWAYS prefer its components over native HTML equivalents
3. If none is present: do NOT assume a design system exists. Use native HTML with the project's own styling conventions

```bash
# Detection check - adjust the package name to the project
grep -E '"(@mui/material|@chakra-ui/react|@radix-ui/|antd)"' package.json
```

Once identified, resolve the component API from the source of truth rather than memory:

| Need | Source |
|------|--------|
| Conventions (tokens, RTL, naming, spacing) | This skill |
| Available components and exact names | The library's own docs or its `d.ts` exports |
| Props, types, variants | Context7 `resolve-library-id` + `query-docs`, or the package types |
| Local/in-house system | The component source in the repo, never guessed |

NEVER invent component names, prop names, or token names. Verify against the package before use. Hallucinated tokens fail silently in SCSS and produce invalid CSS.

---

## Prefer Design System Components

Use the design system's component over a native element whenever an equivalent exists. This keeps behavior, accessibility, and styling consistent across the codebase.

```tsx
// Good - design system component
import { TextField } from '@mui/material';

function MyFormComponent() {
  return <TextField placeholder="Type here..." />;
}

// Avoid - native element when an equivalent exists
function MyFormComponent() {
  return <input placeholder="Type here..." />;
}
```

---

## Use the System Beyond Components

Most design systems ship more than visual components. Check for these before writing a custom implementation:

Layout utilities
- Flex/Stack/Grid wrappers with `gap`, alignment, and direction props. Use instead of custom flex containers
- Spacer components. Use instead of margin hacks
- Page/screen shell compound components with header, tabs, actions, and sidebar slots. Do not hand-build page shells with bare divs

```tsx
// Bad - hand-rolled screen shell
<div className={styles.page}>
  <div className={styles.pageHeader}>
    <div className={styles.pageTitle}>Reports</div>
  </div>
  <TabBar>...</TabBar>
  {activeTab === 'overview' && <OverviewTab />}
</div>

// Good - the system's screen compound component
<Screen>
  <Screen.Header title="Reports" subtitle="Overview">
    <Screen.Tabs><TabBar>...</TabBar></Screen.Tabs>
    <Screen.MainActions>
      <Button variant="secondary">Export</Button>
    </Screen.MainActions>
  </Screen.Header>
  <Screen.Content>
    {activeTab === 'overview' && <OverviewTab />}
  </Screen.Content>
</Screen>
```

Guards and boundaries
- Loading guard wrappers. Use instead of ad-hoc spinner branches
- Error boundary components. Use instead of a custom class boundary

Hooks and helpers
- Debounce, element dimensions, media queries, export-to-PDF/PNG, popup positioning
- File download helpers, MIME type constants, deterministic color-from-string generators

If the system provides it, importing it beats reimplementing it. This is SSOT applied to UI.

---

## Use Design Tokens for Color

PREFER tokens from the design system palette. When no exact match exists, pick the closest available token in tone and hue rather than inventing a value.

```scss
// Good - palette tokens
@use '@your-design-system/colors';

.myComponent {
  background: colors.$blue-20;
  color: colors.$gray-80;
  border-color: colors.$blue-60;
}
```

Data visualization usually has its own categorical palette, kept separate from UI colors so series stay distinguishable:

```scss
@use '@your-design-system/data-visualization-colors' as viz-colors;

.chartBar {
  fill: viz-colors.$data-blue;
  stroke: viz-colors.$data-gray;
}
```

```scss
// Bad - hardcoded hex
.myComponent { background: #3c87cd; }

// Bad - generic CSS color names
.myComponent { background: blue; color: darkgray; }

// Bad - a token name that looks plausible but does not exist in the package
.myComponent {
  background: colors.$white;  // verify before using
  color: colors.$black;
}
```

ALWAYS confirm the exact token name exists in the package source. Palettes often express near-white and near-black as the ends of a gray ramp (`$gray-0`, `$gray-100`) rather than as `$white` / `$black`.

---

## Use Design Tokens for Typography

Design system components carry their own typography. NEVER re-apply a typography mixin to an element the system already renders and styles - it is redundant and drifts from the system.

```scss
// Bad - the header component already styles this text
.page-title {
  @include typography.t-heading-1;
}

// Good - mixin on a custom element with no system equivalent
.custom-label {
  @include typography.t-small;
}
```

For standalone text, prefer the system's typography component over a raw element plus mixin:

```tsx
// Good
<Typography variant="heading-1">Reports</Typography>
```

Typical scales: `heading-1` through `heading-6`, `body`, `body-large`, `small`, `mini`, `tag`, `action-large`, `action-medium`, `action-small`, `number-large`. Custom font values are allowed only when no scale matches.

---

## Component Authoring Conventions

When adding components to a shared design system or a local component library:

Naming and structure
- Consistent prefix or namespace across all system components, matching whatever the system already uses
- CSS Modules (`.module.scss`) for component styles
- Logical CSS properties for RTL support
- No `style` prop - expose variants through typed props instead

className and customStyles

```tsx
// Root element takes className; nested elements take customStyles slots
<div className={classNames(styles.card, className)}>
  <div className={customStyles?.header}>{header}</div>
  <div className={customStyles?.body}>{children}</div>
</div>

interface CardProps {
  className?: string;
  customStyles?: {
    header?: string;
    body?: string;
    footer?: string;
  };
}
```

This gives consumers a single documented escape hatch per slot instead of unconstrained inline styling.

---

## RTL Support

Use logical CSS properties so layouts flip correctly in right-to-left locales:

```scss
// Bad - physical properties do not flip
.element {
  padding-left: 16px;
  margin-right: 8px;
  text-align: left;
}

// Good - logical properties auto-flip
.element {
  padding-inline-start: 16px;
  margin-inline-end: 8px;
  text-align: start;
}
```

| Physical | Logical |
|----------|---------|
| `left` | `inline-start` |
| `right` | `inline-end` |
| `top` | `block-start` |
| `bottom` | `block-end` |

---

## Quick Reference

| Instead of | Use |
|------------|-----|
| `<input>`, `<button>`, `<select>` | The system's equivalent component |
| Custom page shell of divs | The system's screen/page compound component |
| Custom flex container div | The system's Flex/Stack component |
| Custom loading spinner wrapper | The system's loading guard |
| Custom error boundary | The system's error boundary |
| Custom debounce hook | The system's debounce hook |
| Custom ResizeObserver hook | The system's dimensions hook |
| Typography mixin on a system component | Remove it (built in) |
| Hardcoded `#3c87cd` | The nearest palette token |
| `padding-left` | `padding-inline-start` |
| `margin-right` | `margin-inline-end` |
| `text-align: left` | `text-align: start` |

---

## Component Checklist

- [ ] Design system confirmed in `package.json` (detection gate)
- [ ] Component names and props verified against docs or types, not guessed
- [ ] System components preferred over native HTML equivalents
- [ ] System utilities and hooks used where they exist
- [ ] Naming follows the system's existing convention
- [ ] Uses `.module.scss` for styles
- [ ] Logical CSS properties used for RTL support
- [ ] Root accepts `className`; nested elements use `customStyles`
- [ ] No inline `style` prop - variants exposed as props
- [ ] Colors come from palette tokens
- [ ] All token names verified to exist in the package source
- [ ] Typography mixins not applied to elements the system already styles
