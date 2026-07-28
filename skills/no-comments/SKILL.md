---
name: no-comments
description: Guidelines for writing self-documenting code without excessive comments. Use when reviewing code for unnecessary comments, or writing self-documenting code with clear naming and structure.
globs: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
user-invocable: false
---

# No Comments Conventions

Write code that's self-explanatory and reduce the need for comments.

## Naming Conventions

1. Use clear, descriptive names for variables, functions, and classes
2. Choose names that explain the purpose or behavior
3. Use domain-specific terminology when appropriate
4. Be consistent with naming patterns across the codebase

## Function Design

1. Keep functions small and focused on a single task
2. Extract complex logic into well-named helper functions
3. Use meaningful parameter and return value names
4. Follow the Single Responsibility Principle

## When to Use Comments

Use comments sparingly and only in these specific cases:

1. **Intent explanation**: When the "why" isn't obvious from the code
2. **Algorithm clarification**: For complex algorithms that can't be simplified
3. **Warning notes**: To highlight non-obvious side effects or edge cases
4. **API documentation**: JSDoc-style comments for public APIs only

## What to Avoid

1. **Redundant comments**: Don't explain what the code already tells you
2. **Outdated comments**: Comments that aren't maintained become misleading
3. **Commented-out code**: Delete unused code instead of commenting it out
4. **TODO comments**: Use the issue tracker instead
5. **Change narration**: Don't describe the diff or contrast with the previous version (`previously…`, `instead of…`, `we used to…`, `changed to…`). Comment the code as it stands, not how it got there.

## Comment the Solution, Not the Change

A comment must read as standalone documentation of why the code is shaped this way — understandable to someone who never saw the diff. Explain the overall solution, the reasoning, and the invariants. NEVER narrate the specific change being made or contrast with the previous version; that belongs in the commit message, not the code. Before/after framing goes stale the moment the next change lands.

## Better Alternatives to Comments

1. Use well-named variables instead of inline comments
2. Extract code to descriptive functions rather than describing logic
3. Use types and interfaces to document data structures
4. Use enums and constants to document intent
5. Use tested examples for API documentation

---

## Examples

### Redundant Comment (Bad)

```typescript
// Calculate total price
const total = items.reduce((acc, item) => acc + item.price, 0);
```

### Self-Documenting Code (Good)

```typescript
const totalPrice = items.reduce((acc, item) => acc + item.price, 0);
```

The variable name `totalPrice` makes the comment unnecessary.

---

### Complex Logic with Comment (Bad)

```typescript
// Check if user can access the resource
if (user.role === 'admin' || (user.role === 'editor' && resource.ownerId === user.id)) {
  // allow access
}
```

### Extracted to Function (Good)

```typescript
const canAccessResource = (user: User, resource: Resource): boolean => {
  const isAdmin = user.role === 'admin';
  const isOwner = resource.ownerId === user.id;
  const isEditor = user.role === 'editor';

  return isAdmin || (isEditor && isOwner);
};

if (canAccessResource(user, resource)) {
  // allow access
}
```

---

### Intent Comment (Acceptable)

```typescript
// Using setTimeout to debounce rapid API calls and prevent rate limiting
const debouncedSearch = useMemo(
  () => debounce(searchQuery, 300),
  [searchQuery]
);
```

This explains the "why" - preventing rate limiting - which isn't obvious from the code.

---

### Change-Narrating Comment (Bad)

```typescript
// Resolve the user once per request instead of rebuilding it per anomaly, which previously
// meant an uncached getUserById round trip for every anomaly (N+1).
const baseCriteria = await generateQuery({ user, filterClientFacingProjects: true });
```

This narrates the diff (`instead of`, `previously`, `N+1`). It only makes sense to someone comparing against the old code, and goes stale once the next change lands.

### Solution-Documenting Comment (Good)

```typescript
// Permission criteria are user-scoped, so they are resolved once and shared across all anomalies
// (each resolution is an uncached getUserById round trip).
const baseCriteria = await generateQuery({ user, filterClientFacingProjects: true });
```

This explains the invariant (criteria are user-scoped) and the cost being avoided (the round trip), with no reference to the previous version.

---

### JSX Section Comments (Bad)

```tsx
<Flex flexDirection="column" gap={16}>
  {/* Generate Button */}
  <Flex flexDirection="row" gap={16} alignItems="center">
    <Button
      text={isLoading ? 'Generating...' : 'Generate'}
      onClick={handleGenerateClick}
      disabled={isGenerateButtonDisabled}
      variant="primary"
      loading={isLoading}
    />
  </Flex>

  {/* Error Message */}
  {error && (
    <Card>
      <Typography variant="t-body" color="red-30">
        {error}
      </Typography>
    </Card>
  )}

  {/* No Published Version Message */}
  {!publishedVersion && (
    <Card>
      <Typography variant="t-body" color="gray-80">
        No published version available
      </Typography>
    </Card>
  )}

  {/* Metadata Display */}
  {metadata && <ExpectedOutputMetadata metadata={metadata} />}

  {/* Expected Output Editor */}
  <TextArea value={expectedOutput} onChange={handleChange} rows={10} />
</Flex>
```

These `{/* Section Name */}` comments are redundant - the JSX structure and component names are already self-documenting.

### Self-Documenting JSX (Good)

```tsx
<Flex flexDirection="column" gap={16}>
  <GenerateButtonSection
    isLoading={isLoading}
    onGenerate={handleGenerateClick}
    disabled={isGenerateButtonDisabled}
  />

  {error && <ErrorMessage error={error} />}

  {!publishedVersion && <NoPublishedVersionMessage />}

  {metadata && <ExpectedOutputMetadata metadata={metadata} />}

  <ExpectedOutputEditor value={expectedOutput} onChange={handleChange} />
</Flex>
```

Extract sections into well-named components. If extraction isn't warranted, the variable names and component structure should be clear enough without comments.

### Inline JSX Without Comments (Also Good)

```tsx
<Flex flexDirection="column" gap={16}>
  <Flex flexDirection="row" gap={16} alignItems="center">
    <Button
      text={isLoading ? 'Generating...' : 'Generate'}
      onClick={handleGenerateClick}
      disabled={isGenerateButtonDisabled}
      variant="primary"
      loading={isLoading}
    />
  </Flex>

  {error && (
    <Card>
      <Typography variant="t-body" color="red-30">
        {error}
      </Typography>
    </Card>
  )}

  {!publishedVersion && (
    <Card>
      <Typography variant="t-body" color="gray-80">
        No published version available
      </Typography>
    </Card>
  )}

  {metadata && <ExpectedOutputMetadata metadata={metadata} />}

  <TextArea value={expectedOutput} onChange={handleChange} rows={10} />
</Flex>
```

The conditional rendering (`{error && ...}`, `{!publishedVersion && ...}`) and component names already communicate intent.

---

## Quick Reference

| Pattern | Action |
|---------|--------|
| `// get the user` before `getUser()` | Delete - redundant |
| `// i++` next to `i++` | Delete - obvious |
| `/* TODO: fix later */` | Move to issue tracker |
| Commented-out code blocks | Delete entirely |
| `{/* Section Name */}` in JSX | Delete - use component names |
| `// HACK: workaround for bug #123` | Keep - explains intent |
| JSDoc on public API | Keep - API documentation |
| `// previously did X / instead of Y / we used to…` | Rewrite as timeless intent (or move to commit message) |
