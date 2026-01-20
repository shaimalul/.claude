---
name: refactoring-patterns
description: Frontend refactoring patterns for extracting services, hooks, and utilities from React components. Use when reviewing code or fixing code smells.
globs: "**/*.tsx,**/*.ts"
---

# Frontend Refactoring Patterns

Code smell detection and refactoring guidance for React/TypeScript applications.

## fetch() in Component → Service + React Query

Extract to service + React Query with axios:

```typescript
// Before (bad)
useEffect(() => { fetch('/api/data-items').then(...) }, []);

// After (good)
// services/dataItemService.ts
import axios from 'axios';

export const dataItemService = {
  getAll: async (filters) => {
    const { data } = await axios.get('/api/data-items', { params: filters });
    return data;
  }
};

// types/constants.ts - centralize query keys
export const QUERY_KEYS = {
  DATA_ITEMS: 'dataItems',
  USER: 'user',
} as const;

// hooks/useDataItems.ts
export const useDataItems = (filters) => useQuery({
  queryKey: [QUERY_KEYS.DATA_ITEMS, filters],
  queryFn: () => dataItemService.getAll(filters)
});
```

**Benefits of axios over fetch:**
- Automatic JSON parsing (no `.json()` call needed)
- Throws on HTTP errors (4xx/5xx) by default
- Better TypeScript support with generics
- Access to `error.response` for error handling

---

## Business Logic in TSX → Utility Function

Extract to utility function:

```typescript
// Before (bad)
<span>{dataItem.sentimentScore > 0.7 ? 'positive' : 'negative'}</span>

// After (good)
// utils/sentimentClassification.ts
export const classifySentiment = (dataItem: DataItem): Sentiment => {
  if (dataItem.sentimentScore > 0.7) return 'positive';
  if (dataItem.sentimentScore > 0.3) return 'neutral';
  return 'negative';
};

// Component
<SentimentBadge sentiment={classifySentiment(dataItem)} />
```

---

## Multiple useState for Related Data → Custom Hook

Extract to custom hook:

```typescript
// Before (bad)
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

// After (good) - use React Query or custom hook
const { data, isLoading, error } = useDataItems(filters);
```

---

## Never Pass setState to Child Components

Never pass setState functions directly to child components. This creates tight coupling and makes components harder to test and reuse. Instead, pass event handler callbacks with semantic names.

```typescript
// Before (bad) - child is coupled to parent's state implementation
<ChildComponent setSelectedItem={setSelectedItem} setIsOpen={setIsOpen} />

// After (good) - semantic callbacks that describe the action
<ChildComponent
  onItemSelect={handleItemSelect}
  onClose={handleClose}
/>

// Parent defines handlers that use setState internally
const handleItemSelect = (item: Item) => {
  setSelectedItem(item);
  setIsOpen(false);
};

const handleClose = () => {
  setIsOpen(false);
};
```

**Benefits:**
- Child components are decoupled from parent's state structure
- Easier to test - mock callbacks instead of state setters
- More reusable - child doesn't assume parent uses useState
- Self-documenting - callback names describe intent (onSelect vs setX)
- Parent controls state logic - can add validation, side effects, etc.

---

## 10+ Props on a Component → Refactor

This is a code smell indicating missing abstractions. Refactor using one of these strategies:

```typescript
// Bad - prop explosion (20 props!)
<TestCaseForm
  testSuiteId={testSuiteId}
  onTestSuiteChange={setTestSuiteId}
  name={name}
  onNameChange={setName}
  question={question}
  onQuestionChange={setQuestion}
  threshold={threshold}
  onThresholdChange={setThreshold}
  testSuites={testSuites}
  expectedOutput={expectedOutput}
  onExpectedOutputChange={setExpectedOutput}
  isEditing={isEditing}
  customerIds={customerIds}
  selectedCustomerId={selectedCustomerId}
  onCustomerChange={setSelectedCustomerId}
  canGenerate={canGenerate}
  isGenerating={isGeneratingBaseline}
  onGenerateBaseline={handleGenerateBaseline}
  generateTooltip={generateTooltip}
/>

// Good - Strategy 1: Custom hook for related state
const testCaseState = useTestCaseForm(defaultTestSuiteId);
const baselineState = useBaselineGeneration(customerIds);

<TestCaseForm {...testCaseState} {...baselineState} />

// Good - Strategy 2: Context for shared state
<TestCaseFormProvider defaultTestSuiteId={defaultTestSuiteId}>
  <TestCaseForm /> {/* Reads state from context */}
</TestCaseFormProvider>

// Good - Strategy 3: Composition with children
<TestCaseForm>
  <TestSuiteSelect />
  <ThresholdInput />
  <BaselineGenerator customerIds={customerIds} />
</TestCaseForm>
```

**When to use which strategy:**
- **Custom hook**: Related state that's only used in one component tree
- **Context**: State needed by 3+ components at different nesting levels
- **Composition**: When child components have distinct responsibilities

---

## Sorting/Filtering Logic in Component → Custom Hook

Extract to custom hook (no memoization needed for small datasets):

```typescript
// hooks/useSortedDataItems.ts
export const useSortedDataItems = (dataItems: DataItem[], sortBy: SortKey) => {
  const sorted = [...dataItems];
  switch (sortBy) {
    case 'date': return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case 'sentiment': return sorted.sort((a, b) => b.sentimentScore - a.sentimentScore);
    default: return sorted;
  }
};
```

---

## Derived/Computed Values → Custom Hook

Extract to custom hook (no memoization needed for small datasets):

```typescript
// hooks/useDataItemStats.ts
export const useDataItemStats = (dataItems: DataItem[]) => ({
  total: dataItems.length,
  positive: dataItems.filter(d => d.sentimentScore > 0.7).length,
  negative: dataItems.filter(d => d.sentimentScore < 0.3).length,
});
```

---

## Ternary Expressions in className → classnames Package

Use `classnames` package for conditional class composition:

```typescript
// Before (bad) - nested ternaries are hard to read
className={`card ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
className={`score ${value > 8 ? 'high' : value > 5 ? 'medium' : 'low'}`}

// After (good) - classNames with object syntax for boolean conditions
import classNames from 'classnames';

className={classNames('card', {
  selected: isSelected,
  active: isActive,
})}

// After (good) - extract level calculation to utility function
// utils/urgencyLevel.ts
export const getUrgencyLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score > 8) return 'high';
  if (score > 5) return 'medium';
  return 'low';
};

// Component
className={classNames('score', getUrgencyLevel(value))}
```

**Benefits:**
- More readable than nested ternaries
- Object syntax clearly shows boolean conditions
- Level calculation is testable as pure function
- No empty strings in generated className

---

## Hardcoded Option Lists → Const-Driven Types

Use const-driven types pattern - define options once, derive types from them:

```typescript
// Before (bad) - hardcoded values, types defined separately
type SortKey = 'date' | 'urgency' | 'patient' | 'status';

<select>
  <option value="date">Sort by Date</option>
  <option value="urgency">Sort by Urgency</option>
  {/* Easy to forget to add new option here when type changes */}
</select>

// After (good) - single source of truth with derived types
// types/services.ts
export const SORT_OPTIONS = [
  { value: 'date', label: 'Sort by Date' },
  { value: 'urgency', label: 'Sort by Urgency' },
  { value: 'patient', label: 'Sort by Patient' },
  { value: 'status', label: 'Sort by Status' },
] as const;

// Derive type from const array - adding an option auto-updates the type
export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

// ALWAYS derive types for ALL fields that use values from const arrays
// Bad - using string when const array exists
interface Prefs {
  sortBy: SortKey;      // Good - derived type
  filterStatus: string; // Bad - should be derived from STATUS_FILTER_OPTIONS
}

// Good - all fields use derived types
interface Prefs {
  sortBy: SortKey;
  filterStatus: StatusFilter; // Derived from STATUS_FILTER_OPTIONS
}

// Type guard derived from const array - keeps validation in sync
export const isSortKey = (value: string): value is SortKey =>
  SORT_OPTIONS.some((opt) => opt.value === value);

// Component - map over options, use type guard for onChange
<select onChange={(e) => {
  const value = e.target.value;
  if (isSortKey(value)) onSortChange(value);
}}>
  {SORT_OPTIONS.map((opt) => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

**Benefits:**
- Single source of truth for options and their types
- Adding/removing options automatically updates TypeScript types
- No risk of UI and types getting out of sync
- Type guard ensures runtime safety without casting
- Type guard stays in sync with options automatically (no separate list to maintain)

---

## localStorage/sessionStorage Direct Access → Storage Service

Extract to storage service:

```typescript
// services/storageService.ts
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
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded');
        return false;
      }
      throw e;
    }
  },
  remove: (key: string) => localStorage.removeItem(key),
};
```

---

## Quick Reference

| Code Smell | Refactoring |
|------------|-------------|
| `fetch()` in component | Extract to service + React Query |
| Business logic in TSX | Extract to `utils/` |
| Multiple related `useState` | Use custom hook or React Query |
| `setState` as prop | Pass semantic callbacks (`onItemSelect`) |
| 10+ props | Custom hook, Context, or composition |
| Sorting/filtering inline | Extract to custom hook |
| Derived values inline | Extract to custom hook |
| `className` ternaries | Use `classnames` package |
| Hardcoded options | Define const array, derive type |
| Direct `localStorage` | Use `storageService` |
