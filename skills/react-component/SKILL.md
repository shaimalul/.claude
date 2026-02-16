---
name: react-component
description: React component patterns, hooks, state management, and Context usage for clean architecture. Use when writing or reviewing React components, custom hooks, or state management code in .tsx files.
globs: "**/*.tsx"
---

# React Component Conventions

## Three-Layer Architecture
```
UI Layer (Components) → Logic Layer (Hooks) → Data Layer (Services)
```

- **UI Layer**: TSX, event handlers, styling only
- **Logic Layer**: Custom hooks, business rules, utilities
- **Data Layer**: API clients, services, storage

## Component Organization

### File Structure
```typescript
// 1. Imports (external, then internal)
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { useDataService } from '../hooks/useDataService';
import { formatDate } from '../utils/dateUtils';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: (id: string) => void;
}

// 3. Component (named export only)
export const ComponentName: React.FC<ComponentProps> = ({ title, onAction }) => {
  // 4. Hooks first
  const { data, isLoading } = useDataService();

  // 5. Event handlers
  const handleClick = (id: string) => {
    onAction(id);
  };

  // 6. Render
  return <div>{/* ... */}</div>;
};
```

## State Management

### React Query for Server State
```typescript
// Bad - fetch in component
useEffect(() => { fetch('/api/data').then(...) }, []);

// Good - React Query + service
const { data, isLoading } = useQuery({
  queryKey: [QUERY_KEYS.DATA, filters],
  queryFn: () => dataService.getAll(filters)
});
```

### Context for DI Only
```typescript
// Good - dependency injection
const DependencyContext = createContext<Dependencies | null>(null);

export const DependencyProvider: React.FC<{
  overrides?: Partial<Dependencies>;
  children: React.ReactNode;
}> = ({ overrides, children }) => (
  <DependencyContext.Provider value={{ ...defaultDeps, ...overrides }}>
    {children}
  </DependencyContext.Provider>
);
```

## Patterns

### Never Pass setState to Children
```typescript
// Bad
<ChildComponent setSelectedItem={setSelectedItem} />

// Good - semantic callbacks
<ChildComponent onItemSelect={handleItemSelect} />

const handleItemSelect = (item: Item) => {
  setSelectedItem(item);
  setIsOpen(false);
};
```

### Avoid Prop Explosion (10+ Props)
```typescript
// Bad - 10+ props is a code smell
<Form
  name={name} onNameChange={setName}
  email={email} onEmailChange={setEmail}
  phone={phone} onPhoneChange={setPhone}
  /* ...10 more props */
/>

// Good - group into custom hook
const formState = useContactForm();
<Form {...formState} />

// Good - use Context for shared state
<FormProvider>
  <Form /> {/* reads from context */}
</FormProvider>
```

### Extract Business Logic to Utils
```typescript
// Bad - logic in TSX
<span>{score > 0.7 ? 'positive' : 'negative'}</span>

// Good - extracted to utility
import { classifySentiment } from '../utils/sentiment';
<SentimentBadge sentiment={classifySentiment(score)} />
```

### Use classnames for Conditional Classes
```typescript
// Bad
className={`card ${isSelected ? 'selected' : ''}`}

// Good
import classNames from 'classnames';
className={classNames('card', { selected: isSelected })}
```

### Const-Driven Types
```typescript
// Define options once
export const SORT_OPTIONS = [
  { value: 'date', label: 'Sort by Date' },
  { value: 'name', label: 'Sort by Name' },
] as const;

// Derive type
export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

// Type guard
export const isSortKey = (value: string): value is SortKey =>
  SORT_OPTIONS.some((opt) => opt.value === value);
```

### State Machine for Exclusive States
```typescript
// Bad - multiple booleans
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);

// Good - discriminated union
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data[] }
  | { status: 'error'; error: string };
```

### Return null, Not Empty Fragment
```typescript
// Bad
return options.length > 0 ? <List options={options} /> : <></>;

// Good
return options.length > 0 ? <List options={options} /> : null;
```

### Never Store JSX in Variables
```typescript
// Bad - recreated every render
const greeting = <div>Hello</div>;
return greeting;

// Good - JSX directly in return
return <div>Hello</div>;
```

### Stable Keys in Lists
```typescript
// Bad - uuid() breaks React diffing
{users.map(user => <Item key={uuid()} />)}

// Good - stable identifier from data
{users.map(user => <Item key={user.id} />)}
```

### Prefer Early Return
```typescript
// Bad - nested conditions
function Component({ user }) {
  if (user) {
    if (user.isActive) {
      return <ActiveUser />;
    }
  }
  return null;
}

// Good - flat structure
function Component({ user }) {
  if (!user) return null;
  if (!user.isActive) return <InactiveUser />;
  return <ActiveUser />;
}
```

### Don't Copy Props to State with useEffect
```typescript
// Bad - duplicates source of truth, causes extra renders
function MyComponent({ propValue }) {
  const [value, setValue] = useState();

  useEffect(() => {
    setValue(manipulate(propValue));  // Avoid!
  }, [propValue]);

  return <div>{value}</div>;
}

// Good - derive directly from props
function MyComponent({ propValue }) {
  const value = manipulate(propValue);  // Computed on each render
  return <div>{value}</div>;
}
```

### Extract Complex Conditions to Named Variables
```typescript
// Bad - hard to understand
if (!selectedSurveyGroup?.id || !cyclesDataBySurveyGroup || !cyclesDataBySurveyGroup[selectedSurveyGroup.id]) {
  return;
}

// Good - self-documenting
const selectedGroupId = selectedSurveyGroup?.id;
const hasCyclesData = selectedGroupId && cyclesDataBySurveyGroup?.[selectedGroupId];

if (!hasCyclesData) {
  return;
}
```

### useState vs useReducer

**Use useState** for simple, independent state:
```typescript
const [count, setCount] = useState(0);
const [name, setName] = useState('');
```

**Use useReducer** for complex state or when next state depends on previous:
```typescript
// Good - related state, predictable updates
const initialState = { name: '', age: '', email: '' };

const reducer = (state, action) => {
  switch (action.type) {
    case 'updateField':
      return { ...state, [action.field]: action.value };
    case 'reset':
      return initialState;
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```

## Memoization (useMemo/useCallback)

**Default: Don't use memoization.** Only add it when:
1. You've profiled and measured an actual performance problem
2. The computation is genuinely expensive (1000+ items, complex algorithms)
3. It's required for correctness (stable reference for useEffect deps)

```typescript
// Bad - premature optimization
const stats = useMemo(() => ({
  total: items.length,  // O(1)
  active: items.filter(x => x.active).length  // O(n) where n=8
}), [items]);

// Good - just compute it
const stats = {
  total: items.length,
  active: items.filter(x => x.active).length
};

// Good - genuinely expensive (measured problem)
const processed = useMemo(() =>
  largeDataset.map(expensiveTransform).sort(complexComparator),
  [largeDataset]  // 10,000+ items
);
```

**Why avoid premature memoization:**
- Adds cognitive overhead (dependency arrays, stale closure bugs)
- useMemo itself has overhead (comparison, caching)
- React re-renders are fast - don't optimize what isn't slow
- Makes code harder to read and maintain

## Navigation with Anchors

**Any UI element that triggers navigation MUST be an `<a>` element** for accessibility and standard browser behavior (open in new tab, copy link).

```tsx
// Good - Link component renders <a> for SPA navigation
import { Link } from 'react-router-dom';

<Link to={`/projects/${projectId}`}>{projectName}</Link>

// Good - with ZCD components
<ZCDMenuItem as={Link} to="/settings" />
<ZCDButton LinkComponent={Link} to="/dashboard" />

// Bad - click handler on non-anchor element
<div onClick={() => navigate('/projects')}>Go to Projects</div>  // Breaks a11y!
<Button onClick={() => navigate('/dashboard')}>Dashboard</Button>  // Avoid
```

## Rules
- Components under 100 lines
- One component per file
- Named exports only (no export default)
- No direct localStorage access (use storageService)
- No fetch() in components (use React Query)
- No business logic in TSX
- Use ZCD components from @zencity/common-ui
- Constants declared outside component function
- Return null (not `</>`) when rendering nothing
- Use stable keys for list items (never uuid())
- Navigation must use anchor elements (`<Link>`, not `onClick`)
- Don't copy props to state with useEffect - derive directly
- Don't use useMemo/useCallback unless you've measured a performance problem
