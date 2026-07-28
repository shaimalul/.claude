# Compact Instructions

When compacting, preserve: active task goal, decisions made, files modified, pending steps.

# Configuration File Protection (MANDATORY)

This repository is a managed Claude Code configuration. All cross-cutting rule changes MUST go through `/improve-claude` to maintain sync across files.

Protected files: `CLAUDE.md`, `rules/*.md`, `agents/*.md`, `skills/*/SKILL.md` (excluding `p-*` personal files)

When you detect a user editing these files directly:

1. STOP and ask: "This file is managed by `/improve-claude`. Would you like me to use that command instead?"
2. Explain: Direct edits risk breaking sync between related files
3. Exception: Single-file typo fixes, formatting-only changes, and `p-*` personal files are allowed

Allowed direct edits (no redirect needed):

- Files with `p-` prefix (personal/gitignored)
- `scripts/`, `settings.template.json` (code/infrastructure)
- `README.md`, `.gitignore`, `.secrets.example` (repo docs/config)

---

# Single Source of Truth (CORE PRINCIPLE)

SSOT is the #1 priority. Every piece of logic, data, or configuration MUST have exactly one authoritative source.

In code reviews: SSOT violations are ALWAYS `[Blocker]` - not suggestions.

BEFORE writing any code:

1. Search for existing enums, constants, types, functions that define this concept
2. If found: inherit, extend, or reference it - NEVER duplicate
3. If creating new: place it where all consumers can import from one location

SSOT applies to:

- Enums and constants
- Type definitions and interfaces
- Business logic and calculations
- Configuration values and thresholds
- Validation rules and error messages
- API response shapes (derive from backend types)

When changing logic: one change MUST propagate everywhere automatically. If you need to change multiple files for the same concept, you have violated SSOT.

The two non-negotiable pillars: **SSOT** and **Tests**. All other concerns (patterns, style, architecture) matter only after these are satisfied.

---

# Output Behavior

- Never add summary documents unless explicitly asked
- Keep plans concise - no timetables, no timelines, no time estimates

---

# Python Development

BEFORE running ANY Python command (`python`, `pip`, `pytest`, script execution):

1. Check for virtualenv: `pyproject.toml` -> `poetry run` / `uv run`; `.venv/` -> activate; none -> create one
2. Check Python version: `.python-version` or `pyenv versions` -> `pyenv local <version>` / `pyenv shell <version>`
3. Never use bare `python`/`python3`/`pip`/`pip3` - always through virtualenv

See `rules/python.md` for full pre-flight checklist, virtualenv discipline, code style, and quality checklist.

---

# Version Management

- Multiple Python and Node.js versions are installed - always use the right one per project
- Python: `pyenv` (check `.python-version`, `pyproject.toml`)
- Node.js: `nvm` (check `.nvmrc`, `package.json` engines)

---

# Docker Troubleshooting

See `skills/docker-patterns/SKILL.md` for Docker patterns and troubleshooting.

---

# Test Failure Discipline

See `rules/testing.md` for test failure discipline, TDD workflow, boundary testing rules, and verification steps.
MANDATORY: Mock ONLY at system boundaries (HTTP, DB, file I/O). NEVER mock internal functions/libraries. Tests must pass the Library Swap Test. Load `testing-patterns` skill for patterns.

---

# Skill Bases and Primitives

Two mechanisms keep skills from duplicating each other. Both are `user-invocable: false`.

BASES own the shared content of a family. Consumers declare `Extends: <base>` and contain ONLY their overrides.

- `review-base` - review family (review, review-test, fix-review)
- `plan-base` - planning family (plan-task, plan-to-docs)

PRIMITIVES own ONE concept outright, cited by name from anywhere:

- `grilling` - the decision-tree interview: one question at a time, recommended answer, the stop option
- `domain-modeling` - `CONTEXT.md` glossary, ADR format and the 3-of-3 gate, lazy creation, consumer rules
- `codebase-design` - deep modules: module, interface, depth, SEAM, adapter, leverage, locality
- `tdd` - the red-green-refactor loop, what a good test is, seams, test anti-patterns

Before creating or editing a skill:

1. If a base or primitive already owns the concept, reference it by name - NEVER restate it
2. If two or more skills would share substantial content and nothing owns it, create the base or primitive first
3. A change that applies to the whole family goes in the BASE, not the consumer

This is SSOT applied to skills. Duplicated instructions drift, and drifted instructions give Claude contradictory guidance depending on which file it reads.

---

# Model Selection

See `rules/models.md` - the single source of truth for model tiers and the per-agent and per-skill assignment tables.

NEVER hardcode a model version. Reference tiers by alias only (`opus`, `sonnet`, `haiku`) in frontmatter, settings, and prose. Version numbers like `claude-sonnet-4-6` or "Opus 4.6" go stale; aliases resolve to the current generation automatically. Non-Claude model ids in code examples (`gpt-4o`) are external contracts and keep their explicit names.

---

# Engineering Code Standards

Focus on SOLID principles, testability, clean architecture, and maintainability.
For detailed patterns, invoke skills: `refactoring-patterns`, `react-component`, `js-backend-patterns`, `architect`, `typescript-types`, `design-system-patterns`

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
- For new logic or bug fixes: follow TDD (write failing test first, implement minimally, then refactor). Load `tdd` skill.

---

## MCP-First Tool Routing

- Library docs → Context7 `resolve-library-id` + `query-docs` (not WebSearch)
- Notion pages → Notion MCP (not WebFetch)
- Jira/Confluence → Jira MCP `search`, `getJiraIssue` (not WebFetch or `gh`)
- GitHub URLs (PRs, issues, CI runs) → Bash with the `gh` CLI (NEVER WebFetch - it fails on authenticated URLs). Let `gh` use its stored credentials; never pass a token as a bare CLI arg. For PR review threads use the pr-resolver-agent agent
- Design system components → the library's own docs or types via Context7; for an in-house system, read the component source. NEVER guess component or prop names
- General web info → WebSearch/WebFetch (fallback only)
- External service/package claims (model names, API versions, SDK features, library/package versions, pricing) → WebSearch to verify before asserting existence or non-existence

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
- Comments that narrate the diff (`previously…`, `instead of…`, `no longer…`, `we used to…`, `still…`) — write timeless intent that reads correctly to someone who never saw the old code

## Styling Standards

Spacing & Layout:

- ALWAYS reuse shared spacing variables for margin, padding, width, height, gap, and sizing
- NEVER use px directly for spacing and sizing properties
- For custom spacing values, create SCSS variables (e.g., `$custom-spacing`)
- Use logical CSS properties for RTL support: `padding-inline-start`, `margin-inline-end`, etc.

Colors:

- PREFER design system tokens: UI palette for UI, a separate categorical palette for charts/data
- If no palette color matches, select the closest available one
- NEVER use hardcoded hex codes or generic color names
- NEVER use token names that don't exist in the package - verify the exact name in the design system source before using

Typography:

- PREFER the design system typography scale for font sizes, weights, and line heights
- Custom font values allowed when no matching scale exists in the design system
- NEVER hardcode font values without considering design system first

---

## Post-Implementation Verification (REQUIRED)

Run in order after any implementation:

1. `npm test`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run build`

Fix ALL errors before marking complete.

---

## Specialist Agent Team

| Command              | Agent           | Expertise                       |
| -------------------- | --------------- | ------------------------------- |
| `/consult frontend`  | frontend-agent  | React, TypeScript, components   |
| `/consult backend`   | backend-agent   | Node.js, NestJS, APIs           |
| `/consult ai`        | ai-agent        | OpenAI, prompts, RAG            |
| `/consult devops`    | devops-agent    | Docker, K8s, Terraform          |
| `/consult security`  | security-agent  | OWASP, auth, vulnerabilities    |
| `/consult architect` | architect-agent | System design, ADRs             |
| `/consult ux`        | ux-agent        | WCAG, ARIA, accessibility       |
| `/consult product`   | product-agent   | Product strategy, enterprise PM |

## Which Entry Point

| Situation | Reach for |
| ----------------------------------------------------- | ------------------- |
| Small task you can hold in your head | No skill. Just do it |
| Bigger task: needs research, agents, an interview | `/plan-task` |
| Too big for one session: needs phased execution | `/plan-to-docs`, then `/implement-phase` per phase |
| Designing the tests for something already built | `/plan-test` |
| Something is broken, flaky, or slow | `/find-bug` |
| Code written and ready to check | `/review` |
| Findings from a review to fix | `/fix-review` |
| A domain expert opinion | `/consult [domain]` |

Use agents proactively, no need to wait for the user to ask. Complex tasks go to mastermind-agent.
