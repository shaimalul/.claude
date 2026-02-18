---
description: Split branch changes into domain-specific branches for focused MR review
argument-hint: "[--dry-run] [--push] [--mr]"
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
model: opus
---

# Split Changes into Domain Branches

Analyze all changes on the current feature branch, group them by domain/feature, and split into separate branches with auto-commits. This enables focused MR reviews where each MR covers a single domain.

**Arguments:** `$ARGUMENTS`
- `--dry-run`: Preview the split plan without creating branches
- `--push`: Push all created branches to remote
- `--mr`: Create GitLab MRs for each branch (implies --push)

## Phase 1: Validate & Analyze

### 1.1 Detect Base Branch

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

CURRENT_BRANCH=$(git branch --show-current)
echo "Current: $CURRENT_BRANCH | Base: $BASE_BRANCH"
```

### 1.2 Validate State

- If `$CURRENT_BRANCH` equals `$BASE_BRANCH`: error "You are on the base branch. Switch to a feature branch first."
- If `$CURRENT_BRANCH` is empty: error "Detached HEAD state. Please checkout a branch."
- Check uncommitted changes:
  ```bash
  git status --porcelain
  ```
  If output is non-empty: error "Uncommitted changes detected. Please run /commit-all first to organize and commit your changes."

### 1.3 Analyze All Changes

```bash
MERGE_BASE=$(git merge-base HEAD $BASE_BRANCH)

# Get file change status (A=added, M=modified, D=deleted, R=renamed)
git diff $MERGE_BASE..HEAD --name-status

# Get diff stats
git diff $MERGE_BASE..HEAD --stat

# Get full diff for understanding change content
git diff $MERGE_BASE..HEAD
```

If no changes found: "Branch is up to date with $BASE_BRANCH. Nothing to split."

Save `ORIGINAL_BRANCH=$CURRENT_BRANCH` for later.

## Phase 2: AI Domain Grouping

Analyze all changed files and propose domain groupings based on:

### Analysis Criteria

1. **Directory structure** - Files in the same feature/module directory likely belong together
2. **File type patterns** - Components, services, hooks, tests, config, migrations
3. **Change content** - What feature or business concern does each change address
4. **Dependency chains** - Keep related files together:
   - A component + its hook + its service + its styles + its tests = same domain
   - A controller + its service + its DTO + its tests = same domain
5. **Import relationships** - Files that import from each other should stay together

### Grouping Rules

- Each domain MUST be a coherent, independently reviewable unit
- Related files MUST stay together (never separate a component from its hook)
- Tests should stay with their implementation domain (not a separate "tests" domain)
- Config/chore changes that span multiple domains get their own domain
- Aim for 2-5 domains total (fewer is better for review overhead)
- Each domain gets a descriptive kebab-case slug (e.g., `user-auth`, `payment-flow`, `api-endpoints`, `shared-config`)
- Every changed file MUST be assigned to exactly one domain (no files left behind)

### Domain Name Convention

Use descriptive, lowercase, kebab-case names that reflect the business/feature concern:
- `user-auth` (not `frontend` or `components`)
- `order-processing` (not `backend` or `services`)
- `shared-config` (for cross-cutting config changes)
- `database-migrations` (for DB schema changes)

## Phase 3: Present Split Plan

Display the proposed plan:

```
## Split Plan

Original branch: <ORIGINAL_BRANCH> -> base: <BASE_BRANCH>
Found N changed files across M domains:

---

### Domain 1: <domain-slug>
Branch: split/<ORIGINAL_BRANCH>/<domain-slug>
Files:
  - path/to/file1.ts (added)
  - path/to/file2.ts (modified)
  - path/to/file3.ts (deleted)
Proposed commits:
  - <prefix>: <commit message>
  - <prefix>: <commit message>

---

### Domain 2: <domain-slug>
Branch: split/<ORIGINAL_BRANCH>/<domain-slug>
Files:
  - path/to/file4.ts (modified)
Proposed commits:
  - <prefix>: <commit message>

---

Total: N files across M domains
```

### User Confirmation

If `--dry-run` flag is present:
- Show the plan above
- Display: "Dry run complete. Run `/split-changes` to execute."
- Stop here.

Otherwise, use `AskUserQuestion`:
- **Question:** "Split plan ready with M domains. How would you like to proceed?"
- **Header:** "Confirm"
- **Options:**
  1. **Proceed** - "Create all domain branches as planned"
  2. **Adjust** - "Modify the domain grouping or commit messages"

If "Adjust": ask user for specific feedback, update groupings, and present the plan again.

## Phase 4: Execute Split

Use `TodoWrite` to track progress through each domain.

For each domain group:

### 4.1 Create Branch

```bash
git checkout -b split/<ORIGINAL_BRANCH>/<domain-slug> $BASE_BRANCH
```

### 4.2 Bring Files from Original Branch

Separate files by their change type:

**For added and modified files:**
```bash
git checkout <ORIGINAL_BRANCH> -- <file1> <file2> <file3>
```

**For deleted files:**
```bash
git rm <deleted-file1> <deleted-file2>
```

**For renamed files (R status with old->new path):**
```bash
git rm <old-path>
git checkout <ORIGINAL_BRANCH> -- <new-path>
```

### 4.3 Stage and Commit

Group files within the domain by Conventional Commits type and create commits:

**Conventional Commits prefix rules:**

| File/Change Pattern | Prefix |
|---------------------|--------|
| New functionality | `feat:` |
| Bug fixes | `fix:` |
| Documentation files | `docs:` |
| Config, deps, build | `chore:` |
| Code restructuring | `refactor:` |
| Test files | `test:` |
| Performance improvements | `perf:` |
| CI configs | `ci:` |
| Formatting only | `style:` |

```bash
git add <files-for-this-commit>
git commit -m "<prefix>: <message under 60 chars>"
```

**Commit rules:**
- NO Co-Authored-By lines
- Under 60 characters total
- Imperative mood ("add X" not "added X")
- Lowercase prefix (`feat:` not `Feat:`)
- Use simple `-m` flag

### 4.4 Return to Original Branch

After ALL domains are processed:

```bash
git checkout <ORIGINAL_BRANCH>
```

## Phase 5: Push & Report

### 5.1 Push Branches (if --push or --mr)

For each created branch:
```bash
git push -u origin split/<ORIGINAL_BRANCH>/<domain-slug>
```

### 5.2 Create GitLab MRs (if --mr)

Source GitLab token:
```bash
source ~/.claude/.secrets
```

For each branch, create MR via GitLab API:

```bash
curl --silent --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "source_branch": "split/<ORIGINAL_BRANCH>/<domain-slug>",
    "target_branch": "<BASE_BRANCH>",
    "title": "[Split] <domain description>",
    "description": "<focused summary of domain changes>",
    "remove_source_branch": false
  }' \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests"
```

To get PROJECT_ID:
```bash
# Extract from git remote URL
REMOTE_URL=$(git remote get-url origin)
# URL-encode the project path for API
PROJECT_PATH=$(echo "$REMOTE_URL" | sed 's/.*gitlab.com[:/]\(.*\)\.git/\1/' | sed 's/\//%2F/g')
```

MR description format:
```
<One-line summary of domain changes>

Key changes:
- <Change 1>
- <Change 2>

Part of split review from branch: <ORIGINAL_BRANCH>
Files: X changed | +N/-M lines
```

### 5.3 Summary Report

```
## Split Complete

Created M domain branches from <ORIGINAL_BRANCH>:

| # | Branch | Domain | Files | Commits | MR |
|---|--------|--------|-------|---------|-----|
| 1 | split/<orig>/user-auth | User Auth | 5 | 2 | !123 |
| 2 | split/<orig>/api-config | API Config | 3 | 1 | !124 |

Next steps:
- Review each MR independently
- After all approved, run:
  /merge-branches split/<orig>/user-auth split/<orig>/api-config --mr
```

If branches were not pushed (no --push/--mr flag):
```
Branches created locally. To push and create MRs:
  /split-changes --mr

Or push manually:
  git push -u origin <branch-name>
```

## Error Handling

- **No changes:** "No changes found between current branch and base. Nothing to split."
- **Uncommitted changes:** "Uncommitted changes detected. Please run /commit-all first."
- **On base branch:** "You are on the base branch. Switch to a feature branch first."
- **Detached HEAD:** "Detached HEAD state. Please checkout a branch."
- **Git operation fails:** Show error message, attempt to return to original branch with `git checkout <ORIGINAL_BRANCH>`
- **Branch already exists:** "Branch split/<name> already exists. Delete it first or use a different name."
- **No GITLAB_TOKEN (when --mr):** "GITLAB_TOKEN not found in ~/.claude/.secrets. Cannot create MRs."
