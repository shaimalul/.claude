# useEffect Common Mistakes - Detailed Examples

## Category 1: Dependency Mismanagement

### Mistake 1: Missing Dependency Array (Infinite Loop)

```typescript
// Bad - causes infinite re-render loop
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // Triggers re-render -> runs effect -> infinite loop
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

### Mistake 4: Multiple useEffects for Same Dependency

```typescript
// Bad - three separate effects for same trigger
function UserProfile({ userId }) {
  useEffect(() => { fetchUser(userId); }, [userId]);
  useEffect(() => { getProfilePicture(userId); }, [userId]);
  useEffect(() => { setLoginInfo(userId); }, [userId]);
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

**Exception:** Keep effects separate when they're truly unrelated.

### Mistake 5: Unstable Object/Function Dependencies

```typescript
// Bad - object recreated every render, effect runs every render
const user = { userId: 123, profile: {} };
useEffect(() => {
  fetchUser(user.userId);
}, [user]); // user is a new object every render!

// Good - use primitive values
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

### Mistake 7: useEffect for Values That Don't Need It

```typescript
// Bad - useEffect is unnecessary
function EventTeam({ isOnTeam, isHelping }) {
  const [onTeam, setOnTeam] = useState(isOnTeam);

  useEffect(() => {
    setOnTeam(isOnTeam);
  }, [isOnTeam, isHelping]);
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
    setJudgeCache([]);
    setPanelCache([]);
  }, [hackathon]);
}

// Good - use key prop to let React handle reset
// Parent: <HackathonDetails key={hackathon.id} hackathon={hackathon} />
// Child state starts fresh automatically - no reset effect needed
```

**Caveat:** The key approach remounts the entire component. Use useEffect reset if you need to preserve some state while resetting other state.

---

## Category 3: Cleanup Failures

### Mistake 9: Uncancelled Fetch Requests

```typescript
// Bad - fetch continues after unmount
useEffect(() => {
  fetch('/api/data').then(res => res.json()).then(setData);
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

useEffect runs after browser paint. useLayoutEffect runs before paint.

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
