---
name: mr-description
description: Generate a concise MR description from local git changes
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob
---

# MR Description Generator

Generate a short and concise description for a merge request based on local git changes and commits in the current branch.

## Phase 1: Collect Git Data

```bash
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5 || echo "main")
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "Error: You are on the base branch ($BASE_BRANCH)."
  exit 1
fi

MERGE_BASE=$(git merge-base HEAD "$BASE_BRANCH" 2>/dev/null)
echo "Branch: $CURRENT_BRANCH -> $BASE_BRANCH"
```

## Phase 2: Analyze Commits

```bash
git log "$MERGE_BASE"..HEAD --no-merges --pretty=format:"%s" 2>/dev/null
```

## Phase 3: Analyze Changed Files

```bash
git diff "$MERGE_BASE"..HEAD --name-only 2>/dev/null
git diff "$MERGE_BASE"..HEAD --stat 2>/dev/null
git diff "$MERGE_BASE"..HEAD --shortstat 2>/dev/null
```

## Phase 4: Show Sample Diffs

```bash
git diff "$MERGE_BASE"..HEAD --no-color 2>/dev/null | head -100
```

## Output Format

```
[One-line summary in imperative mood]

Key changes:
- [Change 1]
- [Change 2]
- [Change 3]

Files: X changed (Y new, Z modified, W deleted) | +N/-M lines
Areas: [area1], [area2]
```

## Rules

- NO emojis
- NO Claude attribution or signatures
- Keep it professional and concise
- Total description should be 10-20 lines maximum

## Final Step

Copy to clipboard:
```bash
if command -v pbcopy &> /dev/null; then
  echo "[DESCRIPTION]" | pbcopy
  echo "Copied to clipboard!"
fi
```
