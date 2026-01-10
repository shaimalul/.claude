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

## Rules
- Components under 100 lines
- One component per file
- Named exports only (no export default)
- No direct localStorage access (use storageService)
- No fetch() in components (use React Query)
- No business logic in TSX
- Use ZCD components from @zencity/common-ui
