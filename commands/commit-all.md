---
description: Review all changes and create grouped commits following Conventional Commits
argument-hint: [--dry-run]
allowed-tools: Read, Grep, Glob, Bash
---

# Commit All Changes

Intelligently review all uncommitted changes, group them by domain/type, and commit each group following Conventional Commits specification.

**Arguments:**
- `--dry-run`: Preview the commit plan without actually committing

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
| `.github/`, `.gitlab-ci.yml`, CI configs | `ci:` | CI/CD changes |
| Formatting, whitespace only | `style:` | Formatting, missing semicolons |

### Grouping Strategy

1. **Group by feature/domain first** - Files that work together should be committed together
   - Example: A new component + its hook + its service = one `feat:` commit

2. **Separate tests from implementation** - Test files get their own `test:` commit

3. **Separate docs from code** - Documentation changes get their own `docs:` commit

4. **Group config changes together** - All config/chore changes in one `chore:` commit

## Phase 3: Generate Commit Plan

Present the commit plan to the user in this format:

```
## Commit Plan

Analyzing changes...

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

---

[Continue for all groups...]
```

## Phase 4: User Confirmation

After showing the plan, use the `AskUserQuestion` tool to confirm:

**Question:** "Ready to create [N] commits. How would you like to proceed?"
**Header:** "Confirm"
**Options:**
1. **Yes** - "Proceed with creating all commits as planned"
2. **Improve** - "Suggest changes to the commit grouping or messages"

If `--dry-run` was specified, skip this step and show:
```
Dry run complete. No commits were created.
```

Based on response:
- **Yes**: Continue to Phase 5 (Execute Commits)
- **Improve**: Ask user for specific changes, update plan, then ask again
- **Other**: Handle user's custom input accordingly

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
| 3 | ghi9012 | docs: update readme |

All changes committed successfully.
```

If any files were skipped, show them separately.

## Commit Message Examples

**Good messages:**
- `feat: add user authentication endpoint`
- `fix: resolve null pointer in user service`
- `docs: update api documentation`
- `chore: update eslint configuration`
- `refactor: extract validation logic`
- `test: add unit tests for auth service`
- `perf: optimize database queries`
- `ci: add github actions workflow`
- `style: format with prettier`

**Bad messages (avoid):**
- `feat: Added new feature` (past tense)
- `FEAT: Add feature` (uppercase prefix)
- `feat: add user authentication endpoint with proper validation and error handling` (too long)
- `feat: stuff` (not descriptive)

## Error Handling

- If no changes to commit: "No changes detected. Nothing to commit."
- If git fails: Show error and stop
- If user declines: "Commit cancelled. No changes were made."
