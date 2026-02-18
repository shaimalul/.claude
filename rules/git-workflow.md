# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci, style, build

Reference: [conventionalcommits.org](https://www.conventionalcommits.org)

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Plan First**
   - Use `/plan-task` to create implementation plan
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use `/review` command immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format
   - Use `/commit-all` for grouped commits

## Split & Merge Review Workflow

For large changes spanning multiple domains:

1. Complete all changes on a feature branch
2. Run `/commit-all` to organize commits
3. Run `/split-changes` to split into domain branches
   - Add `--push --mr` to also push and create GitLab MRs
4. Developers review each domain MR independently
5. Address review feedback on each domain branch
6. Run `/merge-branches <branch1> <branch2> ... --mr` to:
   - Merge all reviewed branches into integration branch
   - Create final MR to master

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/split-changes` | `/split-changes [--dry-run] [--push] [--mr]` | Split current branch into domain branches |
| `/merge-branches` | `/merge-branches <branches...> [--name <name>] [--push] [--mr]` | Merge branches into integration branch |

### Example Workflow

```bash
# 1. Organize and commit all changes
/commit-all

# 2. Split into domain branches and create MRs
/split-changes --push --mr

# 3. After all domain MRs are reviewed and approved:
/merge-branches split/feature/user-auth split/feature/api-config split/feature/ui-updates --mr
```

## GitLab Integration

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/review` | `/review [context]` | Review local branch changes |
| `/review` | `/review <mr-url> [context]` | Review GitLab MR, post draft comments |
| `/gitlab-fix-comments` | `/gitlab-fix-comments <mr-url>` | Apply MR comment suggestions |
| `/mr-description` | `/mr-description` | Generate MR description from changes |

### Example Workflow

```bash
# 1. Review an MR (posts draft comments)
/review https://gitlab.com/group/project/-/merge_requests/123

# 2. After receiving feedback, fix the comments
/gitlab-fix-comments https://gitlab.com/group/project/-/merge_requests/123

# 3. Learnable patterns are automatically detected
# Run extract-learning if prompted
/extract-learning "patterns from MR #123"
```

### Continuous Learning Integration

Both `/review` and `/gitlab-fix-comments` integrate with the continuous learning system:

1. **Pattern Detection**: Critical and recommended fixes are flagged as learnable
2. **Auto-Extraction**: Patterns appearing 2+ times are prioritized
3. **Skill Integration**: Run `/extract-learning` to integrate patterns into existing domain skills
4. **Future Prevention**: Patterns become part of the relevant skill (styling-rtl, react-component, etc.)

This creates a feedback loop where every MR review improves the skill files directly.
