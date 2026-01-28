# Principal Engineer Code Standards

Focus on SOLID principles, testability, clean architecture, and maintainability. These rules apply to both frontend and backend code.

**For detailed patterns, see the skills:** `refactoring-patterns`, `react-component`, `backend-patterns`, `architect`, `typescript-types`, `common-ui-patterns`

---

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

---

## Before Writing New Code (IMPORTANT)

**Always search the codebase first.** Before creating new types, interfaces, enums, utility functions, or constants:

1. **Search for existing implementations** in the feature/module you're working on
2. **Inherit/extend existing types** rather than creating duplicates
3. **Reuse existing utilities** - don't create a new `formatDate()` if one exists

**Checklist before creating:**
- [ ] Searched `types/` folder for existing interfaces
- [ ] Searched `utils/` folder for existing helpers
- [ ] Searched `constants/` for existing enums/constants
- [ ] Checked if parent type can be extended with `Pick`, `Omit`, or `Partial`

---

## Core Principles

### Three-Layer Architecture

**Frontend:**
```
UI Layer (Components) → Logic Layer (Hooks) → Data Layer (Services)
```

**Backend:**
```
Controller Layer → Service Layer → Repository Layer
     (HTTP)        (Business)        (Data)
```

**Rules:**
- Never skip layers (Controller → Repository is WRONG)
- UI/Controllers only handle presentation/HTTP
- Logic/Services contain business rules
- Data/Repositories handle data access

### State Management
- Use **React Query** for server state (fetching, caching, mutations)
- Use **Context** only for dependency injection or low-frequency app state
- Use **useState/useReducer** for local component state

---

## Code Style

### Naming Conventions
- Booleans: `is`, `has`, `should` prefix (`isLoading`, `hasError`)
- Handlers: `handle` prefix (`handleClick`, `handleSubmit`)
- Hooks: `use` prefix (`useDataItems`, `useAuth`)
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase` (no `I` prefix)

### TypeScript Patterns
- **Optional params**: Use `?` instead of `| undefined`
  ```typescript
  // Bad: versionId: string | undefined
  // Good: versionId?: string
  ```
- **Enums over strings**: Use enums instead of string literals for status comparisons
  ```typescript
  // Bad: if (status === 'completed')
  // Good: if (status === EvaluationStatus.COMPLETED)
  ```
- **Indexed access types**: Use `Type["property"]` for single source of truth
  ```typescript
  // Bad: Duplicates the type - breaks if User.id changes
  function getUser(userId: string): Promise<User> { ... }

  // Good: Single source of truth - always matches User.id
  function getUser(userId: User["id"]): Promise<User> { ... }
  ```

### Exports and Imports
- **Always use named exports** - never `export default`
- **Never use index.ts barrel files** - import directly from source files
- **Declare constants outside component functions** - centralize in `constants.ts` files

### Never Use
- Type casting (`as Type`) - use type guards instead
- `any` or `unknown` without type guards
- Raw HTTP status numbers - use `http-status-codes` package
- `console.log` in production - use proper logging service
- `uuid()` as React list keys - use stable IDs from data
- Empty catch blocks - always log errors even when returning fallback values
- `eslint-disable` for floating promises - use `void asyncFn()` instead
- Backward compatibility wrappers in new code - write clean code directly

### React Query Keys
```typescript
// Centralize query keys as constants
export const QUERY_KEYS = {
  DATA_ITEMS: 'dataItems',
  USER: 'user',
} as const;

queryKey: [QUERY_KEYS.DATA_ITEMS, filters]
```

---

## File Structure

### Frontend Structure
```
src/
├── components/           # Shared UI components (+ co-located CSS)
│   └── ComponentName/
│       ├── ComponentName.tsx
│       ├── ComponentName.spec.tsx
│       └── ComponentName.module.scss
├── screens/              # Page-level components
├── hooks/                # Custom hooks
├── contexts/             # React Context providers
├── services/             # API clients
├── utils/                # Pure functions
├── types/                # TypeScript interfaces
└── styles/               # Global CSS only
```

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

### CSS Organization
- Co-locate CSS with components (one CSS file per component)
- Global styles only in `src/styles/`
- Use CSS Modules (`.module.scss`)

---

## Post-Implementation Verification (REQUIRED)

**After completing any implementation, ALWAYS run these checks in order:**

1. **Tests** (if available)
   ```bash
   npm test
   ```

2. **TypeScript Check**
   ```bash
   npx tsc --noEmit
   ```

3. **Lint**
   ```bash
   npm run lint
   ```

4. **Build**
   ```bash
   npm run build
   ```

**Rules:**
- Fix ALL errors before considering the task complete
- If tests fail, fix them before moving on
- Build must succeed - never leave broken builds

---

## Principal Engineering Team

Use specialized agents for principal-engineer level development:

| Command | Agent | Expertise |
|---------|-------|-----------|
| `/consult frontend` | frontend-principal | React, TypeScript, components |
| `/consult backend` | backend-principal | Node.js, NestJS, APIs |
| `/consult ai` | ai-principal | OpenAI, prompts, RAG |
| `/consult devops` | devops-principal | Docker, K8s, Terraform |
| `/consult security` | security-principal | OWASP, auth, vulnerabilities |
| `/consult architect` | architect-principal | System design, ADRs |
| `/consult ux` | ux-principal | WCAG, ARIA, accessibility |

### Key Commands
- `/consult [domain] [topic]` - Consult a principal engineer for expert guidance
- `/plan-task [description]` - Plan a task with the mastermind
- `/build-feature` - Execute the planned feature
- `/quality-gate` - Run comprehensive quality checks (includes predictive analysis)
- `/review` - Review current branch changes with TODO creation
- `/gitlab-review [url]` - Review GitLab MR and post draft comments
- `/cleanup` - Detect and remove code debt (duplicates, legacy code, dead code)

---

## Detailed Pattern References

For detailed patterns and code examples, refer to these skills:

| Topic | Skill |
|-------|-------|
| Frontend refactoring ("When You See..." patterns) | `refactoring-patterns` |
| React components, hooks, anti-patterns | `react-component` |
| useEffect best practices, common mistakes | `useeffect-patterns` |
| Backend patterns, DI, validation | `backend-patterns` |
| System design, ADRs, scalability | `architect` |
| TypeScript types, discriminated unions | `typescript-types` |
| Zencity Common UI guidelines | `common-ui-patterns` |
| npm package exports | `npm-package-patterns` |
| Testing patterns | `testing-patterns` |
| Security (OWASP, auth) | `security-patterns` |
| DevOps (Docker, K8s, CI/CD) | `docker-patterns`, `kubernetes-patterns`, `cicd-patterns` |
| AI/ML integration | `openai-integration`, `prompt-engineering` |
| Self-documenting code, avoiding comments | `no-comments` |
| Code debt cleanup (duplicates, dead code) | `cleanup` |
