# Coding Style

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

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<30 lines)
- [ ] Files are focused (<150 lines)
- [ ] No deep nesting (>3 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] Named exports only (no export default)
- [ ] Direct imports (no barrel/index.ts files)
- [ ] No duplicate types (use indexed access: `Type["property"]`)
- [ ] Type inheritance from source types (Pick, Omit, Partial)
- [ ] Markdown uses `-` for bullets (never `•`)
- [ ] Markdown has no bold text (`**`)
