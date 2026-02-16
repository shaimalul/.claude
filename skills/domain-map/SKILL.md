---
name: domain-map
description: Domain mapping patterns for generating Memory Bank and Overview documentation to reduce cognitive debt
---

# Domain Map Skill

Analysis heuristics and templates for the `/domain-map` command.

## File Categorization

Categorize files by their role in the architecture:

| Pattern | Category | Layer |
|---------|----------|-------|
| `*.component.tsx`, `*.tsx` in `components/` | Component | UI |
| `use*.ts`, `use*.tsx`, `*.hook.ts` | Hook | Logic |
| `*.service.ts` | Service | Data |
| `*.repository.ts` | Repository | Data |
| `*.controller.ts` | Controller | API |
| `*.types.ts`, `*.dto.ts`, `*.interface.ts` | Types | Shared |
| `*.spec.ts`, `*.test.ts`, `*.spec.tsx`, `*.test.tsx` | Test | Test |
| `*.module.scss`, `*.module.css`, `*.css`, `*.scss` | Styles | UI |
| `*.constants.ts`, `*.config.ts` | Constants | Shared |
| `*.utils.ts`, `*.helpers.ts` | Utility | Shared |
| `*.guard.ts`, `*.middleware.ts` | Middleware | API |
| `*.pipe.ts`, `*.interceptor.ts` | Middleware | API |
| `*.module.ts` (NestJS) | Module | Infrastructure |
| `*.resolver.ts` | Resolver | API |
| `*.schema.ts`, `*.model.ts`, `*.entity.ts` | Model | Data |
| `*.validator.ts` | Validator | Shared |
| `*.context.ts`, `*.context.tsx`, `*.provider.tsx` | Context | Logic |
| `index.ts`, `index.tsx` | Entry Point | Entry |

### Layer Determination

When a file doesn't match a specific pattern, infer the layer from its directory:

| Directory Contains | Layer |
|-------------------|-------|
| `components/`, `screens/`, `pages/`, `views/` | UI |
| `hooks/`, `contexts/` | Logic |
| `services/`, `repositories/`, `api/` | Data |
| `types/`, `interfaces/`, `dtos/`, `constants/`, `utils/`, `helpers/` | Shared |
| `controllers/`, `routes/`, `middleware/`, `guards/` | API |
| `models/`, `entities/`, `schemas/` | Data |
| `__tests__/`, `__mocks__/` | Test |

## Dependency Direction Rules

Valid dependency directions (higher layers can depend on lower):

```
UI Layer (Components, Screens, Pages)
  |
  v
Logic Layer (Hooks, Contexts, State Management)
  |
  v
Data Layer (Services, Repositories, API clients)
  |
  v
Shared Layer (Types, Utils, Constants)
```

### Violations to Flag

| Violation | Description | Severity |
|-----------|-------------|----------|
| Data -> UI | Service importing a component | High |
| Data -> Logic | Repository importing a hook | High |
| Logic -> UI | Hook importing a component (except for types) | Medium |
| Shared -> Any Upper Layer | Utility importing from services/hooks/components | High |
| Circular | A imports B, B imports A | High |

## Pattern Recognition Searches

### State Management Detection

| Search Pattern | Indicates |
|---------------|-----------|
| `useState\b` | Local component state |
| `useReducer\b` | Complex local state with actions |
| `createContext\|useContext` | React Context for DI or shared state |
| `useQuery\|useMutation\|queryKey\|QUERY_KEYS` | React Query for server state |
| `useSelector\|useDispatch\|createSlice\|createAction` | Redux/RTK |
| `create\(\s*\(set` | Zustand store |

**How to document:** List which pattern is dominant, any mixing of approaches, and whether the usage aligns with CLAUDE.md guidance (React Query for server state, Context for DI).

### Data Fetching Detection

| Search Pattern | Indicates |
|---------------|-----------|
| `useQuery\b` | React Query GET operations |
| `useMutation\b` | React Query mutations |
| `fetch\(\s*['"\`]` | Native fetch API |
| `axios\.(get\|post\|put\|delete\|patch)` | Axios HTTP client |
| `useSWR\b` | SWR data fetching |
| `\.subscribe\(` | Observable/RxJS subscriptions |

### Error Handling Detection

| Search Pattern | Indicates |
|---------------|-----------|
| `try\s*\{` | Try/catch error handling |
| `ErrorBoundary` | React error boundaries |
| `\.catch\(\s*\(` | Promise catch handlers |
| `throw new\s+(Error\|HttpException\|BadRequest)` | Custom error throwing |
| `onError\s*[:=]` | React Query/mutation error callbacks |
| `catch\s*\(\s*\w*\s*\)\s*\{[\s]*\}` | Empty catch blocks (anti-pattern) |

### Anti-Pattern Detection

| Search Pattern | Issue | CLAUDE.md Rule |
|---------------|-------|----------------|
| `export default` | Default exports | Always use named exports |
| `as [A-Z]\w+` (not `as const`) | Type casting | Use type guards instead |
| `:\s*any\b` | Any type usage | Use proper typing |
| `console\.(log\|warn\|error)` | Console in production | Use logging service |
| `// eslint-disable` | ESLint disabling | Fix the issue or use void |
| `index\.(ts\|tsx)$` | Barrel files | Import directly from source |

## Architectural Decision Detection

Infer decisions from observed code patterns:

| Code Pattern | Likely Decision | Confidence |
|-------------|-----------------|------------|
| All API calls wrapped in useQuery/useMutation | "Use React Query for server state" | High |
| Context providers with no useState, only passing services | "Use Context for dependency injection only" | High |
| Separate `types/` directory with shared interfaces | "Centralize shared type definitions" | High |
| Test files co-located with source (*.spec.tsx next to *.tsx) | "Co-locate tests with source files" | High |
| Service layer between hooks and API calls | "Three-layer architecture (UI -> Logic -> Data)" | High |
| CSS Modules (*.module.scss) co-located with components | "Co-locate styles with components" | High |
| Zod schemas in validator files | "Use Zod for runtime validation" | High |
| QUERY_KEYS constants centralized | "Centralize React Query keys" | Medium |
| TypeORM entities in models/ directory | "TypeORM for ORM" | High |
| NestJS decorators on controllers | "NestJS framework" | High |
| Environment variables accessed through config service | "Centralized configuration" | Medium |

## Git Analysis Commands

```bash
# Recent commits (30 days) - shows development velocity and focus areas
git log --since="30 days ago" --pretty=format:"%h %s (%an, %ar)" -- <path>

# File churn (most changed files in 90 days) - identifies hotspots
git log --since="90 days ago" --name-only --pretty="" -- <path> | sort | uniq -c | sort -rn | head -10

# Contributors - shows domain ownership
git shortlog -s -n -- <path>

# Domain age - when this domain was first created
git log --diff-filter=A --format="%ai" --reverse -- <path> | head -1

# Recent architectural changes - refactors, restructures
git log --since="90 days ago" --pretty=format:"%h %s" -- <path>
```

### Interpreting Git Data

| Metric | What It Tells You |
|--------|------------------|
| High churn on specific files | Hotspot, likely complex or poorly abstracted |
| Many contributors | Shared ownership, need clear conventions |
| Single contributor | Potential knowledge silo, cognitive debt risk |
| Frequent "fix" commits | Stability issues in that area |
| Frequent "refactor" commits | Area under active improvement |
| No recent commits | Stable or abandoned - check usage to determine |

## [MANUAL] Section Preservation

When running with `--update`, preserve sections marked with `[MANUAL]`:

### Detection Pattern

Look for sections matching: `## [MANUAL] ` followed by a title.

### Preservation Logic

```
1. Read existing file content
2. Find all "## [MANUAL]" sections
3. For each section:
   a. Capture section title (text after "## [MANUAL] ")
   b. Capture content from after the heading until next "## " or end of file
   c. Store as { title: content } pairs
4. After generating new file content, find matching [MANUAL] sections
5. Replace the placeholder content with preserved content
6. If a [MANUAL] section exists in old file but not in new template, append it at end
```

### Example

Existing file has:
```markdown
## [MANUAL] Additional Notes

The auth service uses a custom JWT rotation strategy.
See ADR-042 for the rationale.
```

After `--update`, this exact content is preserved even though all other sections are regenerated.

## Large Domain Handling

For domains with 100+ files:

1. **Prioritize key files for deep Read analysis:**
   - Entry points (index.ts, main.ts)
   - Service files (*.service.ts)
   - Type definition files (*.types.ts, *.dto.ts)
   - Configuration files (*.config.ts)
   - The 5 largest files

2. **Summarize remaining files** using Glob metadata (name, extension, directory) without reading content

3. **Group files** by subdirectory for the File Guide section rather than listing each individually

4. **Limit git history** to 20 most recent commits and top 10 churned files

## Quality Checklist

Before writing output files, verify:

- [ ] Every file in the domain is listed in the File Responsibility Map
- [ ] All external dependencies are captured
- [ ] Dependency direction violations are flagged
- [ ] Git history section has real data (or notes that git is unavailable)
- [ ] Architecture diagram reflects actual observed structure
- [ ] Anti-patterns are noted in Complexity Warnings
- [ ] [MANUAL] sections are preserved if running --update
- [ ] Domain name is correctly derived from path
- [ ] All paths are relative to project root
