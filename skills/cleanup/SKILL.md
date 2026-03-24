---
name: cleanup
description: Detect and remove code debt (duplicates, legacy code, dead code). Use when detecting duplicate types, dead code, deprecated exports, or multiple approaches to the same functionality.
argument-hint: "[scope] [--dry-run] [--execute] [--category=<type>]"
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write, TodoWrite
model: opus
---

# Code Cleanup

Detect and remove code debt: duplicate types, multiple approaches, backward compatibility code, and dead code.

For detailed cleanup patterns, see [patterns.md](patterns.md).

Arguments: `$ARGUMENTS` - scope (files/directories), flags

**Default Mode:** Dry-run (preview only). Use `--execute` to apply changes.

## Cleanup Categories

| Category | What It Finds | Priority |
|----------|---------------|----------|
| `duplicate_types` | Same interface/type defined in multiple files | High |
| `multiple_approaches` | Different functions doing the same thing | High |
| `backward_compat` | `@deprecated`, legacy aliases, re-exports | Medium |
| `dead_code` | Unused exports, unreachable branches | Medium |

## Phase 1: Session Check

**First, check for existing cleanup session:**

```
Step 1: Check for cleanup directory
Command: LS cleanup

Step 2: If exists, read session state:
Command: Read cleanup/state.json
Command: Read cleanup/plan.md

If session exists with incomplete tasks:
- Display progress summary
- Ask: "Resume existing session or start new?"
```

## Phase 2: Analysis

**Scan the codebase for cleanup opportunities:**

### 2.1 Duplicate Types Detection

Use **Grep** to find type/interface definitions:
```
Pattern: "^export (interface|type|enum) \\w+"
Scope: **/*.ts, **/*.tsx
```

Group by name, flag duplicates across files.

### 2.2 Multiple Approaches Detection

Search for similar function names:
```
Patterns:
- "export (const|function) \\w*(format|parse|fetch|get|load|convert|transform)"
- Multiple functions with similar signatures
```

### 2.3 Backward Compatibility Detection

Search for deprecation markers:
```
Patterns:
- "@deprecated"
- "// deprecated"
- "// backward compat"
- "// legacy"
- "export { new as old }"
```

### 2.4 Dead Code Detection

Find unused exports:
```
Strategy:
1. List all exports with Grep
2. For each export, search for imports
3. Flag exports with zero imports
```

## Phase 3: Planning

Create cleanup plan in `cleanup/plan.md`:

```markdown
# Cleanup Plan - [timestamp]

## Summary
- Duplicate Types: X found
- Multiple Approaches: X found
- Backward Compat: X found
- Dead Code: X found

## Findings

### Duplicate Types
| Type Name | Locations | Action |
|-----------|-----------|--------|
| User | src/types/user.ts, src/components/UserCard.tsx | Consolidate to types/user.ts |

### Multiple Approaches
| Functionality | Implementations | Preferred |
|--------------|-----------------|-----------|
| Date formatting | formatDate, dateToString, formatDateString | formatDate |

### Backward Compatibility
| Item | Location | Can Remove? |
|------|----------|-------------|
| oldService alias | src/services/index.ts | Verify no external consumers |

### Dead Code
| Export | Location | Last Modified |
|--------|----------|---------------|
| unusedHelper | src/utils/helpers.ts | 6 months ago |

## Cleanup Tasks
- [ ] Task 1
- [ ] Task 2
```

Save state to `cleanup/state.json`:
```json
{
  "session_id": "cleanup_YYYY_MM_DD_HHMM",
  "status": "planning",
  "scope": "$ARGUMENTS",
  "findings": { },
  "completed_tasks": [],
  "pending_tasks": []
}
```

## Phase 4: Preview (Dry Run)

**Default behavior - show what would change:**

```
CLEANUP PREVIEW (dry-run mode)
==============================

Duplicate Types (3 found):
  - User interface: 2 locations -> consolidate to src/types/user.ts
  - Config type: 3 locations -> consolidate to src/types/config.ts

Multiple Approaches (2 found):
  - Date formatting: 3 functions -> standardize on formatDate()

Backward Compat (4 found):
  - @deprecated oldService -> safe to remove (no usages)
  - legacy alias in index.ts -> safe to remove

Dead Code (5 found):
  - unusedHelper (src/utils/helpers.ts) -> no imports found
  - UNUSED_CONSTANT (src/config.ts) -> no references

To apply these changes, run: /cleanup --execute
```

## Phase 5: Execution

**Only when `--execute` flag is provided:**

### 5.1 Create Safety Checkpoint

```bash
git add -A && git commit -m "chore: checkpoint before cleanup"
```

### 5.2 Execute Cleanup Tasks

For each task:
1. Make the change (Edit/Write)
2. Update imports if needed
3. Run incremental validation:
   ```bash
   npx tsc --noEmit
   ```
4. Mark task complete in state

### 5.3 Validation After All Changes

```bash
npm test
npm run lint
npm run build
```

### 5.4 Final Report

```
CLEANUP COMPLETE
================

Changes Applied:
- Removed 3 duplicate type definitions
- Consolidated 2 function implementations
- Removed 4 deprecated exports
- Deleted 5 unused exports

Verification:
- TypeScript: PASS
- Tests: PASS
- Lint: PASS
- Build: PASS

Files Modified: 12
Lines Removed: 156
```

## Command Variants

```bash
/cleanup                          # Analyze entire project (dry-run)
/cleanup src/components/          # Focus on specific directory
/cleanup --category=dead_code     # Focus on specific category
/cleanup --execute                # Execute changes (not dry-run)
/cleanup resume                   # Resume existing session
/cleanup status                   # Check progress
/cleanup new                      # Start fresh (archive existing)
```

## Safety Measures

1. **Dry-run by default** - Never modify without explicit `--execute`
2. **Git checkpoint** - Commit before changes for easy rollback
3. **Incremental validation** - TypeScript check after each change
4. **Full validation** - Tests, lint, build after completion
5. **Session state** - Resume if interrupted

## Integration

This skill works with:
- `/refactor` - For larger structural changes
- `/quality-gate` - Run after cleanup to verify
- `/review` - Review cleanup changes before commit
