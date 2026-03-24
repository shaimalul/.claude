---
name: split-changes
description: Split branch changes into domain-specific branches for focused MR review
argument-hint: "[--dry-run] [--push] [--mr] [context...]"
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, TodoWrite
model: opus
---

# Split Changes into Domain Branches

Analyze all changes on the current feature branch, group them by domain/feature, and split into separate branches with auto-commits. Enables focused MR reviews where each MR covers a single domain.

**Arguments:** `$ARGUMENTS`
- `--dry-run`: Preview the split plan without creating branches
- `--push`: Push all created branches to remote
- `--mr`: Create GitLab MRs for each branch (implies --push)
- Remaining text = **context** guiding the split

## Phase 1: Validate & Analyze

Detect base branch, validate state (not on base, no uncommitted changes), analyze all changes.

## Phase 2: AI Domain Grouping

Group files by:
1. Directory structure
2. File type patterns
3. Change content (feature/business concern)
4. Dependency chains (component + hook + service = same domain)
5. Import relationships

**Rules:**
- Each domain must be independently reviewable
- Related files stay together
- Tests stay with implementation
- Aim for 2-5 domains
- Every changed file assigned to exactly one domain

## Phase 3: Present Split Plan

Show proposed plan with branch names, files, and proposed commits. Ask for confirmation.

## Phase 4: Execute Split

For each domain:
1. Create branch from base: `git checkout -b split/<orig>/<domain-slug> $BASE_BRANCH`
2. Checkout files from original branch
3. Stage and commit following Conventional Commits
4. Verify branch (build, TypeScript, tests, lint) with fix-and-retry loop (max 3 attempts)

## Phase 5: Push & Report

Push branches if `--push` or `--mr`. Create GitLab MRs if `--mr`.

```
## Split Complete

Created M domain branches from <ORIGINAL_BRANCH>:

| # | Branch | Domain | Files | Verified | MR |
|---|--------|--------|-------|----------|-----|
| 1 | split/<orig>/user-auth | User Auth | 5 | PASS | !123 |

Next steps:
- Review each MR independently
- After all approved: /merge-branches split/<orig>/user-auth split/<orig>/api-config --mr
```

## Error Handling

- No changes: "Nothing to split."
- Uncommitted changes: "Please run /commit-all first."
- On base branch: "Switch to a feature branch first."
- Verification failed: Ask user to Skip or Abort.
