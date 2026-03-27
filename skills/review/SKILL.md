---
name: review
description: Code Review - Review local branch changes or GitHub PR with principal agents
argument-hint: [github-pr-url] [context]
disable-model-invocation: true
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite, Write, WebFetch
effort: max
---

# Code Review

Comprehensive code review using all relevant principal agents in parallel.

For shared review framework details, see the `review-base` skill.

**Modes:**
- `/review [context]` - Review current branch changes
- `/review <github-pr-url> [context]` - Review GitHub PR and post review comments

## FULLY AUTOMATED WORKFLOW

This skill runs **without any user prompts**. It will:
1. Detect mode (local branch vs GitHub PR)
2. Fetch changes (git diff or GitHub API)
3. Analyze code using principal agents in parallel
4. Post findings as review comments on GitHub (GitHub mode only)
5. Generate a comprehensive review report

**Do NOT ask user questions during execution.**

## Phase 0: Mode Detection

```bash
ARGS="$ARGUMENTS"
FIRST_ARG=$(echo "$ARGS" | awk '{print $1}')

if echo "$FIRST_ARG" | grep -qE '^https://github\.com/.*/pull/[0-9]+'; then
  MODE="github"
  PR_URL="$FIRST_ARG"
else
  MODE="local"
fi
```

## Phase 1: Get Changes

**LOCAL mode:** Use git diff against base branch, create assets directory.

**GITHUB mode:** Fetch PR data via GitHub API (`gh`), extract diffs and file content to assets directory.

## Phase 2: Categorize Changed Files

| Category | File Patterns | Agents |
|----------|---------------|--------|
| Frontend | `*.tsx`, `*.jsx`, `*.css`, `*.scss` | frontend-principal, ux-principal |
| Backend | `*.ts` in controllers/, services/ | backend-principal |
| DevOps | `*.tf`, `*.yaml`, Dockerfile | devops-principal |
| AI/ML | Files with openai, llm, prompt | ai-principal |
| All | All files | security-principal, architect-principal, bug-finder |

## Phase 3: Spawn Principal Agents in Parallel

**ALWAYS spawn:** security-principal, architect-principal, bug-finder

**Conditionally spawn:** frontend-principal, ux-principal, backend-principal, devops-principal, ai-principal

### Output Format for All Agents

```json
[
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "exact code snippet from a + line (5-50 chars)",
    "comment": "Single-paragraph concise feedback."
  },
  {
    "type": "general",
    "prefix": "[Nice to have]",
    "file_path": "src/path/to/file.ts",
    "comment": "File-level or architectural concern."
  }
]
```

### Comment Style

- Concise, single paragraph preferred
- Natural and human tone
- NO positive/complimentary comments - only actionable feedback
- Code examples ONLY for complex fixes
- NO multi-section format
- Prefixes: `[Blocker]`, `[Nice to have]`, `[Suggestion]`, `[Need to check]`, `[Question]`

## Phase 4: Aggregate Results

Merge findings, deduplicate same-region findings. Group by severity:
1. `[Blocker]` - MUST fix before merge
2. `[Nice to have]` - SHOULD fix
3. `[Suggestion]` - Consider fixing
4. `[Need to check]` - Verify/explain
5. `[Question]` - Needs clarification

## Phase 5: Post to GitHub (GITHUB MODE ONLY)

Post findings as review comments via GitHub API (`gh`), mapping code patterns to line numbers.

## Phase 6: Generate Report

Write review report to assets directory. Display summary with finding counts and links.

## Phase 7: Learning Feedback Loop

If any finding is a repeating pattern, suggest adding it to the appropriate skill via `/extract-learning`.
