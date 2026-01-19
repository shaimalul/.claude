# Principal Engineer Code Standards

Focus on SOLID principles, testability, clean architecture, and maintainability. These rules apply to both frontend and backend code.

## Modularity Rules (STRICT)

**Never write long files. Always split into modules.**

- **Files: Max 150 lines** - if longer, split into separate modules
- **Functions: Max 30 lines** - extract helper functions
- **Classes: Max 200 lines** - decompose into smaller classes
- **One responsibility per file** - if you need "and" to describe it, split it

```typescript
// Bad - 300 line file doing multiple things
// userController.ts - handles routes, validation, business logic, DB queries

// Good - split by responsibility
// controllers/userController.ts - HTTP handling only (50 lines)
// services/userService.ts - business logic (80 lines)
// repositories/userRepository.ts - data access (60 lines)
// validators/userValidator.ts - validation schemas (40 lines)
```

## Before Writing New Code (IMPORTANT)

**Always search the codebase first.** Before creating new types, interfaces, enums, utility functions, or constants:

1. **Search for existing implementations** in the feature/module you're working on
2. **Inherit/extend existing types** rather than creating duplicates
3. **Reuse existing utilities** - don't create a new `formatDate()` if one exists

```typescript
// Bad - creating duplicate type
interface UserResponse {  // Already exists in types/user.ts!
  id: string;
  name: string;
}

// Good - import and extend existing
import { User } from '../types/user';
type UserResponse = Pick<User, 'id' | 'name' | 'email'>;

// Bad - creating duplicate utility
const formatDate = (date: Date) => ...  // Already exists in utils/dateUtils.ts!

// Good - import existing
import { formatDate } from '../utils/dateUtils';
```

**Checklist before creating:**
- [ ] Searched `types/` folder for existing interfaces
- [ ] Searched `utils/` folder for existing helpers
- [ ] Searched `constants/` for existing enums/constants
- [ ] Checked if parent type can be extended with `Pick`, `Omit`, or `Partial`

## Core Principles

### Three-Layer Architecture

**Frontend:**
- **UI Layer**: Components (TSX, event handlers, styling). Only imports from Logic Layer.
- **Logic Layer**: Custom hooks, business rules, utilities. Only imports from Data Layer.
- **Data Layer**: API clients, services, storage. No imports from other layers.

**Backend:**
- **Controller Layer**: HTTP handlers, request/response. Only imports from Service Layer.
- **Service Layer**: Business logic, orchestration. Only imports from Repository Layer.
- **Repository Layer**: Data access, database queries. No imports from other layers.

### State Management
- Use **React Query** for server state (fetching, caching, mutations)
- Use **Context** only for dependency injection or low-frequency app state (auth, theme)
- Use **useState/useReducer** for local component state

## Refactoring Patterns

### When You See fetch() in a Component
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

Benefits of axios over fetch:
- Automatic JSON parsing (no `.json()` call needed)
- Throws on HTTP errors (4xx/5xx) by default
- Better TypeScript support with generics
- Access to `error.response` for error handling

### When You See Business Logic in TSX
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

### When You See Multiple useState for Related Data
Extract to custom hook:
```typescript
// Before (bad)
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

// After (good) - use React Query or custom hook
const { data, isLoading, error } = useDataItems(filters);
```

### Never Pass setState to Child Components
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

Benefits:
- Child components are decoupled from parent's state structure
- Easier to test - mock callbacks instead of state setters
- More reusable - child doesn't assume parent uses useState
- Self-documenting - callback names describe intent (onSelect vs setX)
- Parent controls state logic - can add validation, side effects, etc.

### When You See 10+ Props on a Component
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

### When You See Sorting/Filtering Logic in Component
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

### When You See Derived/Computed Values
Extract to custom hook (no memoization needed for small datasets):
```typescript
// hooks/useDataItemStats.ts
export const useDataItemStats = (dataItems: DataItem[]) => ({
  total: dataItems.length,
  positive: dataItems.filter(d => d.sentimentScore > 0.7).length,
  negative: dataItems.filter(d => d.sentimentScore < 0.3).length,
});
```

### When You See Ternary Expressions in className
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

Benefits:
- More readable than nested ternaries
- Object syntax clearly shows boolean conditions
- Level calculation is testable as pure function
- No empty strings in generated className

### When You See Hardcoded Option Lists in Components
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

Benefits:
- Single source of truth for options and their types
- Adding/removing options automatically updates TypeScript types
- No risk of UI and types getting out of sync
- Type guard ensures runtime safety without casting
- Type guard stays in sync with options automatically (no separate list to maintain)

### When You See localStorage/sessionStorage Direct Access
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

## Backend Refactoring Patterns

### When You See DB Query in Controller
Extract to repository:
```typescript
// Before (bad) - controller does data access
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users WHERE active = true');
  res.json(users);
});

// After (good) - repository handles data access
// repositories/userRepository.ts
export const userRepository = {
  findActive: async (filters?: UserFilters): Promise<User[]> => {
    return db.query('SELECT * FROM users WHERE active = true', filters);
  },
  findById: async (id: string): Promise<User | null> => {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  },
};

// controllers/userController.ts
app.get('/users', async (req, res) => {
  const users = await userRepository.findActive(req.query);
  res.json(users);
});
```

### When You See Business Logic in Controller
Extract to service:
```typescript
// Before (bad) - controller does business logic
app.post('/orders', async (req, res) => {
  const items = req.body.items;
  let total = 0;
  for (const item of items) {
    const product = await productRepo.findById(item.productId);
    if (product.stock < item.quantity) throw new Error('Out of stock');
    total += product.price * item.quantity;
  }
  if (req.user.membershipLevel === 'gold') total *= 0.9;
  const order = await orderRepo.create({ userId: req.user.id, items, total });
  await emailService.sendConfirmation(req.user.email, order);
  res.json(order);
});

// After (good) - service handles business logic
// services/orderService.ts
export const orderService = {
  create: async (userId: string, items: OrderItem[]): Promise<Order> => {
    await validateStock(items);
    const total = await calculateTotal(items, userId);
    const order = await orderRepository.create({ userId, items, total });
    await notificationService.sendOrderConfirmation(order);
    return order;
  },
};

// controllers/orderController.ts
app.post('/orders', async (req, res) => {
  const order = await orderService.create(req.user.id, req.body.items);
  res.json(toOrderResponse(order));
});
```

### When You See Raw DB Models in API Response
Use DTOs to control API contract:
```typescript
// Before (bad) - exposes internal structure
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(user); // includes passwordHash, internal IDs, soft delete flags
});

// After (good) - DTO controls what's exposed
// dtos/userDto.ts
export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

// controllers/userController.ts
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(toUserResponse(user));
});
```

### When You See Error Handling in Every Route
Centralize with error middleware:
```typescript
// Before (bad) - repeated try/catch
app.get('/users', async (req, res) => {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// After (good) - centralized error handling
// middleware/asyncHandler.ts
export const asyncHandler = (fn: RequestHandler) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// middleware/errorHandler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
  }
  console.error(err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal error' });
};

// controllers/userController.ts - clean, no try/catch
app.get('/users', asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
}));
```

### When You See Validation Logic Scattered
Centralize with validation schemas:
```typescript
// Before (bad) - validation in controller
app.post('/users', async (req, res) => {
  if (!req.body.email) throw new Error('Email required');
  if (!req.body.email.includes('@')) throw new Error('Invalid email');
  if (!req.body.password || req.body.password.length < 8) throw new Error('Password too short');
  // ...
});

// After (good) - validation schema
// validators/userValidator.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// middleware/validate.ts
export const validate = (schema: z.Schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  req.body = result.data;
  next();
};

// controllers/userController.ts
app.post('/users', validate(createUserSchema), asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(toUserResponse(user));
}));
```

### When You See Config/Secrets Hardcoded
Extract to config module:
```typescript
// Before (bad) - hardcoded values
const db = new Database('postgres://user:pass@localhost:5432/mydb');
const stripe = new Stripe('sk_live_xxx');

// After (good) - centralized config
// config/index.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
} as const;

// Validate required env vars on startup
const required = ['DATABASE_URL', 'STRIPE_SECRET_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

### Prefer Using Common UI

Always prefer to use components from our design system over creating new ones or using native HTML elements directly. This ensures consistent behavior and styling across our repos.

**Do:** Use components from `@zencity/common-ui` whenever possible.
```tsx
// Good
import { ZCDInput } from '@zencity/common-ui';

function MyFormComponent() {
  return <ZCDInput placeholder="Type here..." />;
}
```

**Don't:** Avoid using native HTML elements when a corresponding component exists in our design system.
```tsx
// Avoid
function MyFormComponent() {
  return <input placeholder="Type here..." />;
}
```

Similarly, prefer using colors from our design system to maintain visual consistency.

**Do:** Use colors from `@zencity/common-ui/zcd-colors`.
```scss
// Good
@use '@zencity/common-ui/zcd-colors';

.myComponent {
  background: zcd-colors.$zcd-blue-20;
}
```

**Don't:** Avoid using explicit color codes.
```scss
// Avoid
.myComponent {
  background: #3c87cd;
}
```

See the full component library: https://common-ui.zencity.io/

### Common UI Component Conventions

When creating ZCD components in `@zencity/common-ui`:

- **ZCD prefix**: All components start with `ZCD` (e.g., `ZCDButton`, `ZCDInput`)
- **CSS Modules**: Use `.module.scss` for component styles
- **Logical CSS**: Use `padding-inline-start` instead of `padding-left` for RTL support
- **No `style` prop**: Variants should be controlled through props, not inline styles

**className and customStyles patterns:**
```tsx
// Root component uses className prop
<div className={classNames(styles.card, className)}>
  {/* Nested components use customStyles */}
  <div className={customStyles?.header}>{header}</div>
  <div className={customStyles?.body}>{children}</div>
</div>

// Props interface
interface CardProps {
  className?: string;  // For root element
  customStyles?: {     // For nested elements
    header?: string;
    body?: string;
    footer?: string;
  };
}
```

## Dependency Injection Pattern

For testability, always use interfaces and Context for DI:

```typescript
// types/services.ts
interface IDataItemService {
  getAll(filters?: DataItemFilters): Promise<DataItem[]>;
  getById(id: string): Promise<DataItem | null>;
  classify(id: string): Promise<ClassificationResult>;
}

// context/DependencyContext.tsx
const DependencyContext = createContext<{ dataItemService: IDataItemService } | null>(null);

export const DependencyProvider: React.FC<{
  overrides?: { dataItemService?: IDataItemService };
  children: React.ReactNode;
}> = ({ overrides, children }) => (
  <DependencyContext.Provider value={{ dataItemService: overrides?.dataItemService ?? dataItemService }}>
    {children}
  </DependencyContext.Provider>
);

export const useDataItemService = () => {
  const ctx = useContext(DependencyContext);
  if (!ctx) throw new Error('Missing DependencyProvider');
  return ctx.dataItemService;
};
```

## Strategy Pattern for Complex Conditionals

When you see nested if/else or switch statements with item-type-specific logic:

```typescript
interface ItemUpdater {
  update(item: Item): void;
}

class NormalItemUpdater implements ItemUpdater {
  update(item: Item) { /* ... */ }
}

class SpecialItemUpdater implements ItemUpdater {
  update(item: Item) { /* ... */ }
}

const getUpdater = (type: string): ItemUpdater => {
  const updaters: Record<string, ItemUpdater> = {
    'special': new SpecialItemUpdater(),
  };
  return updaters[type] ?? new NormalItemUpdater();
};

// Clean usage
items.forEach(item => getUpdater(item.type).update(item));
```

## State Machine Pattern

When you see multiple booleans that represent mutually exclusive states:

```typescript
// Before (bad) - allows impossible states
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// After (good) - impossible states impossible
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DataItem[] }
  | { status: 'error'; error: string };

const [state, setState] = useState<State>({ status: 'idle' });
```

## AHA - Avoid Hasty Abstractions

**Start with WET (Write Everything Twice), move to DRY only when patterns are stable.**

```typescript
// Bad - premature abstraction with too many variants
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isFullWidth,
  isLoading,
  // ... 10 more props for edge cases
}) => {
  // Complex conditional logic
};

// Good - specific components for specific use cases
const PrimaryButton = ({ children, onClick }: ButtonBaseProps) => (
  <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={onClick}>
    {children}
  </button>
);

const LoadingButton = ({ children, isLoading }: LoadingButtonProps) => (
  <button className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isLoading}>
    {isLoading ? <Spinner /> : children}
  </button>
);
```

**Decision Framework:**
1. Will this abstraction simplify the codebase?
2. Is the pattern stable and unlikely to diverge?
3. Would a new team member understand it easily?
4. If "no" to any - keep code WET

## React Anti-Patterns to Avoid

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

### Return null Instead of Empty Fragment
```typescript
// Bad - empty fragment still creates an object
function MyComponent({ options }) {
  return options.length > 0 ? <OptionsList options={options} /> : <></>;
}

// Good - null signals "render nothing"
function MyComponent({ options }) {
  return options.length > 0 ? <OptionsList options={options} /> : null;
}
```

### Never Store React Components in Variables
```typescript
// Bad - component recreated every render
function MyComponent() {
  const greeting = <div>Hello, {userName}</div>;  // Recreated each render!
  return greeting;
}

// Good - JSX directly in return
function MyComponent() {
  return <div>Hello, {userName}</div>;
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

### Use Stable Keys in Lists (Never uuid())
```typescript
// Bad - uuid() creates new key every render, breaks React diffing
{users.map((user) => <tr key={uuid()}>{user.name}</tr>)}

// Good - stable, unique identifier from data
{users.map((user) => <tr key={user.id}>{user.name}</tr>)}
```

### Prefer Early Return
```typescript
// Bad - deeply nested
function checkUser(user) {
  let message;
  if (user) {
    if (user.isActive) {
      message = `Welcome, ${user.name}`;
    } else {
      message = 'User is not active';
    }
  } else {
    message = 'No user provided';
  }
  return message;
}

// Good - early return, flat structure
function checkUser(user) {
  if (!user) return 'No user provided';
  if (!user.isActive) return 'User is not active';
  return `Welcome, ${user.name}`;
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

## Navigation with Anchor Elements

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

## Code Style

- Prefer `const` over `let`
- Use TypeScript strict mode
- **Never use `export default`** - always use named exports for better refactoring and IDE support:
  ```typescript
  // Bad - export default
  export default function UserService() { ... }
  import UserService from './userService'; // Can be renamed on import, hard to track

  // Good - named export
  export const userService = { ... };
  import { userService } from './userService'; // Consistent name everywhere
  ```
- **Never use index.ts barrel files** - import directly from source files:
  ```typescript
  // Bad - barrel file (index.ts)
  // utils/index.ts
  export * from './formatDate';
  export * from './validateEmail';
  // Then: import { formatDate } from './utils';

  // Good - direct imports
  import { formatDate } from './utils/formatDate';
  import { validateEmail } from './utils/validateEmail';
  ```
  Why: Barrel files cause circular dependencies, slow builds, and make dead code elimination harder.
- **Never use raw HTTP status numbers** - always use the `http-status-codes` package:
  ```typescript
  // Bad - magic numbers
  res.status(404).json({ error: 'Not found' });
  res.status(500).json({ error: 'Server error' });

  // Good - self-documenting
  import { StatusCodes } from 'http-status-codes';
  res.status(StatusCodes.NOT_FOUND).json({ error: 'Not found' });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error' });
  ```
- **Never cast with `any` or `unknown`** - fix types properly or use type guards:
  ```typescript
  // Bad - casting to any/unknown
  const data = response.data as any;
  const value = someValue as unknown as MyType;

  // Good - proper typing
  const data: ApiResponse = response.data;

  // Good - type guard for unknown
  const isUser = (value: unknown): value is User =>
    typeof value === 'object' && value !== null && 'id' in value;

  if (isUser(data)) {
    console.log(data.id); // TypeScript knows it's User
  }
  ```
- **Never use type casting (`as Type`)** - fix the types properly instead:
  ```typescript
  // Bad - using casting
  const value = someValue as string;
  const status = e.target.value as Scan['status'];

  // Good - use type guards, generics, or proper typing
  const value: string = someValue; // Let TypeScript infer or error

  // Good - use type guard functions
  const isValidStatus = (s: string): s is DataItem['status'] =>
    ['PENDING', 'CLASSIFIED', 'REVIEWED', 'ARCHIVED'].includes(s);

  // Good - use generics with constraints
  function parseValue<T>(input: unknown): T | null { ... }
  ```
- Name booleans with `is`, `has`, `should` prefix
- Name handlers with `handle` prefix (handleClick, handleSubmit)
- Name hooks with `use` prefix
- **Use `get`/`fetch` only for data retrieval** - use `create`, `make`, `determine`, `format` for transformations:
  ```typescript
  // Good - get/fetch for API calls
  async function getLatestResults() {
    const response = await axios.get('/api/results');
    return response.data;
  }

  // Good - create/make for object construction
  function createFilterOption(dateRanges) {
    return { key: 'latest', label: 'Latest', id: determineLatestId(dateRanges) };
  }

  // Bad - get used for transformation
  function getFilterOption(dateRanges) {  // Misleading - not fetching data
    return { key: 'latest', ... };
  }
  ```
- **Declare constants outside component functions** - avoids recreation on every render:
  ```typescript
  // Good - constant declared outside
  const TRANSLATION_PATH = 'forms.inputFields';

  export const CustomInput: React.FC<Props> = ({ ... }) => {
    // component code
  };

  // Bad - constant recreated every render
  export const CustomInput: React.FC<Props> = ({ ... }) => {
    const translationPath = 'forms.inputFields';  // Avoid
  };
  ```
- Keep components under 100 lines
- Extract magic numbers/strings to named constants
- **Use constants for React Query keys** - prevents typos and enables refactoring:
  ```typescript
  // Bad - raw strings scattered across files
  queryKey: ['dataItems', filters]
  queryClient.invalidateQueries({ queryKey: ['dataItems'] });

  // Good - centralized constants
  export const QUERY_KEYS = { DATA_ITEMS: 'dataItems', USER: 'user' } as const;
  queryKey: [QUERY_KEYS.DATA_ITEMS, filters]
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DATA_ITEMS] });
  ```
- Avoid deprecated APIs - use modern alternatives:
  ```typescript
  // Bad - DOMException.code is deprecated
  if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError'))

  // Good - use e.name only
  if (e instanceof DOMException && e.name === 'QuotaExceededError')
  ```
- **Never use `console.log` in production code** - use proper logging services or remove before commit:
  ```typescript
  // Bad - console.log left in production code
  console.log('user data:', userData);
  console.log('API response:', response);

  // Good - use a proper logging service
  import { logger } from './services/logger';
  logger.info('Processing request', { userId: userData.id });
  logger.debug('API response received', { status: response.status });

  // Good - for temporary debugging, use clear markers and remove before PR
  // TODO: REMOVE BEFORE MERGE
  console.log('DEBUG:', someValue);
  ```
  Why: console.log statements clutter production logs, may expose sensitive data, and indicate incomplete code.
- Don't add redundant comments that restate the filename or obvious code:
  ```css
  /* Bad - filename already says this */
  /* ScanCard styles */
  .scan-card { ... }

  /* Good - no redundant comment */
  .scan-card { ... }
  ```

### When You See Raw HTTP Status Codes
Use the `http-status-codes` package instead of magic numbers:
```typescript
// Before (bad) - what does 429 mean?
if (response.status === 429) throw new Error('Rate limited');

// After (good) - self-documenting
import { StatusCodes } from 'http-status-codes';

if (response.status === StatusCodes.TOO_MANY_REQUESTS)
  throw new Error('Rate limited');
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

## File Structure

### Backend Structure
```
src/
├── controllers/    # HTTP handlers (thin, delegate to services)
├── services/       # Business logic layer
├── repositories/   # Data access layer
├── models/         # Database entities
├── dtos/           # API request/response shapes
├── middleware/     # Auth, validation, error handling
├── validators/     # Zod/Joi schemas
└── config/         # Environment config
```

### Frontend Structure
```
src/
├── components/           # Shared UI components (+ co-located CSS)
│   └── ComponentName/
│       ├── ComponentName.tsx
│       ├── ComponentName.spec.tsx
│       └── ComponentName.module.scss
├── screens/              # Page-level components
│   └── HomeScreen/
│       ├── HomeScreen.tsx
│       └── components/   # Screen-specific components
├── hooks/                # Custom hooks
├── contexts/             # React Context providers
├── services/             # API clients
├── mocks/                # Mock files (*.mock.ts)
├── utils/                # Pure functions
├── types/                # TypeScript interfaces
└── styles/               # Global CSS only
```

### Multi-Domain Structure (e.g., backoffice + dashboard)
```
src/
├── common/               # Shared across all domains
│   ├── hooks/
│   ├── contexts/
│   └── components/
├── backoffice/           # Domain-specific code
│   ├── hooks/
│   ├── contexts/
│   └── features/
│       └── SurveysList/
│           ├── hooks/     # Feature-specific hooks
│           ├── contexts/  # Feature-specific contexts
│           └── components/
└── dashboard/
```

**Rules:**
- Feature-specific hooks/contexts stay within their feature directory
- When used by 2+ features in same domain, move to `[domain]/hooks` or `[domain]/contexts`
- When used across domains, move to `common/`

### CSS File Organization
Always co-locate CSS with components - one CSS file per component:
```typescript
// Bad - monolithic CSS file
import '../App.css'; // 500+ lines covering all components

// Good - component-specific CSS
// ScanCard.tsx
import './ScanCard.css';

// ScanDetailPanel.tsx
import './ScanDetailPanel.css';
```

Structure:
- `src/styles/base.css` - Global resets, body styles, `.app` container only
- `src/components/ComponentName.css` - Styles specific to that component

Benefits:
- Easy to find styles (next to the component)
- No global namespace pollution
- Component deletion removes its styles automatically
- Smaller bundles with code splitting

## Package Exports (for npm packages)

Organize exports around logical domains for better tree-shaking and developer experience:

### Explicit Named Exports
```typescript
// Good - explicit exports in index.ts
export { fetchUser, updateUser } from './user/userActions';
export { selectUserProfile } from './user/userSelectors';
export type { User, UserRole } from './types';  // Use 'export type' for types

// Bad - wildcard exports
export * from './user/userActions';  // Makes API unclear, hides what's exported
```

### Domain-Oriented Subpath Exports
```json
// package.json - subpath exports
{
  "exports": {
    ".": "./dist/index.js",
    "./user": "./dist/user/index.js",
    "./auth": "./dist/auth/index.js"
  }
}
```

### JSDoc for Public Exports
```typescript
/**
 * Fetches user data from the API
 * @param userId - The ID of the user to fetch
 * @returns A promise that resolves to the user data
 * @example
 * const user = await fetchUser('123');
 */
export function fetchUser(userId: string): Promise<User> {
  // ...
}
```

## Testing Considerations

When refactoring, always consider: "Can this be unit tested?"

- Pure functions → Easy to test
- Hooks with injected dependencies → Easy to test
- Components with Context DI → Easy to test with mock providers
- Components with direct fetch/localStorage → Hard to test (refactor!)

## Post-Implementation Verification (REQUIRED)

**After completing any implementation, ALWAYS run these checks in order:**

1. **Tests** (if available in the repo)
   ```bash
   npm test
   # or: npm run test, yarn test, pnpm test
   ```

2. **TypeScript Check**
   ```bash
   npx tsc --noEmit
   # or: npm run typecheck, npm run ts:check
   ```

3. **Lint**
   ```bash
   npm run lint
   # or: npm run lint:fix to auto-fix issues
   ```

4. **Build**
   ```bash
   npm run build
   ```

**Rules:**
- Fix ALL errors before considering the task complete
- If tests fail, fix them before moving on
- If TypeScript errors exist, resolve type issues
- If lint errors occur, fix or explain why they're acceptable
- Build must succeed - never leave broken builds

## Interview Communication

- Think out loud while refactoring
- Explain WHY you're making each change
- Frame decisions around: testability, maintainability, team scalability
- For civic data domain: frame around data integrity ("This needs to be testable because sentiment classification accuracy is critical for citizen feedback")

---

## Backend Standards (Node.js/Express/NestJS)

### Three-Layer Architecture (STRICT)
```
Controller Layer → Service Layer → Repository Layer
     (HTTP)         (Business)        (Data)
```

**Rules:**
- Controllers ONLY handle HTTP request/response
- Services contain ALL business logic
- Repositories handle ALL database operations
- Never skip layers (Controller → Repository is WRONG)

### NestJS Module Pattern
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Only export services
})
export class UsersModule {}
```

### Express Middleware Pattern
```typescript
// Wrap async handlers
export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Centralized error handling
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(status).json({ status: 'error', message: err.message });
};
```

### Validation with Zod
```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

---

## AI/ML Integration Standards

### OpenAI Service Pattern
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

// Always handle errors
async function safeChat(messages: Message[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });
    return response.choices[0]?.message?.content ?? '';
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle specific error codes
    }
    throw error;
  }
}
```

### Streaming Responses
```typescript
async function* streamChat(messages: Message[]): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
```

### Prompt Engineering
- Clear role and context in system prompt
- Few-shot examples for complex tasks
- Chain of thought for reasoning
- JSON mode for structured output
- Token management for cost control

---

## DevOps Standards

### Docker Multi-Stage Build
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER nodeuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

### Kubernetes Requirements
- Resource limits on all containers
- Liveness and readiness probes
- Rolling update strategy
- Secrets for sensitive data
- ConfigMaps for configuration

### Terraform Standards
- Remote state with locking
- Modular structure
- Environment separation
- Variable validation
- Encryption enabled

### CI/CD Requirements
- Test stage before build
- Caching for dependencies
- Environment protection rules
- Manual approval for production
- Docker layer caching

---

## Security Standards

### OWASP Top 10 Checklist
- [ ] Injection prevention (parameterized queries)
- [ ] Strong authentication (bcrypt, JWT)
- [ ] Sensitive data encryption
- [ ] Access control on every request
- [ ] Security headers configured
- [ ] XSS prevention (output sanitization)
- [ ] CSRF protection
- [ ] Dependency scanning
- [ ] Security logging
- [ ] Rate limiting

### Input Validation (ALWAYS)
```typescript
// Validate ALL user inputs server-side
const result = schema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### Secrets Management
```typescript
// NEVER hardcode secrets
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY required');
```

### Security Headers
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);
```

---

## Principal Engineering Team

This codebase uses a team of specialized AI agents for principal-engineer level development:

### Available Specialists
| Command | Agent | Expertise |
|---------|-------|-----------|
| `/principal frontend` | frontend-principal | React, TypeScript, components |
| `/principal backend` | backend-principal | Node.js, NestJS, APIs |
| `/principal ai` | ai-principal | OpenAI, prompts, RAG |
| `/principal devops` | devops-principal | Docker, K8s, Terraform |
| `/principal security` | security-principal | OWASP, auth, vulnerabilities |

### Key Commands
- `/plan-feature [description]` - Plan a feature with the mastermind
- `/build-feature` - Execute the planned feature
- `/architect [topic]` - Get architecture guidance
- `/quality-gate` - Run comprehensive quality checks
- `/standup` - Get status report
