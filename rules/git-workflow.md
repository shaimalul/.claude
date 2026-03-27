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
| `/commit-all` | Grouped commits by domain |
| `/split-changes [--push] [--pr] [context...]` | Split branch into domain-focused branches with optional guidance |
| `/merge-branches <branches...> [--pr]` | Merge reviewed domain branches into integration |
