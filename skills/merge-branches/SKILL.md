---
name: merge-branches
description: Merge multiple reviewed branches into a single integration branch
argument-hint: "<branch1> <branch2> ... [--name <branch-name>] [--push] [--mr]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
---

# Merge Branches into Integration Branch

After domain branches have been reviewed and approved (via `/split-changes`), merge them all back into a single integration branch. Optionally push and create a final MR to the base branch.

**Arguments:** `$ARGUMENTS`
- Positional: branch names (space-separated, at least 2)
- `--name <branch-name>`: Custom integration branch name (default: auto-generated)
- `--push`: Push the integration branch to remote
- `--mr`: Create a GitLab MR from the integration branch (implies --push)

## Phase 1: Parse & Validate

### 1.1 Parse Arguments

Parse `$ARGUMENTS` to extract:
- **Branch names**: all positional arguments (not starting with `--`)
- **--name value**: custom integration branch name
- **--push**: push flag
- **--mr**: MR creation flag (implies --push)

### 1.2 Validate

**Check branch count:** If fewer than 2: error.

**Check for uncommitted changes:**
```bash
git status --porcelain
```

**Detect base branch:**
```bash
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5 || echo "main")
```

**Fetch latest and validate branches exist:**
```bash
git fetch origin
```

### 1.3 Determine Integration Branch Name

- If `--name` provided: use that
- Otherwise: derive from branch names (common prefix or `integrate/<first-branch-slug>`)

## Phase 2: Present Merge Plan

For each branch, collect commit count, diff stats, latest commit message.

Use `AskUserQuestion` for confirmation with options: Proceed, Change order, Cancel.

## Phase 3: Execute Merge

```bash
git checkout -b <integration-branch> origin/$BASE_BRANCH
```

For each branch:
```bash
git merge <branch> --no-edit
```

If merge conflict: show conflicting files and wait for user resolution.

## Phase 4: Push & Create MR

### 4.1 Push (if --push or --mr)
```bash
git push -u origin <integration-branch>
```

### 4.2 Create GitLab MR (if --mr)

Create MR via GitLab API with merged branch details.

### 4.3 Branch Cleanup

Ask user whether to delete merged branches.

## Phase 5: Final Report

```
## Integration Complete

Integration branch: <integration-branch>
Target: <BASE_BRANCH>

| # | Branch | Status |
|---|--------|--------|
| 1 | branch-1 | Merged |
| 2 | branch-2 | Merged |

Combined: X files changed, +N/-M lines, Y commits
```
