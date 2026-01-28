---
name: cleanup
description: Code debt detection and cleanup patterns for duplicates, legacy code, and dead code
globs: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# Code Cleanup Patterns

Patterns for detecting and safely removing code debt.

## Cleanup Categories

### 1. Duplicate Types/Interfaces

**Detection Patterns:**
```typescript
// Same interface defined in multiple files
// File: src/types/user.ts
interface User { id: string; name: string; }

// File: src/components/UserCard.tsx
interface User { id: string; name: string; } // DUPLICATE
```

**Detection Strategy:**
1. Search for `interface <Name>` and `type <Name>` patterns
2. Group by name across files
3. Compare structure (properties, types)
4. Flag exact or near-duplicates

**Safe Removal:**
1. Identify the canonical location (usually `types/` folder)
2. Verify all usages can import from canonical location
3. Update imports in all files
4. Remove duplicate definitions
5. Run TypeScript check to verify

### 2. Multiple Approaches to Same Functionality

**Detection Patterns:**
```typescript
// Multiple date formatters
export const formatDate = (d: Date) => d.toLocaleDateString();
export const formatDateString = (d: Date) => d.toISOString().split('T')[0];
export const dateToString = (d: Date) => `${d.getMonth()}/${d.getDate()}/${d.getFullYear()}`;

// Multiple fetch wrappers
export const fetchData = async (url) => fetch(url).then(r => r.json());
export const getData = async (url) => axios.get(url).then(r => r.data);
export const apiCall = async (url) => httpClient.get(url);
```

**Detection Strategy:**
1. Search for functions with similar names (Levenshtein distance)
2. Analyze function signatures and return types
3. Check for overlapping functionality
4. Flag when multiple functions serve same purpose

**Safe Removal:**
1. Identify the preferred approach (most used, best typed, matches patterns)
2. Create migration map: `oldFunction` -> `newFunction`
3. Update all call sites
4. Add deprecation warning temporarily
5. Remove old implementations after validation

### 3. Backward Compatibility Code

**Detection Patterns:**
```typescript
// Deprecated exports
/** @deprecated Use newFunction instead */
export const oldFunction = newFunction;

// Alias re-exports
export { newService as oldService }; // backward compat alias

// Commented deprecation
// DEPRECATED: keeping for backward compatibility
export const legacyApi = () => { ... };

// Conditional legacy support
if (useLegacyMode) {
  return oldImplementation();
}
```

**Detection Strategy:**
1. Search for `@deprecated` JSDoc tags
2. Search for comments containing "deprecated", "backward", "legacy"
3. Find re-export aliases
4. Detect conditional legacy branches

**Safe Removal:**
1. Identify all usages of deprecated code
2. Verify no external consumers (if library)
3. Update all internal usages
4. Remove deprecated exports
5. Clean up re-export aliases

### 4. Dead Code

**Detection Patterns:**
```typescript
// Unused exports
export const neverUsedFunction = () => {}; // no imports found

// Unreachable branches
if (false) {
  // This code never runs
}

// Commented out code
// const oldLogic = () => {
//   return computeOldWay();
// };

// Unused variables in module scope
const UNUSED_CONSTANT = 'never referenced';
```

**Detection Strategy:**
1. Find exports with no imports across codebase
2. Detect `if (false)` or `if (true)` branches
3. Find large commented code blocks
4. Detect module-level unused variables

**Safe Removal:**
1. Verify export is truly unused (check dynamic imports)
2. Check for external consumers if publishing
3. Remove unused code
4. Clean up associated imports
5. Run tests to verify

## Verification Checklist

After each cleanup action:
- [ ] TypeScript compiles without errors
- [ ] All imports resolve correctly
- [ ] Tests pass
- [ ] Build succeeds
- [ ] No runtime errors in affected areas

## Edge Cases and Warnings

### Do NOT Remove

1. **Public API exports** - May have external consumers
2. **Dynamic imports** - `import()` may not be detected
3. **Reflection/eval usage** - Runtime access may exist
4. **Test fixtures** - May look unused but needed for tests
5. **Environment-specific code** - May only run in production/development

### Require Extra Verification

1. **Configuration objects** - May be used by frameworks
2. **Callback handlers** - May be passed to external libraries
3. **Event handlers** - May be registered dynamically
4. **Types for external data** - API responses, configs

## Integration with Existing Tools

### Before Cleanup
```bash
# Create safety checkpoint
git add -A && git commit -m "chore: checkpoint before cleanup"
```

### After Cleanup
```bash
# Verify no breakage
npm test
npx tsc --noEmit
npm run lint
npm run build
```

### Rollback if Needed
```bash
git reset --hard HEAD~1
```
