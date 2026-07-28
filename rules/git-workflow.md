# Git Workflow

## Commit Format

```
<type>: <description>
```

Types: `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `perf` | `ci` | `style` | `build`

Reference: [conventionalcommits.org](https://www.conventionalcommits.org)

## Committing Changes

NEVER run `git commit` directly. The ONLY way to create commits is when the user explicitly invokes `/commit-all`. This applies everywhere — after implementing features, fixing bugs, making changes, or completing any task. NEVER commit as part of finishing work. If changes need to be committed, tell the user to run `/commit-all`.

## Commit Grouping (MANDATORY)

NEVER commit all changes in a single commit. Changes MUST be grouped by domain/type and committed separately (e.g., one commit for the feature, one for tests, one for docs).

If any files are already staged when `/commit-all` starts:
1. Unstage ALL files first with `git reset`
2. Analyze ALL changes (staged and unstaged together)
3. Create a commit plan grouping by domain
4. Execute commits according to the plan

This ensures consistent, reviewable commit history regardless of the initial staging state.

## Branch Safety Before Committing

ALWAYS check the current branch before committing.

Protected branches: `main`, `master` (teams may extend this list for branches like `develop`, `release/*`)

If on a protected branch:
1. Analyze changed files to infer a meaningful branch name
2. Suggest creating the branch and offer to run `git checkout -b [suggested-name]`
3. NEVER commit directly to the protected branch without explicit user confirmation

After committing on a feature branch, offer to push but NEVER push automatically. User must explicitly authorize the push.

## Key Skills

| Skill | Usage |
|-------|-------|
| `/review [mr-url]` | Review local changes or GitHub PR, posts draft comments |
| `/resolve-pr <mr-url>` | Analyze PR discussions, plan responses, apply fixes, post comments |
| `/pr-description` | Generate PR description |
| `/commit-all` | Grouped commits by domain |
| `/split-changes [--push] [--pr] [context...]` | Split branch into domain-focused branches with optional guidance |
| `/merge-branches <branches...> [--pr]` | Merge reviewed domain branches into integration |
