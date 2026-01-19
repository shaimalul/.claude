---
name: react-component
description: React component patterns, hooks, state management, and Context usage for clean architecture
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
