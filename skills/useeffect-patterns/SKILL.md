---
name: useeffect-patterns
description: useEffect best practices, common mistakes, and when to use alternative approaches like React Query
globs: "**/*.tsx,**/*.ts"
---

# useEffect Best Practices

**Rule:** useEffect should be the exception, not the default. If you see it often, ask whether it's the right tool.

## Decision Framework: Three Questions Before useEffect

### Q1. Is there an external system?

useEffect is designed to synchronize React with **external systems**:
- Network: APIs, WebSockets, Server-Sent Events
- Browser APIs: DOM manipulation, localStorage, geolocation
- Third-party libraries: Analytics, chat widgets, maps
- Subscriptions: Real-time databases, event streams

**Rule:** If no external system is involved, you probably don't need useEffect.

### Q2. Who triggers this?

- **User action** (click, type, submit) → Use an **event handler**, not useEffect
- **Component lifecycle** (mount, prop change) → Maybe useEffect, but check Q3

### Q3. How is the value calculated?

- **Derived from props/state** → Calculate during render, not in useEffect
- **Requires external data** → Consider React Query first
- **Requires cleanup** (subscription, listener) → useEffect with cleanup function

---

## Category 1: Dependency Mismanagement

### Mistake 1: Missing Dependency Array (Infinite Loop)

```typescript
// Bad - causes infinite re-render loop
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // Triggers re-render → runs effect → infinite loop
  }); // No dependency array!

  return <div>{count}</div>;
}

// Good - runs only on mount
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(c => c + 1);
  }, []); // Empty array = run once

  return <div>{count}</div>;
}
```

### Mistake 2: Stale State Values

```typescript
// Bad - reading stale state after setState
function Component() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        console.log("Fetched user:", user); // Still null! Stale closure
      });
  }, []);

  return <div>{user?.name}</div>;
}

// Good - use data directly or react to changes
function Component() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        console.log("Fetched user:", data); // Use data directly
      });
  }, []);

  // Or log in separate effect when user changes
  useEffect(() => {
    if (user) console.log("User updated:", user);
  }, [user]);

  return <div>{user?.name}</div>;
}
```

### Mistake 3: Stale Props (Missing Dependency)

```typescript
// Bad - effect won't re-run when userId changes
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId);
  }, []); // Missing userId dependency!

  return <div>{user?.name}</div>;
}

// Good - include props in dependency array
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // Re-fetches when userId changes

  return <div>{user?.name}</div>;
}
```

**Tip:** Enable `eslint-plugin-react-hooks` to catch these automatically.

### Mistake 4: Multiple useEffects for Same Dependency

```typescript
// Bad - three separate effects for same trigger
function UserProfile({ userId }) {
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  useEffect(() => {
    getProfilePicture(userId);
  }, [userId]);

  useEffect(() => {
    setLoginInfo(userId);
  }, [userId]);
}

// Good - combine related logic
function UserProfile({ userId }) {
  useEffect(() => {
    fetchUser(userId);
    getProfilePicture(userId);
    setLoginInfo(userId);
  }, [userId]); // Single effect for related operations
}
```

**Exception:** Keep effects separate when they're truly unrelated (e.g., analytics vs WebSocket subscription).

### Mistake 5: Unstable Object/Function Dependencies

```typescript
// Bad - object recreated every render, effect runs every render
const user = { userId: 123, profile: {} };

useEffect(() => {
  fetchUser(user.userId);
}, [user]); // user is a new object every render!

// Good - use primitive values
const user = { userId: 123, profile: {} };

useEffect(() => {
  fetchUser(user.userId);
}, [user.userId]); // Stable primitive value

// Good - memoize functions if needed in deps
const fetchUserProfile = useCallback(() => {
  // fetch logic
}, [userId]);

useEffect(() => {
  fetchUserProfile();
}, [fetchUserProfile]);
```

---

## Category 2: Misusing Effects for Derived State

### Mistake 6: Copying Props to State with useEffect

This is the most common misuse of useEffect.

```typescript
// Bad - duplicates source of truth, causes extra renders
function MyComponent({ propValue }) {
  const [value, setValue] = useState();

  useEffect(() => {
    setValue(manipulate(propValue)); // Avoid!
  }, [propValue]);

  return <div>{value}</div>;
}

// Good - derive directly from props
function MyComponent({ propValue }) {
  const value = manipulate(propValue); // Computed on each render

  return <div>{value}</div>;
}
```

**Why the "Bad" pattern is harmful:**
- Duplicates source of truth (prop and state can desync)
- Causes extra re-renders (render → effect → setState → render again)
- More complex mental model

### Mistake 7: useEffect for Values That Don't Need It

```typescript
// Bad - useEffect is unnecessary
function EventTeam({ isOnTeam, isHelping }) {
  const [onTeam, setOnTeam] = useState(isOnTeam);

  useEffect(() => {
    setOnTeam(isOnTeam);
  }, [isOnTeam, isHelping]); // Why is isHelping here?
}

// Good - just use the prop
function EventTeam({ isOnTeam, isHelping }) {
  const onTeam = isOnTeam; // No state needed!
}
```

### Mistake 8: Resetting State with useEffect on Prop Change

```typescript
// Bad - causes extra render and inconsistent state
function HackathonDetails({ hackathon }) {
  const [judgeCache, setJudgeCache] = useState([]);
  const [panelCache, setPanelCache] = useState([]);

  useEffect(() => {
    // Clear caches when hackathon changes
    setJudgeCache([]);
    setPanelCache([]);
  }, [hackathon]);

  useEffect(() => {
    fetchJudgeDetails(hackathon.id).then(setJudgeCache);
  }, [hackathon.id]);
}

// Good - use key prop to let React handle reset
// Parent component:
<HackathonDetails key={hackathon.id} hackathon={hackathon} />

// Child component - state starts fresh automatically
function HackathonDetails({ hackathon }) {
  const [judgeCache, setJudgeCache] = useState([]);
  const [panelCache, setPanelCache] = useState([]);

  // No reset effect needed - key change remounts component

  useEffect(() => {
    fetchJudgeDetails(hackathon.id).then(setJudgeCache);
  }, [hackathon.id]);
}
```

**Caveat:** The key approach remounts the entire component. Use useEffect reset if you need to preserve some state while resetting other state.

---

## Category 3: Cleanup Failures

### Mistake 9: Uncancelled Fetch Requests

```typescript
// Bad - fetch continues after unmount
useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData);
}, []);

// Good - cancel with AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, []);
```

### Mistake 10: State Updates After Unmount

```typescript
// Bad - may update state after unmount (memory leak warning)
useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      setData(data);      // Component might be unmounted!
      setLoading(false);
    });
}, []);

// Good - check mounted status before setState
useEffect(() => {
  let isMounted = true;
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => {
      if (isMounted) {
        setData(data);
        setLoading(false);
      }
    });

  return () => {
    isMounted = false;
    controller.abort();
  };
}, []);
```

### Mistake 11: Orphaned Event Listeners

```typescript
// Bad - listener persists after unmount
useEffect(() => {
  window.addEventListener('resize', onResize);
}, []);

// Good - cleanup removes listener
useEffect(() => {
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
  };
}, [onResize]);
```

---

## Category 4: Wrong Tool for the Job

### Mistake 12: Event-Specific Logic in useEffect

```typescript
// Bad - effect watches state set by user action
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to cart!`);
  }
}, [product.isInCart]);

// Good - notification belongs in the event handler
const handleAddToCart = (product: Product) => {
  setCart(prev => [...prev, product]);
  showNotification(`Added ${product.name} to cart!`);
};
```

### Mistake 13: Library Initialization in Component Effects

```typescript
// Bad - initializes every time component mounts
useEffect(() => {
  initFacebookPixel();
  mermaid.initialize({ theme: 'dark' });
}, []);

// Good - initialize once at app level
// App.tsx
let isInitialized = false;

useEffect(() => {
  if (!isInitialized) {
    initFacebookPixel();
    mermaid.initialize({ theme: 'dark' });
    isInitialized = true;
  }
}, []);
```

### Mistake 14: useEffect When useLayoutEffect is Needed

useEffect runs **after** browser paint. useLayoutEffect runs **before** paint.

```typescript
// Bad - causes visual flicker
useEffect(() => {
  const rect = tooltipRef.current.getBoundingClientRect();
  setPosition({ x: rect.left, y: rect.top });
}, []);

// Good - runs before paint, no flicker
useLayoutEffect(() => {
  const rect = tooltipRef.current.getBoundingClientRect();
  setPosition({ x: rect.left, y: rect.top });
}, []);
```

**When to use useLayoutEffect:**
- DOM measurements (getBoundingClientRect, offsetWidth)
- Synchronous DOM mutations
- Tooltip/popover positioning

### Mistake 15: useEffect for External Store Subscriptions

```typescript
// Bad - manual subscription with useEffect
useEffect(() => {
  const unsubscribe = externalStore.subscribe(() => {
    setData(externalStore.getSnapshot());
  });
  setData(externalStore.getSnapshot());
  return unsubscribe;
}, []);

// Good - useSyncExternalStore (React 18+)
const data = useSyncExternalStore(
  externalStore.subscribe,
  externalStore.getSnapshot
);
```

---

## Prefer React Query for Data Fetching

**Rule:** Don't use useEffect for fetching server data. Use React Query.

```typescript
// Bad - manual data fetching with useEffect
function UserList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setIsLoading(true);
    fetch('/api/users', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setUsers(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <List users={users} />;
}

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

Enable the React Hooks ESLint plugin to catch dependency issues:

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
