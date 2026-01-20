---
name: common-ui-patterns
description: Zencity Common UI design system guidelines including ZCD components, colors, and component conventions
globs: "**/*.tsx,**/*.scss"
---

# Zencity Common UI Guidelines

Standards for using the `@zencity/common-ui` design system.

**Reference:** https://common-ui.zencity.io/

---

## Always Use Common UI Components

Always prefer components from our design system over creating new ones or using native HTML elements directly. This ensures consistent behavior and styling across repos.

**Do:** Use components from `@zencity/common-ui`

```tsx
// Good
import { ZCDInput } from '@zencity/common-ui';

function MyFormComponent() {
  return <ZCDInput placeholder="Type here..." />;
}
```

**Don't:** Avoid native HTML when a corresponding ZCD component exists

```tsx
// Avoid
function MyFormComponent() {
  return <input placeholder="Type here..." />;
}
```

---

## Use Design System Colors

Prefer using colors from our design system to maintain visual consistency.

**Do:** Use colors from `@zencity/common-ui/zcd-colors`

```scss
// Good
@use '@zencity/common-ui/zcd-colors';

.myComponent {
  background: zcd-colors.$zcd-blue-20;
}
```

**Don't:** Avoid hardcoded color codes

```scss
// Avoid
.myComponent {
  background: #3c87cd;
}
```

---

## ZCD Component Conventions

When creating ZCD components in `@zencity/common-ui`:

### Naming and Structure

- **ZCD prefix**: All components start with `ZCD` (e.g., `ZCDButton`, `ZCDInput`)
- **CSS Modules**: Use `.module.scss` for component styles
- **Logical CSS**: Use `padding-inline-start` instead of `padding-left` for RTL support
- **No `style` prop**: Variants should be controlled through props, not inline styles

### className and customStyles Patterns

```tsx
// Root component uses className prop
<div className={classNames(styles.card, className)}>
  {/* Nested components use customStyles */}
  <div className={customStyles?.header}>{header}</div>
  <div className={customStyles?.body}>{children}</div>
</div>

// Props interface
interface CardProps {
  className?: string;  // For root element
  customStyles?: {     // For nested elements
    header?: string;
    body?: string;
    footer?: string;
  };
}
```

---

## RTL Support

Use logical CSS properties for proper RTL (right-to-left) language support:

```scss
// Bad - physical properties don't flip for RTL
.element {
  padding-left: 16px;
  margin-right: 8px;
  text-align: left;
}

// Good - logical properties auto-flip for RTL
.element {
  padding-inline-start: 16px;
  margin-inline-end: 8px;
  text-align: start;
}
```

**Property mappings:**
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
| `<input>` | `<ZCDInput>` |
| `<button>` | `<ZCDButton>` |
| `<select>` | `<ZCDSelect>` |
| Hardcoded `#3c87cd` | `zcd-colors.$zcd-blue-20` |
| `padding-left` | `padding-inline-start` |
| `margin-right` | `margin-inline-end` |
| `text-align: left` | `text-align: start` |

---

## Component Checklist

When creating or reviewing ZCD components:

- [ ] Uses `ZCD` prefix in component name
- [ ] Uses `.module.scss` for styles
- [ ] Uses logical CSS properties for RTL support
- [ ] Root accepts `className` prop
- [ ] Nested elements use `customStyles` pattern
- [ ] No inline `style` prop - use prop variants instead
- [ ] Uses design system colors from `zcd-colors`
