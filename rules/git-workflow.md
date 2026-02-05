# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

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

## GitLab Integration

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/gitlab-review` | `/gitlab-review <mr-url>` | Review MR, post draft comments |
| `/gitlab-fix-comments` | `/gitlab-fix-comments <mr-url>` | Apply MR comment suggestions |
| `/mr-description` | `/mr-description` | Generate MR description from changes |

### Example Workflow

```bash
# 1. Review an MR (posts draft comments)
/gitlab-review https://gitlab.com/group/project/-/merge_requests/123

# 2. After receiving feedback, fix the comments
/gitlab-fix-comments https://gitlab.com/group/project/-/merge_requests/123

# 3. Learnable patterns are automatically detected
# Run extract-learning if prompted
/extract-learning "patterns from MR #123"
```

### Continuous Learning Integration

Both `/gitlab-review` and `/gitlab-fix-comments` integrate with the continuous learning system:

1. **Pattern Detection**: Critical and recommended fixes are flagged as learnable
2. **Auto-Extraction**: Patterns appearing 2+ times are prioritized
3. **Skill Saving**: Run `/extract-learning` to save patterns to `~/.claude/skills/learned/`
4. **Future Prevention**: Learned patterns are loaded in future sessions via `session-start.js`

This creates a feedback loop where every MR review improves future code quality.
