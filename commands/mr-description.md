---
description: Generate a concise MR description from local git changes
allowed-tools: Bash, Read, Grep, Glob
---

# MR Description Generator

Generate a short and concise description for a merge request based on local git changes and commits in the current branch.

## Phase 1: Collect Git Data

Run these commands to gather branch information:

```bash
# Get base branch (main or master)
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5 || echo "")

# Fallback to local check if remote fails
if [ -z "$BASE_BRANCH" ] || [ "$BASE_BRANCH" = "(unknown)" ]; then
  if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
    BASE_BRANCH="main"
  elif git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
    BASE_BRANCH="master"
  else
    BASE_BRANCH="main"
  fi
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on the base branch
if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "Error: You are on the base branch ($BASE_BRANCH)."
  echo "Please switch to a feature branch to generate an MR description."
  exit 1
fi

# Check if branch exists
if [ -z "$CURRENT_BRANCH" ]; then
  echo "Error: Not on a branch (detached HEAD state)."
  exit 1
fi

# Get merge base (common ancestor)
MERGE_BASE=$(git merge-base HEAD "$BASE_BRANCH" 2>/dev/null)

if [ -z "$MERGE_BASE" ]; then
  echo "Error: Could not find common ancestor with $BASE_BRANCH"
  echo "Make sure $BASE_BRANCH branch exists locally."
  exit 1
fi

echo "Branch: $CURRENT_BRANCH -> $BASE_BRANCH"
echo ""
```

## Phase 2: Analyze Commits

```bash
# Get all commit messages in the branch (excluding merge commits)
echo "=== COMMITS IN BRANCH ==="
git log "$MERGE_BASE"..HEAD --no-merges --pretty=format:"%s" 2>/dev/null

echo ""
echo ""
echo "=== COMMIT COUNT ==="
COMMIT_COUNT=$(git log "$MERGE_BASE"..HEAD --no-merges --oneline 2>/dev/null | wc -l | tr -d ' ')
echo "Total commits: $COMMIT_COUNT"
```

## Phase 3: Analyze Changed Files

```bash
echo ""
echo "=== CHANGED FILES ==="
git diff "$MERGE_BASE"..HEAD --name-only 2>/dev/null

echo ""
echo "=== DIFF STATS ==="
git diff "$MERGE_BASE"..HEAD --stat 2>/dev/null

echo ""
echo "=== FILE COUNTS ==="
FILES_CHANGED=$(git diff "$MERGE_BASE"..HEAD --name-only 2>/dev/null | wc -l | tr -d ' ')
NEW_FILES=$(git diff "$MERGE_BASE"..HEAD --diff-filter=A --name-only 2>/dev/null | wc -l | tr -d ' ')
MODIFIED_FILES=$(git diff "$MERGE_BASE"..HEAD --diff-filter=M --name-only 2>/dev/null | wc -l | tr -d ' ')
DELETED_FILES=$(git diff "$MERGE_BASE"..HEAD --diff-filter=D --name-only 2>/dev/null | wc -l | tr -d ' ')

echo "Files changed: $FILES_CHANGED"
echo "New files: $NEW_FILES"
echo "Modified files: $MODIFIED_FILES"
echo "Deleted files: $DELETED_FILES"

# Get insertions/deletions
STAT_SUMMARY=$(git diff "$MERGE_BASE"..HEAD --shortstat 2>/dev/null)
echo "Stats: $STAT_SUMMARY"
```

## Phase 4: Show Sample Diffs for Context

```bash
echo ""
echo "=== KEY CHANGES (first 100 lines of diff) ==="
git diff "$MERGE_BASE"..HEAD --no-color 2>/dev/null | head -100
```

## Analysis Instructions

Based on the git data above, generate a concise MR description following these rules:

### Summary Line
- One sentence describing the main purpose (under 80 chars)
- Use imperative mood ("Add", "Fix", "Update", not "Added", "Fixed")
- Focus on the "why" not just the "what"

### Key Changes
- Bullet list of 3-8 items maximum
- Group related changes together
- Start each bullet with a verb
- Keep each bullet under 80 characters
- Priority order: features > fixes > refactoring > tests > chores

### Stats Line
- Format: `Files: X changed (Y new, Z modified, W deleted) | +N/-M lines`

### Areas Detection
Identify affected areas from file paths:
- **UI components**: tsx, jsx, components/, screens/, hooks/
- **Backend/services**: services/, controllers/, repositories/, api/
- **Tests**: spec, test files, __tests__/
- **Styles**: css, scss, less, module.scss
- **Configuration**: json, yaml, config files, tsconfig, webpack
- **Documentation**: md files, README
- **Infrastructure**: Dockerfile, terraform, CI configs
- **Database**: migrations, schemas, prisma

## Output Format

Generate the description in this exact format:

```
[One-line summary in imperative mood]

Key changes:
- [Change 1]
- [Change 2]
- [Change 3]
...

Files: X changed (Y new, Z modified, W deleted) | +N/-M lines
Areas: [area1], [area2], ...
```

## Rules

- NO emojis
- NO Claude attribution or signatures
- NO "Co-Authored-By" lines
- Keep it professional and concise
- Total description should be 10-20 lines maximum

## Final Step

After generating the description, copy it to clipboard:

```bash
# The description should be saved to a variable or echoed
# Then copy to clipboard (macOS)
if command -v pbcopy &> /dev/null; then
  echo "[DESCRIPTION]" | pbcopy
  echo "Copied to clipboard!"
elif command -v xclip &> /dev/null; then
  echo "[DESCRIPTION]" | xclip -selection clipboard
  echo "Copied to clipboard!"
elif command -v xsel &> /dev/null; then
  echo "[DESCRIPTION]" | xsel --clipboard
  echo "Copied to clipboard!"
fi
```
