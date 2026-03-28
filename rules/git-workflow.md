# Git Workflow

## Commit Format

```
<type>: <description>
```

Types: `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `perf` | `ci` | `style` | `build`

Reference: [conventionalcommits.org](https://www.conventionalcommits.org)

## Key Commands

| Command | Usage |
|---------|-------|
| `/review [pr-url]` | Review local changes or GitHub PR, posts review comments |
| `/commit-all [--scope=path] [context]` | Grouped commits by domain, with multi-session filtering |
| `/split-changes [--push] [--pr] [context...]` | Split branch into domain-focused branches with optional guidance |
| `/merge-branches <branches...> [--pr]` | Merge reviewed domain branches into integration |

## Multi-Session Commit Strategy

When you have accumulated changes from multiple sessions:

- `/commit-all --scope=src/auth` - Commit only files in auth directory
- `/commit-all auth improvements` - Describe your task to auto-filter related files
- `/commit-all` - Interactive mode asks which changes to include

Unrelated changes remain uncommitted for a future `/commit-all`.
