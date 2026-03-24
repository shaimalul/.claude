---
name: domain-map
description: Generate Memory Bank (AI) and Overview (Human) files for a code domain to reduce cognitive debt. Use when generating MEMORY_BANK.md or OVERVIEW.md files, or analyzing codebase architecture for documentation.
argument-hint: "<path> [--update] [--force] [--dry-run]"
allowed-tools: Task, Read, Grep, Glob, Bash, Write, TodoWrite
model: opus
---

# Domain Map

Generate structured documentation for a code domain to reduce cognitive debt.
Produces two co-located files:
- **MEMORY_BANK.md** - Optimized for AI agents (patterns, conventions, gotchas, dependencies)
- **OVERVIEW.md** - Optimized for human developers (architecture, data flow, quick reference)

For detailed analysis heuristics, see [analysis-heuristics.md](analysis-heuristics.md).

Arguments: `$ARGUMENTS` - path to domain directory, optional flags

## Flags

| Flag | Description |
|------|-------------|
| (none) | Generate new files, error if they already exist |
| `--update` | Refresh auto-generated sections, preserve `[MANUAL]` sections |
| `--force` | Overwrite existing files completely |
| `--dry-run` | Preview analysis without writing files |

## Phase 1: Parse Arguments and Validate

Extract `domain_path` (required) and flags from `$ARGUMENTS`.
Validate directory exists, resolve to absolute path, determine project root.

## Phase 2: Deep Domain Analysis

Use TodoWrite to track progress. Run analyses in parallel where possible.

### 2.1 File Structure Analysis
Using **Glob**, list all files recursively. Categorize by pattern (see analysis-heuristics.md).

### 2.2 Pattern Detection
Run **Grep** searches for state management, data fetching, error handling, export patterns, TypeScript patterns.

### 2.3 Dependency Analysis
Analyze internal/external imports and reverse dependencies.

### 2.4 Git History Analysis
```bash
git log --since="30 days ago" --pretty=format:"%h %s (%an, %ar)" -- <path> | head -20
git log --since="90 days ago" --name-only --pretty="" -- <path> | sort | uniq -c | sort -rn | head -10
git shortlog -s -n -- <path>
```

### 2.5 Complexity Indicators
Read largest files, check for violations (>150 lines, >30 line functions, deep nesting).

## Phase 3: Generate MEMORY_BANK.md

Synthesize analysis into structured template with: Domain Identity, File Responsibility Map, Patterns and Conventions, Architectural Decisions, Dependency Map, Gotchas, Critical Invariants, Complexity Warnings, [MANUAL] sections.

## Phase 4: Generate OVERVIEW.md

Human-optimized template with: What This Domain Does, Architecture diagram, Data Flow, Key Entities, Entry Points, File Guide, Recent Activity, Known Limitations, Quick Reference, [MANUAL] sections.

## Phase 5: Update Domain Maps Index

Create/update `.domain-maps/index.json` at project root.

## Phase 6: Write Files or Preview

If `--dry-run`: preview without writing. Otherwise write files and merge [MANUAL] sections on `--update`.

## Phase 7: Report

```markdown
## Domain Map Generated

**Domain**: [domain name] (`[relative path]`)

### Files Created
| File | Location | Lines |
|------|----------|-------|
| MEMORY_BANK.md | `[path]` | [n] |
| OVERVIEW.md | `[path]` | [n] |

### Analysis Summary
| Metric | Value |
|--------|-------|
| Files Analyzed | [n] |
| Dependencies (inbound) | [n] |
| Complexity Warnings | [n] |

### Recommendations
- [actionable suggestions]
```

## Safety Measures

1. **Never overwrite** without `--update` or `--force`
2. **Preserve [MANUAL] sections** on `--update`
3. **Read-only analysis** - never modifies source code
4. **Git safety** - all git commands are read-only
