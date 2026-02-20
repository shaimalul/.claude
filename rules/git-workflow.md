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
| `/review [mr-url]` | Review local changes or GitLab MR, posts draft comments |
| `/gitlab-fix-comments <mr-url>` | Apply MR comment suggestions |
| `/mr-description` | Generate MR description |
| `/commit-all` | Grouped commits by domain |
| `/split-changes [--push] [--mr]` | Split branch into domain-focused branches |
| `/merge-branches <branches...> [--mr]` | Merge reviewed domain branches into integration |
