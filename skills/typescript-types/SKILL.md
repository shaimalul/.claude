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

## Never Use
- Type casting with `as Type`
- `any` type
- `unknown` without type guards
- `I` prefix for interfaces
- Optional fields for discrimination
