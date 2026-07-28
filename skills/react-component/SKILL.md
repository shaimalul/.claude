---
name: react-component
description: React component patterns, hooks, state management, and Context usage for clean architecture. Use when writing or reviewing React components, custom hooks, or state management code in .tsx files.
globs: "**/*.tsx"
user-invocable: false
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

### Presentational / Container Split

Separate UI from logic. Presentational components receive data via props; container components manage state and side effects.

```typescript
function UserForm({ formData, onInputChange, onSubmit }: UserFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Input name="name" value={formData.name} onChange={onInputChange} />
      <Input name="email" value={formData.email} onChange={onInputChange} />
      <Button type="submit" text="Save" />
    </form>
  );
}

function UserFormContainer() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    userService.update(formData);
  };

  return <UserForm formData={formData} onInputChange={handleInputChange} onSubmit={handleSubmit} />;
}
```

## Project Structure

One component per file. Each component gets its own folder with co-located tests.

```
src/
├── components/           # Shared across screens
│   └── UserCard/
│       ├── UserCard.tsx
│       ├── UserCard.spec.tsx
│       └── helpers.ts
├── screens/
│   └── HomeScreen/
│       ├── HomeScreen.tsx
│       └── components/   # Screen-specific only
├── hooks/                # Shared custom hooks
├── contexts/             # Context providers
├── services/             # API clients
└── common/               # Cross-domain shared code
    ├── hooks/
    └── contexts/
```

- Screen-specific components live in `screens/ScreenName/components/`
- Shared components live in `src/components/`
- Feature-specific hooks/contexts stay in their feature directory
- Promote to `common/` only when used across 3+ features

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

### React Query: Guard Falsy Keys with `enabled`

When a query key parameter comes from route params or optional state, always add `enabled: !!id` to prevent malformed requests when the value is empty/undefined.

```typescript
// Bad - fires request to /api/initiatives/ when id is ''
const id = router.params?.id ?? '';
const { data } = useQuery([QueryKeys.INITIATIVE, id], () => api.getById(id));

// Good - query is disabled until id is truthy
const id = router.params?.id ?? '';
const { data } = useQuery([QueryKeys.INITIATIVE, id], () => api.getById(id), {
  enabled: !!id,
});
```

**When to apply:** Any `useQuery` where the query key contains a value that can be empty string, undefined, or null (route params, optional props, derived IDs).

### Context: Provider + Custom Hook

Use Context when the same state is needed in 3+ components. Always split into a Provider and a custom hook with an error guard.

```typescript
const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const handleUserChange = (newUser: User | null) => setUser(newUser);

  return (
    <UserContext.Provider value={{ user, onUserChange: handleUserChange }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
```

Context guidelines:
- Don't use Context for state local to 1-2 components (use props)
- Don't create one monolithic context for the entire app
- Create separate, focused contexts per domain
- For dependency injection / testing overrides:

```typescript
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

### useState vs useReducer

**useState** for simple, independent values:
```typescript
const [count, setCount] = useState(0);
const [name, setName] = useState('');
```

**useReducer** for complex state or when next state depends on previous:
```typescript
const initialState = { name: '', age: '', email: '' };

const reducer = (state: typeof initialState, action: FormAction) => {
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

### Storage Service (No Direct localStorage)

Never access `localStorage`/`sessionStorage` directly. Use a typed service:

```typescript
export const storageService = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  },
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') return false;
      throw e;
    }
  },
  remove: (key: string) => localStorage.removeItem(key),
};
```

## Patterns

### Event Handler Naming

- **Internal handlers**: `handle` prefix -- `handleClick`, `handleSubmit`
- **Callback props**: `on` prefix -- `onClick`, `onSubmit`

```typescript
function Parent() {
  const handleItemSelect = (item: Item) => { setSelected(item); };
  return <ItemList onItemSelect={handleItemSelect} />;
}

function ItemList({ onItemSelect }: { onItemSelect: (item: Item) => void }) {
  return items.map(item => <li key={item.id} onClick={() => onItemSelect(item)} />);
}
```

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
<Form name={name} onNameChange={setName} email={email} onEmailChange={setEmail} />

// Good - group into custom hook
const formState = useContactForm();
<Form {...formState} />

// Good - use Context for shared state
<FormProvider>
  <Form />
</FormProvider>
```

### Constants Outside Component

Declare constants outside the component function. Use constant objects instead of inline string literals.

```typescript
const TRANSLATION_PATH = 'forms.inputFields';

const BUTTON_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
} as const;

export function MyButton({ variant }: { variant: string }) {
  if (variant === BUTTON_VARIANT.PRIMARY) { /* ... */ }
}
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
export const SORT_OPTIONS = [
  { value: 'date', label: 'Sort by Date' },
  { value: 'name', label: 'Sort by Name' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

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
function Component({ user }: { user?: User }) {
  if (!user) return null;
  if (!user.isActive) return <InactiveUser />;
  return <ActiveUser user={user} />;
}
```

### Don't Copy Props to State with useEffect
```typescript
// Bad - duplicates source of truth
function MyComponent({ propValue }) {
  const [value, setValue] = useState();
  useEffect(() => { setValue(manipulate(propValue)); }, [propValue]);
  return <div>{value}</div>;
}

// Good - derive directly from props
function MyComponent({ propValue }) {
  const value = manipulate(propValue);
  return <div>{value}</div>;
}
```

### Extract Complex Conditions to Named Variables
```typescript
// Bad
if (!selectedGroup?.id || !cyclesData || !cyclesData[selectedGroup.id]) { return; }

// Good
const selectedGroupId = selectedGroup?.id;
const hasCyclesData = selectedGroupId && cyclesData?.[selectedGroupId];
if (!hasCyclesData) { return; }
```

## Memoization (useMemo/useCallback)

**Default: Don't use memoization.** Only add it when:
1. You've profiled and measured an actual performance problem
2. The computation is genuinely expensive (1000+ items, complex algorithms)
3. It's required for correctness (stable reference for useEffect deps)

```typescript
// Bad - premature optimization
const stats = useMemo(() => ({
  total: items.length,
  active: items.filter(x => x.active).length
}), [items]);

// Good - just compute it
const stats = {
  total: items.length,
  active: items.filter(x => x.active).length
};

// Good - genuinely expensive (measured problem)
const processed = useMemo(() =>
  largeDataset.map(expensiveTransform).sort(complexComparator),
  [largeDataset]
);
```

## Navigation with Anchors

**Navigation MUST use `<a>` elements** for accessibility (open in new tab, copy link).

```tsx
// Good
import { Link } from 'react-router-dom';
<Link to={`/projects/${projectId}`}>{projectName}</Link>
<MenuItem as={Link} to="/settings" />

// Bad - breaks a11y
<div onClick={() => navigate('/projects')}>Go</div>
```

## Rules
- Components under 100 lines, one per file
- Named exports only (no export default)
- No direct localStorage (use storageService)
- No fetch() in components (use React Query)
- No business logic in TSX
- Use design system components over native HTML where an equivalent exists
- Constants declared outside component function
- String literals in constants, not inline
- `handle` prefix for internal handlers, `on` prefix for callback props
- Return null (not `</>`) when rendering nothing
- Stable keys for list items (never uuid())
- Navigation via anchor elements (`<Link>`, not `onClick`)
- Don't copy props to state with useEffect
- Don't use useMemo/useCallback unless measured
- Context for state shared across 3+ components; props for 1-2
