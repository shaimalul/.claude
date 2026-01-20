---
name: npm-package-patterns
description: NPM package export patterns including subpath exports, named exports, and JSDoc documentation
globs: "**/package.json,**/index.ts"
---

# NPM Package Export Patterns

Standards for organizing and exporting npm packages.

---

## Explicit Named Exports (No Wildcards)

```typescript
// Good - explicit exports in index.ts
export { fetchUser, updateUser } from './user/userActions';
export { selectUserProfile } from './user/userSelectors';
export type { User, UserRole } from './types';  // Use 'export type' for types

// Bad - wildcard exports
export * from './user/userActions';  // Makes API unclear, hides what's exported
```

**Why explicit exports:**
- Clear API surface - consumers know exactly what's available
- Better tree-shaking - bundlers can eliminate unused code
- Prevents accidental exposure of internal implementation
- IDE autocomplete shows only intended public API

---

## Domain-Oriented Subpath Exports

Configure subpath exports in `package.json` for better organization:

```json
{
  "name": "@myorg/my-package",
  "exports": {
    ".": "./dist/index.js",
    "./user": "./dist/user/index.js",
    "./auth": "./dist/auth/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

**Usage:**
```typescript
// Consumers can import from specific domains
import { fetchUser } from '@myorg/my-package/user';
import { authenticate } from '@myorg/my-package/auth';
import type { User } from '@myorg/my-package/types';
```

**Benefits:**
- Better tree-shaking - only imports from specific subpath are bundled
- Clearer API organization - logical grouping by domain
- Enables lazy loading of package parts

---

## JSDoc for Public Exports

Document all public exports with JSDoc:

```typescript
/**
 * Fetches user data from the API
 * @param userId - The ID of the user to fetch
 * @returns A promise that resolves to the user data
 * @example
 * const user = await fetchUser('123');
 */
export function fetchUser(userId: string): Promise<User> {
  // ...
}

/**
 * User profile type
 * @property id - Unique identifier
 * @property email - User's email address
 * @property name - User's display name
 */
export interface User {
  id: string;
  email: string;
  name: string;
}
```

**JSDoc checklist for public exports:**
- [ ] Short description of what it does
- [ ] `@param` for each parameter with type and description
- [ ] `@returns` describing the return value
- [ ] `@example` for non-trivial usage
- [ ] `@throws` if function can throw errors
- [ ] `@deprecated` with migration path if applicable

---

## TypeScript Configuration for Packages

```json
// tsconfig.json for npm packages
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "moduleResolution": "bundler",
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
```

---

## Package.json Fields

Essential fields for npm packages:

```json
{
  "name": "@myorg/my-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

---

## Quick Reference

| Rule | Example |
|------|---------|
| Use named exports | `export { fetchUser }` not `export default` |
| Use `export type` | `export type { User }` for type-only |
| No wildcards | Avoid `export *` |
| Document public API | JSDoc with `@param`, `@returns`, `@example` |
| Configure subpaths | `"./user": "./dist/user/index.js"` |
| Include types | `"types": "./dist/index.d.ts"` |
