---
name: commit-all
description: Review all changes and create grouped commits following Conventional Commits
argument-hint: [--dry-run] [--scope=<path-or-pattern>] [<context-description>]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
---

# Commit All Changes

Intelligently review all uncommitted changes, group them by domain/type, and commit each group following Conventional Commits specification.

**Arguments:**
- `--dry-run`: Preview the commit plan without actually committing
- `--scope=<path>`: Only include changes in the specified path (e.g., `--scope=src/auth`)
- `<context>`: Free text describing what you were working on (helps filter unrelated changes)

## Multi-Session Change Filtering

When you have accumulated changes from multiple sessions, this skill helps you commit only the relevant changes:

1. **Scope by path**: Use `--scope=src/feature` to limit to a directory
2. **Scope by context**: Describe your task (e.g., "auth improvements") and we'll identify related files
3. **Interactive selection**: Review all changes and exclude unrelated files

## Phase 1: Analyze All Changes

Run these commands to understand the current state:

1. **Get all changed files:**
   ```bash
   git status --porcelain
   ```

2. **Get staged changes:**
   ```bash
   git diff --cached --stat
   ```

3. **Get unstaged changes:**
   ```bash
   git diff --stat
   ```

4. **Get detailed diff for understanding changes:**
   ```bash
   git diff
   git diff --cached
   ```

## Phase 2: Group Changes by Domain

Analyze each changed file and group them based on:

### Conventional Commits Prefix Rules

| File/Change Pattern | Prefix | Description |
|---------------------|--------|-------------|
| New functionality, new features | `feat:` | A new feature |
| Bug fixes, error corrections | `fix:` | A bug fix |
| `*.md`, `*.txt`, JSDoc changes | `docs:` | Documentation only |
| Config files, deps, build scripts | `chore:` | Maintenance tasks |
| Code restructuring, no behavior change | `refactor:` | Code change that neither fixes nor adds |
| `*.spec.ts`, `*.test.ts`, `__tests__/` | `test:` | Adding/correcting tests |
| Performance improvements | `perf:` | Performance improvement |
| `.github/`, CI configs | `ci:` | CI/CD changes |
| Formatting, whitespace only | `style:` | Formatting, missing semicolons |

### Grouping Strategy

1. **Group by feature/domain first** - Files that work together should be committed together
2. **Separate tests from implementation** - Test files get their own `test:` commit
3. **Separate docs from code** - Documentation changes get their own `docs:` commit
4. **Group config changes together** - All config/chore changes in one `chore:` commit

## Phase 3: Generate Commit Plan

Present the commit plan to the user in this format:

```
## Commit Plan

Found [N] changed files across [M] groups:

---

### Commit 1: [prefix]: [message under 60 chars]
Files:
  - path/to/file1.ts (new|modified|deleted)
  - path/to/file2.ts (new|modified|deleted)

---

### Commit 2: [prefix]: [message under 60 chars]
Files:
  - path/to/file3.ts (modified)
```

## Phase 4: User Confirmation

After showing the plan, use the `AskUserQuestion` tool to confirm:

**Question:** "Ready to create [N] commits. How would you like to proceed?"
**Options:**
1. **Yes** - "Proceed with creating all commits as planned"
2. **Improve** - "Suggest changes to the commit grouping or messages"

If `--dry-run` was specified, skip this step and show: "Dry run complete. No commits were created."

## Phase 5: Execute Commits

For each commit group, execute:

```bash
git add <file1> <file2> ...
git commit -m "<prefix>: <message>"
```

**CRITICAL RULES:**
1. **NO Claude signature** - Do NOT add any `Co-Authored-By` line
2. **Use simple `-m` flag** - No HEREDOC needed for simple messages
3. **Under 60 characters** - Total message must be under 60 chars
4. **Imperative mood** - "add X" not "added X", "fix Y" not "fixed Y"
5. **Lowercase prefix** - Always `feat:` not `Feat:`

## Phase 6: Report Summary

After all commits are created, show:

```
## Commit Summary

Created [N] commits:

| # | Hash | Message |
|---|------|---------|
| 1 | abc1234 | feat: add user auth flow |
| 2 | def5678 | test: add auth service tests |

All changes committed successfully.
```

## Error Handling

- If no changes to commit: "No changes detected. Nothing to commit."
- If git fails: Show error and stop
- If user declines: "Commit cancelled. No changes were made."
