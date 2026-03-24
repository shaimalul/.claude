# Bug Finding Patterns

Systematic approach to identifying bugs from error context, stack traces, and code analysis.

## Error Log Analysis Patterns

### Uncaught Exception - Missing Null Check

```typescript
// Error: Uncaught (in promise) TypeError: Cannot read property 'x' of undefined

// Before (buggy)
const value = response.data.user.profile.name;

// After (fixed)
const value = response.data?.user?.profile?.name ?? 'Unknown';

// Or with type guard
if (response.data?.user?.profile) {
  const value = response.data.user.profile.name;
}
```

### CORS Error - Backend Configuration Issue

```typescript
// Error: Access to XMLHttpRequest blocked by CORS policy

// Fix: Configure CORS middleware

// Express
import cors from 'cors';
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));

// NestJS
app.enableCors({
  origin: configService.get('ALLOWED_ORIGINS'),
  credentials: true,
});
```

### 429 Too Many Requests - Rate Limiting

```typescript
// Error: 429 Too Many Requests

// Fix: Implement retry with exponential backoff
const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);
    if (response.status !== 429) return response;

    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Max retries exceeded');
};
```

---

## Stack Trace Analysis Patterns

### React: Maximum Update Depth Exceeded

```typescript
// Error: Maximum update depth exceeded. This can happen when a component
// calls setState inside useEffect, but useEffect either doesn't have a
// dependency array, or one of the dependencies changes on every render.

// Before (buggy) - object reference changes each render
const filters = { page: 1 }; // New object every render!
useEffect(() => {
  fetchData(filters);
}, [filters]);

// After (fixed) - stable reference
const filters = useMemo(() => ({ page: 1 }), []);
useEffect(() => {
  fetchData(filters);
}, [filters]);
```

### React: Cannot Update While Rendering

```typescript
// Error: Cannot update a component while rendering a different component

// Before (buggy) - setState called during render
function Parent() {
  const [count, setCount] = useState(0);
  return <Child onRender={() => setCount(c => c + 1)} />;
}

function Child({ onRender }) {
  onRender(); // Called during render phase!
  return <div>Child</div>;
}

// After (fixed) - use useEffect for side effects
function Child({ onRender }) {
  useEffect(() => {
    onRender();
  }, [onRender]);
  return <div>Child</div>;
}
```

### TypeError: X is not a function

```typescript
// Error: TypeError: someFunction is not a function

// Cause 1: Default vs named import mismatch
// Before (buggy)
import someFunction from './utils'; // But it's a named export!

// After (fixed)
import { someFunction } from './utils';

// Cause 2: Calling undefined
const obj = { method: undefined };
obj.method(); // TypeError

// Fix: Check existence
obj.method?.();
```

---

## Async/Promise Bug Patterns

### Unhandled Promise Rejection

```typescript
// Error: UnhandledPromiseRejectionWarning

// Before (buggy) - fire and forget
async function saveData() {
  apiClient.post('/data', payload); // Promise not awaited!
}

// After (fixed) - await and handle
async function saveData() {
  try {
    await apiClient.post('/data', payload);
  } catch (error) {
    logger.error('Failed to save data', { error });
    throw new DataSaveError('Save failed');
  }
}
```

### Race Condition - Stale Closure

```typescript
// Bug: Displaying data from previous request

// Before (buggy) - race condition
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

// After (fixed) - cancel stale requests
useEffect(() => {
  let cancelled = false;

  fetchUser(userId).then(user => {
    if (!cancelled) setUser(user);
  });

  return () => { cancelled = true; };
}, [userId]);

// Or with AbortController
useEffect(() => {
  const controller = new AbortController();

  fetchUser(userId, { signal: controller.signal })
    .then(setUser)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, [userId]);
```

---

## Null/Undefined Bug Patterns

### Cannot Read Property of Undefined

```typescript
// Error: TypeError: Cannot read property 'name' of undefined

// Checklist:
// 1. Is the data loaded? (async data not ready)
// 2. Is the path correct? (typo in property name)
// 3. Is the data shaped correctly? (API changed)

// Before (buggy)
function UserProfile({ user }) {
  return <div>{user.profile.name}</div>;
}

// After (fixed) - with loading state
function UserProfile({ user }) {
  if (!user?.profile) {
    return <LoadingSpinner />;
  }
  return <div>{user.profile.name}</div>;
}
```

### Array Method on Undefined

```typescript
// Error: Cannot read property 'map' of undefined

// Before (buggy)
function ItemList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
}

// After (fixed) - with default
function ItemList({ items = [] }) {
  return items.map(item => <Item key={item.id} {...item} />);
}

// Or with nullish coalescing
function ItemList({ items }) {
  return (items ?? []).map(item => <Item key={item.id} {...item} />);
}
```

---

## Type Error Patterns (TypeScript)

### Type Assertion Hiding Bugs

```typescript
// Bug: Runtime crash despite TypeScript "passing"

// Before (buggy) - assertion hides the bug
const user = apiResponse as User; // No runtime check!
console.log(user.email.toLowerCase()); // Crashes if email undefined

// After (fixed) - type guard with validation
const isUser = (data: unknown): data is User => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    typeof (data as { email: unknown }).email === 'string'
  );
};

if (isUser(apiResponse)) {
  console.log(apiResponse.email.toLowerCase()); // Safe!
}
```

---

## Database Bug Patterns

### N+1 Query Problem

```typescript
// Bug: Slow performance, many DB queries

// Before (buggy) - N+1 queries
const users = await userRepository.find();
for (const user of users) {
  user.posts = await postRepository.findByUserId(user.id); // N queries!
}

// After (fixed) - eager loading
const users = await userRepository.find({
  relations: ['posts'],  // TypeORM
});

// Or with query builder
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .getMany();
```

### Deadlock - Transaction Ordering

```typescript
// Error: Deadlock found when trying to get lock

// Before (buggy)
async function transfer(fromId, toId, amount) {
  await lockAccount(fromId);
  await lockAccount(toId); // Might deadlock!
}

// After (fixed) - consistent ordering
async function transfer(fromId, toId, amount) {
  const [first, second] = [fromId, toId].sort();
  await lockAccount(first);
  await lockAccount(second);
}
```

---

## Quick Reference

| Error Message | Likely Cause | First Check |
|---------------|--------------|-------------|
| Cannot read property 'x' of undefined | Null/undefined access | Add optional chaining, check data loading |
| Maximum update depth exceeded | Infinite loop in useEffect | Check dependency array for unstable refs |
| X is not a function | Wrong import or undefined | Check import statement, default vs named |
| Unhandled Promise Rejection | Missing catch or await | Add try-catch or .catch() |
| CORS error | Backend config | Check CORS middleware config |
| 429 Too Many Requests | Rate limiting | Add retry with backoff |
| Cannot update while rendering | setState in render | Move to useEffect |
| Deadlock | Transaction ordering | Lock in consistent order |
| N+1 queries | Missing eager load | Use relations or JOIN |
