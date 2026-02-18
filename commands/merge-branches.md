---
description: Merge multiple reviewed branches into a single integration branch
argument-hint: "<branch1> <branch2> ... [--name <branch-name>] [--push] [--mr]"
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
- **--name value**: custom integration branch name (the token after `--name`)
- **--push**: push flag
- **--mr**: MR creation flag (implies --push)

### 1.2 Validate

**Check branch count:**
- If fewer than 2 branches provided: error "At least 2 branches required. Usage: /merge-branches <branch1> <branch2> ... [--name <name>] [--push] [--mr]"

**Check for uncommitted changes:**
```bash
git status --porcelain
```
If non-empty: error "Uncommitted changes detected. Please commit or stash changes before merging."

**Detect base branch:**
```bash
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5 || echo "")

if [ -z "$BASE_BRANCH" ] || [ "$BASE_BRANCH" = "(unknown)" ]; then
  if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
    BASE_BRANCH="main"
  elif git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
    BASE_BRANCH="master"
  else
    BASE_BRANCH="main"
  fi
fi
```

**Fetch latest and validate branches exist:**
```bash
git fetch origin
```

For each branch name provided:
```bash
# Check local first, then remote
git show-ref --verify --quiet refs/heads/<branch> 2>/dev/null || \
git show-ref --verify --quiet refs/remotes/origin/<branch> 2>/dev/null
```
If a branch does not exist locally or on remote: error "Branch '<name>' not found locally or on remote."

### 1.3 Determine Integration Branch Name

- If `--name` provided: use that name
- Otherwise: derive from branch names
  - If branches share a common prefix (e.g., `split/feature-xyz/`): use `integrate/<common-part>`
  - Otherwise: use `integrate/<first-branch-slug>`
- If the integration branch already exists: error "Branch '<name>' already exists. Use --name to specify a different name, or delete it first."

## Phase 2: Present Merge Plan

### 2.1 Gather Branch Info

For each branch, collect:
```bash
# Commit count ahead of base
git log origin/$BASE_BRANCH..<branch> --oneline --no-merges 2>/dev/null | wc -l

# Diff stats
git diff origin/$BASE_BRANCH..<branch> --shortstat 2>/dev/null

# Latest commit message
git log <branch> -1 --pretty=format:"%s" 2>/dev/null
```

### 2.2 Display Plan

```
## Merge Plan

Integration branch: <integration-branch-name> (from <BASE_BRANCH>)

Branches to merge (in order):

| # | Branch | Commits | Stats | Latest Commit |
|---|--------|---------|-------|---------------|
| 1 | split/feature/user-auth | 3 | 5 files, +120/-30 | feat: add auth flow |
| 2 | split/feature/api-config | 1 | 3 files, +45/-10 | chore: update api config |
| 3 | split/feature/ui-updates | 2 | 8 files, +200/-50 | feat: redesign dashboard |
```

### 2.3 User Confirmation

Use `AskUserQuestion`:
- **Question:** "Ready to merge M branches into <integration-branch>. How would you like to proceed?"
- **Header:** "Confirm"
- **Options:**
  1. **Proceed** - "Merge all branches in the order shown"
  2. **Change order** - "Specify a different merge order"
  3. **Cancel** - "Abort the merge"

If "Change order": ask user for the new order, update the plan, and present again.
If "Cancel": "Merge cancelled. No changes were made."

## Phase 3: Execute Merge

Use `TodoWrite` to track progress through each merge.

### 3.1 Create Integration Branch

```bash
git checkout -b <integration-branch> origin/$BASE_BRANCH
```

### 3.2 Merge Each Branch

For each branch (in the confirmed order):

```bash
git merge <branch> --no-edit
```

**If merge succeeds:** mark branch as merged in todo, continue to next.

**If merge conflict occurs:**
1. Show conflicting files:
   ```bash
   git diff --name-only --diff-filter=U
   ```
2. Display to user:
   ```
   Merge conflict while merging <branch>.

   Conflicting files:
   - path/to/file1.ts
   - path/to/file2.ts

   Please resolve conflicts manually, then tell me to continue.
   After resolving:
     git add <resolved-files>
     git merge --continue
   ```
3. **Stop and wait for user** to resolve conflicts before continuing with remaining branches.

### 3.3 Show Combined Stats

After all branches are merged:

```bash
# Combined diff against base
git diff origin/$BASE_BRANCH..HEAD --shortstat
git diff origin/$BASE_BRANCH..HEAD --name-only
git log origin/$BASE_BRANCH..HEAD --oneline --no-merges
```

Display:
```
## Merge Complete

All M branches merged into <integration-branch>.

Combined stats:
- Files changed: X
- Insertions: +N
- Deletions: -M
- Total commits: Y
```

## Phase 4: Push & Create MR

### 4.1 Push (if --push or --mr)

```bash
git push -u origin <integration-branch>
```

### 4.2 Create GitLab MR (if --mr)

Source GitLab token:
```bash
source ~/.claude/.secrets
```

Get project ID:
```bash
REMOTE_URL=$(git remote get-url origin)
PROJECT_PATH=$(echo "$REMOTE_URL" | sed 's/.*gitlab.com[:/]\(.*\)\.git/\1/' | sed 's/\//%2F/g')
```

Create MR via GitLab API:
```bash
curl --silent --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "source_branch": "<integration-branch>",
    "target_branch": "<BASE_BRANCH>",
    "title": "<MR title derived from integration branch>",
    "description": "<description>",
    "remove_source_branch": true
  }' \
  "https://gitlab.com/api/v4/projects/$PROJECT_PATH/merge_requests"
```

MR description format:
```
<One-line summary of all changes>

Merged branches:
- <branch1>: <latest commit summary>
- <branch2>: <latest commit summary>
- <branch3>: <latest commit summary>

Key changes:
- <Change 1>
- <Change 2>
- <Change 3>

Files: X changed | +N/-M lines
```

Show the MR URL after creation.

### 4.3 Branch Cleanup

Use `AskUserQuestion`:
- **Question:** "Delete the domain branches that were merged?"
- **Header:** "Cleanup"
- **Options:**
  1. **Yes, local and remote** - "Delete merged branches from both local and remote"
  2. **Local only** - "Delete local copies, keep remote branches"
  3. **No, keep them** - "Leave all branches as-is"

If "Yes, local and remote":
```bash
git branch -d <branch1> <branch2> ...
git push origin --delete <branch1> <branch2> ...
```

If "Local only":
```bash
git branch -d <branch1> <branch2> ...
```

## Phase 5: Final Report

```
## Integration Complete

Integration branch: <integration-branch>
Target: <BASE_BRANCH>
MR: <MR URL or "not created">

Merged branches:
| # | Branch | Status |
|---|--------|--------|
| 1 | split/feature/user-auth | Merged |
| 2 | split/feature/api-config | Merged |
| 3 | split/feature/ui-updates | Merged |

Combined: X files changed, +N/-M lines, Y commits

Cleanup: <branches deleted / kept>
```

## Error Handling

- **Fewer than 2 branches:** "At least 2 branches required. Usage: /merge-branches <branch1> <branch2> ..."
- **Branch not found:** "Branch '<name>' not found locally or on remote. Run `git fetch origin` and try again."
- **Uncommitted changes:** "Uncommitted changes detected. Please commit or stash changes before merging."
- **Integration branch exists:** "Branch '<name>' already exists. Use --name to specify a different name."
- **Merge conflict:** Show conflicting files and instructions, wait for user resolution.
- **No GITLAB_TOKEN (when --mr):** "GITLAB_TOKEN not found in ~/.claude/.secrets. Cannot create MR."
- **Push fails:** Show error and suggest checking remote permissions.
