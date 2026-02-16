---
description: Generate Memory Bank (AI) and Overview (Human) files for a code domain to reduce cognitive debt
allowed-tools: Task, Read, Grep, Glob, Bash, Write, TodoWrite
argument-hint: "<path> [--update] [--force] [--dry-run]"
model: opus
skills: domain-map
---

# Domain Map

Generate structured documentation for a code domain to reduce cognitive debt.
Produces two co-located files:
- **MEMORY_BANK.md** - Optimized for AI agents (patterns, conventions, gotchas, dependencies)
- **OVERVIEW.md** - Optimized for human developers (architecture, data flow, quick reference)

Arguments: `$ARGUMENTS` - path to domain directory, optional flags

## Flags

| Flag | Description |
|------|-------------|
| (none) | Generate new files, error if they already exist |
| `--update` | Refresh auto-generated sections, preserve `[MANUAL]` sections |
| `--force` | Overwrite existing files completely |
| `--dry-run` | Preview analysis without writing files |

## Phase 1: Parse Arguments and Validate

### 1.1 Extract Arguments

```
From $ARGUMENTS, extract:
- domain_path: The directory path (required, first positional argument)
- flags: --update, --force, --dry-run (optional)

If no domain_path provided, show usage:
  "Usage: /domain-map <path> [--update] [--force] [--dry-run]"
  "Example: /domain-map src/auth/"
```

### 1.2 Validate Domain Path

```
1. Verify directory exists using Bash: ls <domain_path>
2. If not found, show error with suggestion to check path
3. Resolve to absolute path if relative
4. Determine project root: walk up from domain_path to find nearest .git or package.json
5. Compute relative domain path from project root (used in output files)
6. Extract domain name from path (last directory segment, e.g., "auth" from "src/auth/")
```

### 1.3 Check Existing Files

```
1. Check for existing MEMORY_BANK.md and OVERVIEW.md in domain_path using Glob
2. If files exist:
   - No flags: Show error:
     "MEMORY_BANK.md and/or OVERVIEW.md already exist in [path].
      Use --update to refresh (preserves [MANUAL] sections)
      Use --force to overwrite completely"
   - --update: Read existing files, extract [MANUAL] sections for preservation
   - --force: Continue (will overwrite)
3. If --update, extract manual sections with this logic:
   - Find all sections starting with "## [MANUAL]"
   - Capture everything from "## [MANUAL] <title>" until the next "## " heading or end of file
   - Store as key-value: { sectionTitle: content }
```

## Phase 2: Deep Domain Analysis

Use TodoWrite to track progress. Run analyses in parallel where possible.

### 2.1 File Structure Analysis

Using **Glob**, list all files in domain_path recursively.

**Categorize each file by pattern:**

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
| `index.ts`, `index.tsx` | Entry Point | Entry |

For each file, count lines using `wc -l` via Bash (batch command for all files).

### 2.2 Pattern Detection

Run these **Grep** searches in parallel against the domain_path:

**State Management:**
```
Patterns to search:
- "useState" - Local state
- "useReducer" - Complex local state
- "createContext|useContext" - Context API
- "useQuery|useMutation|queryKey" - React Query
- "useSelector|useDispatch|createSlice" - Redux
- "zustand|create\(" - Zustand
```

**Data Fetching:**
```
Patterns to search:
- "useQuery|useMutation" - React Query
- "fetch\(|axios\." - Direct fetch/axios
- "useSWR" - SWR
- "\.get\(|\.post\(|\.put\(|\.delete\(" - HTTP methods
```

**Error Handling:**
```
Patterns to search:
- "try\s*\{" - Try/catch blocks
- "ErrorBoundary|error.boundary" - Error boundaries
- "\.catch\(" - Promise catch
- "throw new" - Error throwing patterns
```

**Export Patterns:**
```
Patterns to search:
- "export default" - Default exports (should flag as anti-pattern per CLAUDE.md)
- "export \{" - Named re-exports
- "export (const|function|class|interface|type|enum)" - Named exports
```

**TypeScript Patterns:**
```
Patterns to search:
- "^export (interface|type) " - Type definitions
- "^export enum " - Enum definitions
- "as [A-Z]" - Type casting (anti-pattern per CLAUDE.md)
- ": any" - Any usage (anti-pattern)
```

### 2.3 Dependency Analysis

**Internal dependencies (what this domain imports):**
```
Using Grep on domain_path:
- Pattern: "^import .+ from ['\"](?![\\.@])" and "^import .+ from ['\"]\\."
- Categorize imports as:
  - Internal project (relative paths going outside domain: "../")
  - Internal domain (relative paths within domain: "./")
  - External packages (no relative path prefix)
```

**Reverse dependencies (what imports from this domain):**
```
Using Grep on the project root (excluding node_modules, dist, build):
- Pattern: "from ['\"].*<domain_relative_path>"
- This reveals what other parts of the codebase depend on this domain
```

**Flag issues:**
- Circular dependencies (A imports B, B imports A)
- Layer violations (Data layer importing from UI layer)

### 2.4 Git History Analysis

Run these Bash commands (non-destructive, read-only):

```bash
# Recent commits touching this domain (last 30 days)
git log --since="30 days ago" --pretty=format:"%h %s (%an, %ar)" -- <domain_path> | head -20

# Most frequently changed files (churn indicator, last 90 days)
git log --since="90 days ago" --name-only --pretty=format:"" -- <domain_path> | sort | uniq -c | sort -rn | head -10

# Contributors to this domain
git shortlog -s -n -- <domain_path>

# Domain age (first commit)
git log --diff-filter=A --format="%ai" --reverse -- <domain_path> | head -1

# Recent architectural changes
git log --since="90 days ago" --pretty=format:"%h %s" -- <domain_path> | head -30
```

If git is not available or the directory is not in a git repo, skip this phase and note it in the output.

### 2.5 Complexity Indicators

Using **Read** on the largest files identified in 2.1:

- Files over 150 lines (CLAUDE.md standard violation)
- Look for functions over 30 lines
- Look for nesting deeper than 3 levels
- Look for files with multiple responsibilities

Read only the top 5-10 largest files to stay within context limits.

## Phase 3: Generate MEMORY_BANK.md

Synthesize all analysis into this template. Replace placeholders with actual data.

### Template

```markdown
# Memory Bank: [Domain Name]

> Auto-generated by `/domain-map` on [YYYY-MM-DD]. Sections marked [MANUAL] are preserved on `--update`.

## Domain Identity

- **Path**: `[relative path from project root]`
- **Purpose**: [one-sentence description synthesized from file analysis]
- **Layer**: [UI / Logic / Data / Shared / Infrastructure / Full-Stack]
- **Bounded Context**: [what business domain this serves]

## File Responsibility Map

| File | Responsibility | Lines | Layer |
|------|---------------|-------|-------|
| [filename] | [what this file does] | [line count] | [UI/Logic/Data/Shared/Test] |

## Patterns and Conventions

### Naming
- [observed naming patterns, e.g., "Components use PascalCase with .tsx extension"]
- [handler patterns, e.g., "Event handlers prefixed with handle*"]
- [file naming, e.g., "Tests co-located as *.spec.tsx"]

### State Management
- [what state approach is used: local state / Context / React Query / Redux]
- [patterns observed, e.g., "All server state via React Query with QUERY_KEYS constants"]

### Data Fetching
- [how data is fetched: direct fetch / axios / React Query hooks]
- [caching strategy if observable]
- [error handling for data fetching]

### Type Patterns
- [key interfaces and what they represent]
- [enum usage]
- [generic patterns if any]

### Testing Approach
- [test file naming: *.spec.ts / *.test.ts]
- [testing library used: jest / vitest / testing-library]
- [mocking strategy observed]
- [what is tested vs what is not]

## Architectural Decisions

| Decision | Rationale | Evidence |
|----------|-----------|----------|
| [what was decided] | [why, inferred from code patterns] | [file or pattern that shows this] |

## Dependency Map

### This Domain Depends On

| Dependency | What For | Type |
|-----------|----------|------|
| [path or package] | [what functionality it provides] | [internal/external] |

### Depends On This Domain

| Consumer | What They Use |
|----------|-------------|
| [path] | [what they import from this domain] |

## Gotchas and Edge Cases

- [non-obvious behavior discovered during analysis]
- [environment-specific behavior]
- [order-dependent operations]
- [hidden side effects]
- [files that look similar but serve different purposes]

## Critical Invariants

- [things that MUST remain true for this domain to work correctly]
- [assumptions the code makes about data shapes, ordering, etc.]
- [constraints not enforced by the type system]

## Complexity Warnings

- [files exceeding 150 line limit with current line count]
- [functions exceeding 30 line limit if detected]
- [deep nesting locations if detected]
- [potential circular dependencies]

## [MANUAL] Additional Notes

[This section is preserved when running `/domain-map --update`. Add domain-specific notes, decisions, or context that the automated analysis cannot capture.]
```

### Writing Rules

- Be specific: use actual file names, actual patterns, actual counts
- Infer rationale from code patterns, don't guess wildly
- If uncertain about a decision rationale, mark it as "[inferred]"
- Keep each section concise - tables over paragraphs
- If a section has no findings (e.g., no gotchas found), write "None detected" rather than omitting

## Phase 4: Generate OVERVIEW.md

Synthesize analysis into this human-optimized template.

### Template

```markdown
# [Domain Name] Overview

> Auto-generated by `/domain-map` on [YYYY-MM-DD]. Sections marked [MANUAL] are preserved on `--update`.

## What This Domain Does

[2-3 sentence plain-English description of this domain's purpose and responsibility. What problem does it solve? Who uses it?]

## Architecture

[Text-based diagram showing the key components and their relationships. Use simple ASCII art or indented structure.]

Example:
    [Component A] --uses--> [Hook B] --calls--> [Service C] --fetches--> [API]
                                                     |
                                                [Repository D] --queries--> [DB]

## Data Flow

[How data moves through this domain, from input to output]

    [Source] -> [Processing Step 1] -> [Processing Step 2] -> [Output/Consumer]

## Key Entities

| Entity | Description | Defined In |
|--------|-------------|------------|
| [TypeName] | [what it represents in the domain] | [file path] |

## Entry Points

| Entry Point | Description | Used By |
|------------|-------------|---------|
| [exported function/component] | [what it provides] | [known consumers] |

## File Guide

```
[domain-path]/
  [file1.ts]          - [one-line description of responsibility]
  [file2.tsx]         - [one-line description]
  [subdirectory]/
    [file3.ts]        - [one-line description]
```

## Recent Activity

| Date | Change | Author |
|------|--------|--------|
| [date] | [commit message summary] | [author name] |

[If no git history available: "Git history not available for this domain."]

## Known Limitations

- [current tech debt items discovered during analysis]
- [files exceeding size limits]
- [missing test coverage areas]
- [anti-patterns detected: default exports, type casting, etc.]

## Quick Reference

- **To add a new [entity/component]**: [which files to create/modify, patterns to follow]
- **To modify [core behavior]**: [where the logic lives, what to change]
- **To test changes**: [how to run relevant tests, what test patterns to follow]

## [MANUAL] Developer Notes

[This section is preserved when running `/domain-map --update`. Add your own notes, context, or documentation here.]
```

### Writing Rules

- Write for a developer who has never seen this domain before
- Use plain English, avoid jargon where possible
- The architecture diagram should fit in 5-10 lines max
- File Guide should list every file with a useful one-liner
- Quick Reference should give actionable steps, not vague guidance

## Phase 5: Update Domain Maps Index

Create or update `.domain-maps/index.json` at the project root.

```
1. Check if .domain-maps/ directory exists at project root
2. If not, create it
3. Read existing index.json if it exists
4. Add or update entry for this domain:
```

```json
{
  "version": 1,
  "lastUpdated": "[ISO date]",
  "mappedDomains": [
    {
      "path": "[relative domain path]",
      "domainName": "[domain name]",
      "lastMapped": "[ISO date]",
      "memoryBankPath": "[relative path to MEMORY_BANK.md]",
      "overviewPath": "[relative path to OVERVIEW.md]",
      "fileCount": 0,
      "lineCount": 0
    }
  ]
}
```

If `--dry-run` is active, skip this phase.

## Phase 6: Write Files or Preview

### If --dry-run:

Display the generated content for both files without writing:

```
DOMAIN MAP PREVIEW (dry-run mode)
==================================

Domain: [path]
Files that would be created:
  - [domain_path]/MEMORY_BANK.md ([estimated lines] lines)
  - [domain_path]/OVERVIEW.md ([estimated lines] lines)

--- MEMORY_BANK.md Preview ---
[first 30 lines of generated content]
...

--- OVERVIEW.md Preview ---
[first 30 lines of generated content]
...

To generate files, run: /domain-map [path]
```

### If writing (default, --update, --force):

1. Write MEMORY_BANK.md to `[domain_path]/MEMORY_BANK.md`
   - If `--update`: merge [MANUAL] sections from existing file
2. Write OVERVIEW.md to `[domain_path]/OVERVIEW.md`
   - If `--update`: merge [MANUAL] sections from existing file
3. Update `.domain-maps/index.json`

## Phase 7: Report

Display the final report:

```markdown
## Domain Map Generated

**Domain**: [domain name] (`[relative path]`)
**Generated**: [date]

### Files Created

| File | Location | Lines |
|------|----------|-------|
| MEMORY_BANK.md | `[path]/MEMORY_BANK.md` | [n] |
| OVERVIEW.md | `[path]/OVERVIEW.md` | [n] |

### Analysis Summary

| Metric | Value |
|--------|-------|
| Files Analyzed | [n] |
| Total Lines of Code | [n] |
| Dependencies (inbound) | [n] |
| Dependencies (outbound) | [n] |
| Recent Commits (30d) | [n] |
| Contributors | [n] |
| Complexity Warnings | [n] |

### Recommendations

- [actionable suggestions discovered during analysis]
- [e.g., "Consider splitting UserService.ts (312 lines) - exceeds 150 line limit"]
- [e.g., "3 default exports found - consider converting to named exports"]

### Next Steps

- Review generated files and verify accuracy
- Add domain-specific notes to the `[MANUAL]` sections
- Run `/domain-map [path] --update` periodically to refresh
```

## Command Variants

```bash
# Map a specific domain
/domain-map src/auth/

# Preview without writing
/domain-map src/auth/ --dry-run

# Refresh existing mapping (preserves manual notes)
/domain-map src/auth/ --update

# Full regeneration (overwrites everything)
/domain-map src/auth/ --force

# Map a component directory
/domain-map src/components/UserProfile/

# Map the entire services layer
/domain-map src/services/

# Map backend module
/domain-map src/modules/payments/
```

## Safety Measures

1. **Never overwrite** without `--update` or `--force` flag
2. **Preserve [MANUAL] sections** on `--update` - these contain human-written notes
3. **Read-only analysis** - this command never modifies source code
4. **Large domain handling** - for domains with 100+ files, prioritize key files (entry points, services, types) and summarize the rest
5. **Git safety** - all git commands are read-only (log, shortlog, diff)

## Integration Notes

- Agents spawned by `/consult`, `/plan-task`, `/build-feature` can read MEMORY_BANK.md for richer domain context
- `/cleanup` can reference the dependency map to safely identify dead code
- `/review` can check changes against documented patterns and invariants
- `/extract-learning` can suggest running `--update` when new patterns are discovered
