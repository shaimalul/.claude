---
name: useeffect-patterns
description: useEffect best practices, common mistakes, and when to use alternative approaches like React Query. Use when writing or reviewing useEffect hooks, diagnosing infinite loops, or deciding between useEffect and React Query.
globs: "**/*.tsx,**/*.ts"
user-invocable: false
---

# useEffect Best Practices

**Rule:** useEffect should be the exception, not the default. If you see it often, ask whether it's the right tool.

Detailed mistake examples with code: [reference/common-mistakes.md](reference/common-mistakes.md)

## Decision Framework: Three Questions Before useEffect

### Q1. Is there an external system?

useEffect is designed to synchronize React with external systems:
- Network: APIs, WebSockets, Server-Sent Events
- Browser APIs: DOM manipulation, localStorage, geolocation
- Third-party libraries: Analytics, chat widgets, maps
- Subscriptions: Real-time databases, event streams

**Rule:** If no external system is involved, you probably don't need useEffect.

### Q2. Who triggers this?

- **User action** (click, type, submit) -> Use an **event handler**, not useEffect
- **Component lifecycle** (mount, prop change) -> Maybe useEffect, but check Q3

### Q3. How is the value calculated?

- **Derived from props/state** -> Calculate during render, not in useEffect
- **Requires external data** -> Consider React Query first
- **Requires cleanup** (subscription, listener) -> useEffect with cleanup function

---

## Common Mistakes Summary

### Category 1: Dependency Mismanagement
- Missing dependency array (infinite loop)
- Stale state values (reading state after setState in same closure)
- Missing dependency (stale props)
- Multiple effects for same dependency (combine related logic)
- Unstable object/function dependencies (use primitives or useCallback)

**Tip:** Enable `eslint-plugin-react-hooks` to catch these automatically.

### Category 2: Misusing Effects for Derived State
- Copying props to state with useEffect (derive directly from props instead)
- useEffect for values that don't need it (just use the prop)
- Resetting state on prop change (use `key` prop instead)

### Category 3: Cleanup Failures
- Uncancelled fetch requests (use AbortController)
- State updates after unmount (check isMounted + abort)
- Orphaned event listeners (always return cleanup)

### Category 4: Wrong Tool for the Job
- Event-specific logic in useEffect (use event handler)
- Library initialization in component effects (use app-level singleton)
- useEffect when useLayoutEffect is needed (DOM measurements, positioning)
- useEffect for external store subscriptions (use useSyncExternalStore)

Full code examples for all 15 mistakes: [reference/common-mistakes.md](reference/common-mistakes.md)

---

## Prefer React Query for Data Fetching

**Rule:** Don't use useEffect for fetching server data. Use React Query.

```typescript
// Good - React Query handles everything
function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll()
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <List users={users} />;
}
```

**React Query advantages:**
- Automatic caching and deduplication
- Background refetching
- Retry on failure
- Request cancellation
- Devtools for debugging
- No boilerplate for loading/error states

---

## When useEffect IS Appropriate

1. **Subscriptions** to external systems (WebSocket, event emitter)
2. **Event listeners** on window/document
3. **Third-party library** integration (charts, maps)
4. **Manual DOM manipulation** (focus, scroll)
5. **Timers** (setTimeout, setInterval)
6. **Logging/Analytics** on mount or state change

```typescript
// Good - WebSocket subscription
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (event) => setMessages(prev => [...prev, event.data]);
  return () => ws.close();
}, [url]);

// Good - focus on mount
useEffect(() => {
  inputRef.current?.focus();
}, []);

// Good - analytics on page view
useEffect(() => {
  analytics.trackPageView(pageName);
}, [pageName]);
```

---

## Quick Reference

| Scenario | Don't Use useEffect | Use Instead |
|----------|---------------------|-------------|
| Derive value from props | useEffect + setState | Compute during render |
| Fetch server data | useEffect + fetch | React Query |
| Respond to user action | useEffect watching state | Event handler |
| Initialize library once | useEffect in component | App-level singleton |
| DOM measurement before paint | useEffect | useLayoutEffect |
| External store subscription | useEffect | useSyncExternalStore |
| Reset state on prop change | useEffect + setState | key prop on component |

## ESLint Setup

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```
