# Compact Instructions
When compacting, preserve: active task goal, decisions made, files modified, pending steps.

# Principal Engineer Code Standards

Focus on SOLID principles, testability, clean architecture, and maintainability.
For detailed patterns, invoke skills: `refactoring-patterns`, `react-component`, `backend-patterns`, `architect`, `typescript-types`, `common-ui-patterns`

---

## Modularity Rules (STRICT)

- Files: Max 150 lines — split into modules if longer
- Functions: Max 30 lines — extract helpers
- Classes: Max 200 lines — decompose
- One responsibility per file — if you need "and" to describe it, split it

---

## Before Writing New Code

Search the codebase first. Before creating types, utilities, constants:
- Search `types/`, `utils/`, `constants/` for existing implementations
- Extend existing types with `Pick`, `Omit`, `Partial` rather than duplicating
- For new logic or bug fixes: follow RGR (write failing test first, implement minimally, then refactor). Load `rgr-patterns` skill.

---

## MCP-First Tool Routing

- Library docs → Context7 `resolve-library-id` + `query-docs` (not WebSearch)
- Notion pages → Notion MCP (not WebFetch)
- Jira/Confluence → Jira MCP `search`, `getJiraIssue` (not WebFetch or `gh`)
- General web info → WebSearch/WebFetch (fallback only)

---

## Architecture

Three-layer pattern — never skip layers:
- Frontend: UI Components → Hooks → Services
- Backend: Controller → Service → Repository
- Server state: React Query. App state: Context. Local state: useState/useReducer.

---

## Code Style

Naming: `isLoading`, `hasError` (booleans) | `handleClick` (handlers) | `useDataItems` (hooks) | `UPPER_SNAKE_CASE` (constants) | `PascalCase` (types, no `I` prefix)

Never use:
- `export default` — always named exports
- `index.ts` barrel files — import directly from source
- Dynamic `import()` / `require()` inside functions — all imports at file top
- Type casting `as Type` — use type guards
- `any` / `unknown` without type guards
- Raw HTTP status numbers — use `http-status-codes`
- `console.log` in production
- `uuid()` as React list keys — use stable data IDs
- Empty catch blocks — always log errors
- `eslint-disable` for floating promises — use `void asyncFn()`

---

## Post-Implementation Verification (REQUIRED)

Run in order after any implementation:
1. `npm test`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run build`

Fix ALL errors before marking complete.

---

## Principal Engineering Team

| Command | Agent | Expertise |
|---------|-------|-----------|
| `/consult frontend` | frontend-principal | React, TypeScript, components |
| `/consult backend` | backend-principal | Node.js, NestJS, APIs |
| `/consult ai` | ai-principal | OpenAI, prompts, RAG |
| `/consult devops` | devops-principal | Docker, K8s, Terraform |
| `/consult security` | security-principal | OWASP, auth, vulnerabilities |
| `/consult architect` | architect-principal | System design, ADRs |
| `/consult ux` | ux-principal | WCAG, ARIA, accessibility |
| `/consult product` | product-principal | Product strategy, enterprise PM |

Key commands: `/plan-task` | `/build-feature` | `/quality-gate` | `/review` | `/cleanup` | `/domain-map` | `/plan-product`

Use agents proactively — no need to wait for user to ask. Complex tasks → mastermind. Code written → `/review`. Expert needed → `/consult [domain]`.
