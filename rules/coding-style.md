---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.css"
  - "**/*.scss"
---

# Coding Style

## Single Source of Truth (SSOT) - CRITICAL

Every concept has exactly ONE authoritative definition:

- Constants: Define once in `constants/`, import everywhere
- Enums: Define once in `types/`, derive types with `(typeof ENUM)[keyof typeof ENUM]`
- Types: Derive with `Pick`, `Omit`, `Type["property"]` - NEVER copy fields
- Logic: Extract to utility, import - NEVER inline the same calculation twice
- Config: Define in config file, read everywhere - NEVER hardcode thresholds

ALWAYS search before creating: `types/`, `utils/`, `constants/`, `enums/`

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- Files: Max 150 lines
- Functions: Max 30 lines
- Classes: Max 200 lines
- Extract utilities from large components
- Organize by feature/domain, not by type

## Comments

Document the code as it stands, NEVER the change that produced it. Before writing a comment, apply the test: would it read correctly to someone who never saw the previous version? If it references the diff or a prior state, rewrite it as timeless intent or move it to the commit message. Apply this at write-time, not in review.

NEVER narrate the diff: no "previously…", "instead of…", "no longer…", "we used to…", "the old…", "still…", "was Xms". Explain WHAT the code does and WHY, plus any non-obvious invariant.

```typescript
// Bad - narrates the change; only makes sense beside the old code
// Build the match once instead of rebuilding it per project like before

// Good - timeless intent, reads standalone
// Per-project queries differ only by `project`; build the shared pipeline once and swap it in.
```

## Markdown Formatting

Use simple, consistent markdown:
- Use `-` (hyphen) for bullet points, never `•` (bullet character)
- Never use bold (`**text**`) - use plain text or headers for emphasis
- Use triple backticks with language identifier for code blocks
- Use `#` notation for headers, not underlines

## Error Handling

ALWAYS handle errors comprehensively:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

## Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## Styling (CSS/SCSS)

### Spacing & Sizing

ALWAYS reuse shared spacing variables. NEVER use px directly for spacing and sizing properties (margin, padding, width, height, gap, min-height, max-width, etc.). Variable names vary per repo—check your project's design system.

```scss
// Good - use variables and logical properties
.component {
  padding: var(--space-md);
  margin-inline-end: var(--space-sm);
  gap: var(--space-lg);
  width: 100%;
  min-height: var(--button-height);
}

// Bad - hardcoded px values
.component {
  padding: 16px;
  margin-right: 8px;
  gap: 24px;
  width: auto;
  min-height: 40px;
}
```

For non-standard values, create SCSS variables:

```scss
// Good - custom variable for custom value
$custom-offset: 30px;

.tooltip {
  margin-top: $custom-offset;
}
```

### Colors

PREFER color tokens from the project's design system. Never hardcode colors:

```scss
// Good - use design system tokens
@use '@your-design-system/colors';
@use '@your-design-system/data-visualization-colors' as viz-colors;

.button {
  background: colors.$blue-60;
  color: colors.$gray-0;
}

.chart {
  fill: viz-colors.$data-blue;
}

// Bad - hardcoded color
.button {
  background: #2563eb;
  color: #ffffff;
}
```

If an exact palette color is unavailable, select the closest match in tone and hue. Verify the token name exists in the package before using it.

### Typography

PREFER the design system typography scale for font sizes, weights, and line heights. Custom values allowed when no matching scale exists:

```scss
// Good - use design system typography mixins
@use '@your-design-system/typography';

.heading {
  @include typography.t-heading-1;
}

.subheading {
  @include typography.t-heading-3;
}

.body {
  @include typography.t-body;
}

.small-text {
  @include typography.t-small;
}

// Acceptable - custom value when no design system match
$custom-monospace-size: 13px;

.code {
  font-size: $custom-monospace-size;
  font-family: 'Monaco', monospace;
}

// Bad - hardcoded font values without checking design system first
.heading {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.3;
}
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<30 lines)
- [ ] Files are focused (<150 lines)
- [ ] No deep nesting (>3 levels)
- [ ] Proper error handling
- [ ] Comments explain the solution/intent, not the diff (no "previously…", "instead of…", "we used to…")
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] Named exports only (no export default)
- [ ] Direct imports (no barrel/index.ts files)
- [ ] All imports at file top (no dynamic imports or require inside code blocks)
- [ ] No duplicate types (use indexed access: `Type["property"]`)
- [ ] Type inheritance from source types (Pick, Omit, Partial)
- [ ] Test written first for new logic (TDD: RED before GREEN)
- [ ] Markdown uses `-` for bullets (never `•`)
- [ ] Markdown has no bold text (`**`)
