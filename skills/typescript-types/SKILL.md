---
name: typescript-types
description: TypeScript naming conventions, discriminated unions, and type patterns
globs: "**/*.ts,**/*.tsx"
---

# TypeScript Type Conventions

## Naming Conventions

### Constants: UPPER_SNAKE_CASE
```typescript
// Good
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'https://api.example.com';

// Bad
const max = 3;
const timeout = 5000;
```

### Enums: PascalCase name, UPPER_CASE keys, kebab-case values
```typescript
// Good
enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
}

enum UserRole {
  SUPER_ADMIN = 'super-admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Bad
enum httpCodes {
  ok = 200,
}

enum USERROLES {
  admin = 'admin',
}
```

### Interfaces: PascalCase, NO "I" prefix
```typescript
// Good
interface User {
  id: string;
  username: string;
  role: UserRole;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

// Bad
interface IUser { }
interface UserInterface { }
interface api_response { }
```

## Discriminated Unions (Over Optional Fields)

Use discriminated unions for type safety:

```typescript
// Bad - optional fields allow impossible states
type Shape = {
  radius?: number;   // Optional for rectangle
  width?: number;    // Optional for circle
  height?: number;   // Optional for circle
};

// Good - discriminated union
type Circle = { kind: 'circle'; radius: number };
type Rectangle = { kind: 'rectangle'; width: number; height: number };
type Shape = Circle | Rectangle;

// Usage with exhaustive checking
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
}
```

### Backend Example
```typescript
type NotificationPayload =
  | { type: 'email'; recipient: string; subject: string; body: string }
  | { type: 'sms'; phoneNumber: string; message: string }
  | { type: 'push'; deviceToken: string; title: string; body: string };

async function sendNotification(payload: NotificationPayload): Promise<void> {
  switch (payload.type) {
    case 'email':
      return emailService.send(payload.recipient, payload.subject, payload.body);
    case 'sms':
      return smsService.send(payload.phoneNumber, payload.message);
    case 'push':
      return pushService.send(payload.deviceToken, payload.title, payload.body);
  }
}
```

## Enum Naming: Singular vs Plural

### Singular - for single type/category
```typescript
// Single choice from mutually exclusive options
enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

enum EntityType {
  USER,
  POST,
  COMMENT,
}

const currentLevel: LogLevel = LogLevel.INFO;
```

### Plural - for collections/groups
```typescript
// Often used together or as arrays
enum Permissions {
  READ = 1,
  WRITE = 2,
  EXECUTE = 4,
  ADMIN = 8,
}

enum ValidationRules {
  REQUIRED = 'required',
  EMAIL = 'email',
  MIN_LENGTH = 'minLength',
}

const userPermissions = [Permissions.READ, Permissions.WRITE];
```

## Type Guards (Never Cast)

```typescript
// Bad - casting
const status = e.target.value as UserStatus;
const data = response as ApiResponse;

// Good - type guard
const isValidStatus = (s: string): s is UserStatus =>
  ['PENDING', 'ACTIVE', 'INACTIVE'].includes(s);

if (isValidStatus(value)) {
  // TypeScript knows value is UserStatus here
}

// Good - const-driven type guard
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
] as const;

export type Status = (typeof STATUS_OPTIONS)[number]['value'];

export const isStatus = (value: string): value is Status =>
  STATUS_OPTIONS.some((opt) => opt.value === value);
```

## Optional Parameter Syntax

Use optional parameter syntax (`?`) instead of union with `undefined`:

```typescript
// Bad - verbose and inconsistent
interface Props {
  versionId: string | undefined;
}

function fetchData(id: string | undefined) {
  // ...
}

// Good - idiomatic TypeScript
interface Props {
  versionId?: string;
}

function fetchData(id?: string) {
  // ...
}
```

**Why?**
- Shorter and more idiomatic
- Consistent with TypeScript conventions
- `?` implies the parameter can be omitted entirely
- `| undefined` suggests the value must be explicitly passed (even if undefined)

## Enums Over String Literals

Use enums instead of magic strings for status comparisons:

```typescript
// Bad - magic strings are error-prone and not type-safe
if (status === 'completed') { ... }
if (status === 'processing') { ... }
if (status === 'compl3ted') { ... }  // Typo not caught!

// Good - type-safe enums with autocomplete
import { EvaluationStatus } from 'types/evaluation';

if (status === EvaluationStatus.COMPLETED) { ... }
if (status === EvaluationStatus.PROCESSING) { ... }
if (status === EvaluationStatus.COMPL3TED) { ... }  // TypeScript error!
```

**Benefits:**
- Typos caught at compile time
- Autocomplete in IDE
- Single source of truth for valid values
- Refactoring support (rename propagates everywhere)
- Self-documenting code

## Type Inheritance Patterns (Single Source of Truth)

Never duplicate types. Use indexed access types to derive from source types:

### Indexed Access Types (`Type["property"]`)

```typescript
// Source type - single source of truth
interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Bad - duplicates the id type, breaks if User changes
interface CreatePostParams {
  authorId: string;  // If User.id becomes number, this breaks silently
  title: string;
}

// Good - derives from source type
interface CreatePostParams {
  authorId: User["id"];  // Always matches User.id type
  title: string;
}

// Good - function parameters
function getUserPosts(userId: User["id"]): Promise<Post[]> { ... }
function updateUserRole(userId: User["id"], role: User["role"]): Promise<void> { ... }
```

### Pick, Omit, Partial (For Multiple Properties)

```typescript
// Pick - select specific properties
type UserPreview = Pick<User, "id" | "email">;

// Omit - exclude properties
type CreateUserInput = Omit<User, "id" | "createdAt">;

// Partial - make all optional
type UpdateUserInput = Partial<Omit<User, "id">>;
```

### When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| `Type["prop"]` | Single property type | `userId: User["id"]` |
| `Pick<T, K>` | Subset of properties | `Pick<User, "id" \| "name">` |
| `Omit<T, K>` | All except some properties | `Omit<User, "password">` |
| `Partial<T>` | All properties optional | `Partial<UpdateInput>` |

### Anti-Patterns to Avoid

```typescript
// Bad - separate type that duplicates structure
type UserId = string;  // Disconnected from User.id

// Bad - inline type that duplicates
function getUser(id: string): User { ... }

// Bad - redefining enum values
const ACTIVE_STATUS = 'active';  // When enum exists

// Good - always reference the source
type UserId = User["id"];
function getUser(id: User["id"]): User { ... }
if (status === Status.ACTIVE) { ... }
```

## Function Naming: get vs create/make/determine

```typescript
// Good - get/fetch for data retrieval (API, database)
async function getUserById(id: string): Promise<User> {
  const response = await axios.get(`/api/users/${id}`);
  return response.data;
}

// Good - create/make for object construction
function createFilterOption(data: Data): FilterOption {
  return { key: data.id, label: data.name };
}

// Good - determine/compute for calculations
function determineUserRole(permissions: number): UserRole {
  if (permissions & Permissions.ADMIN) return 'admin';
  return 'user';
}

// Bad - get used for transformation (misleading)
function getUserOption(data: Data): FilterOption {  // Not fetching anything!
  return { key: data.id, label: data.name };
}
```

## State Machine Pattern

When you see multiple booleans that represent mutually exclusive states, use a discriminated union:

```typescript
// Bad - allows impossible states
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// What happens when isLoading && isError are both true?

// Good - impossible states impossible
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DataItem[] }
  | { status: 'error'; error: string };

const [state, setState] = useState<State>({ status: 'idle' });

// Usage
switch (state.status) {
  case 'idle':
    return <StartButton />;
  case 'loading':
    return <Spinner />;
  case 'success':
    return <DataList items={state.data} />;
  case 'error':
    return <ErrorMessage message={state.error} />;
}
```

**Benefits:**
- Type system prevents impossible states
- Single source of truth for async status
- Exhaustive switch handling (TypeScript warns on missed cases)
- Self-documenting state transitions
- Each state variant carries only its relevant data

**Use for:**
- API request states (idle → loading → success/error)
- Form states (editing → submitting → submitted/failed)
- Multi-step workflows (step1 → step2 → step3 → complete)
- Authentication states (anonymous → authenticating → authenticated/failed)

## Never Use
- Type casting with `as Type`
- `any` type
- `unknown` without type guards
- `I` prefix for interfaces
- Optional fields for discrimination
- `get` prefix for non-data-fetching functions
- Multiple booleans for mutually exclusive states
