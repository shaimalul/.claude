---
name: pr-description
description: Generate a concise PR description from local git changes
allowed-tools: Bash, Read, Grep, Glob
disable-model-invocation: true
---

# PR Description Generator

Generate a short and concise description for a pull request based on local git changes and commits in the current branch.

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
  echo "Please switch to a feature branch to generate an PR description."
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

## Phase 4: Show Diffs (Source Code First)

Prioritize source code, then config, then non-boilerplate docs. Boilerplate markdown (READMEs, CLAUDE.md, CHANGELOG, LICENSE) is excluded as noise — but intentional prose under `skills/`, `agents/`, `rules/`, ADRs, etc. is kept since for docs-heavy repos that *is* the change.

```bash
SOURCE_GLOBS=( '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.go' '*.java' '*.rb' )
CONFIG_GLOBS=( '*.json' '*.yaml' '*.yml' '*.toml' '*.env*' 'Dockerfile*' )
DOCS_GLOBS=( '*.md' ':!README.md' ':!**/README.md' ':!CLAUDE.md' ':!**/CLAUDE.md' ':!CHANGELOG.md' ':!**/CHANGELOG.md' ':!LICENSE*' ':!**/LICENSE*' )

print_section() {
  local label="$1" max_lines="$2"
  shift 2
  local diff
  diff=$(git diff "$MERGE_BASE"..HEAD --no-color -- "$@" 2>/dev/null)
  [ -z "$diff" ] && return
  local total
  total=$(echo "$diff" | wc -l | tr -d ' ')
  echo ""
  echo "=== $label ==="
  echo "$diff" | head -"$max_lines"
  if [ "$total" -gt "$max_lines" ]; then
    echo "... [truncated, $((total - max_lines)) more lines]"
  fi
}

print_section "SOURCE CODE CHANGES" 400 "${SOURCE_GLOBS[@]}"
print_section "CONFIG / INFRA CHANGES" 80 "${CONFIG_GLOBS[@]}"
print_section "DOCS / MARKDOWN CHANGES" 200 "${DOCS_GLOBS[@]}"

# Coverage check: warn when files exist that none of the filters showed.
TOTAL_FILES=$(git diff "$MERGE_BASE"..HEAD --name-only 2>/dev/null | sort -u)
SHOWN_FILES=$(git diff "$MERGE_BASE"..HEAD --name-only -- \
  "${SOURCE_GLOBS[@]}" "${CONFIG_GLOBS[@]}" "${DOCS_GLOBS[@]}" 2>/dev/null | sort -u)
UNSHOWN_FILES=$(comm -23 <(echo "$TOTAL_FILES") <(echo "$SHOWN_FILES"))

if [ -n "$UNSHOWN_FILES" ]; then
  if [ -z "$SHOWN_FILES" ]; then
    echo ""
    echo "=== FALLBACK: FULL DIFF (no source/config/docs matches) ==="
    FULL_DIFF=$(git diff "$MERGE_BASE"..HEAD --no-color 2>/dev/null)
    FULL_TOTAL=$(echo "$FULL_DIFF" | wc -l | tr -d ' ')
    echo "$FULL_DIFF" | head -300
    if [ "$FULL_TOTAL" -gt 300 ]; then
      echo "... [truncated, $((FULL_TOTAL - 300)) more lines]"
    fi
  else
    echo ""
    echo "=== UNSHOWN FILES (changed but excluded by filters) ==="
    echo "$UNSHOWN_FILES"
  fi
fi
```

## Analysis Instructions

Based on the git data above, generate a concise PR description following these rules:

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
- UI components: tsx, jsx, components/, screens/, hooks/
- Backend/services: services/, controllers/, repositories/, api/
- Tests: spec, test files, __tests__/
- Styles: css, scss, less, module.scss
- Configuration: json, yaml, config files, tsconfig, webpack
- Documentation: md files, README
- Infrastructure: Dockerfile, terraform, CI configs
- Database: migrations, schemas, ORM files

### Bug Fix Details (if applicable)

When the change is a bug fix, include a structured breakdown. Reviewers lose far more time guessing at root cause than reading a well-structured one:

- Issue: the observable symptom (what broke, which flow failed, what users hit)
- Root Cause: the actual defect — not a restatement of the symptom
- Fix: what this PR changes, and why that resolves the root cause
- Regression: how recurrence is prevented (new spec coverage, invariant enforcement)

Omit when the change is a refactor, new feature, or chore.

### Evidence

Show that the change works, as a before/after pair of the smallest observable proof: a failing then passing test run, command output, or a screenshot the author already has. Never invent output; if no evidence was captured, omit the block and say what the reviewer should run.

### Merge Danger

Two calls every reviewer wants before reading the diff:

- Door: ONE-WAY (hard to reverse: data migrations, deleted data, published APIs, external side effects) or TWO-WAY (a revert fully undoes it)
- Blast radius: one word for what breaks if it is wrong (e.g. none, tests, module, service, users, data), plus one line on the ramification when it is not `none`

### Pre-empting Reviewer False Positives

Reviewers scan a diff in minutes without the author's context. Intentional choices that *look* wrong will get flagged — costing a review round-trip for every one. Pre-empting them in the description is a durable win: low author cost, high reviewer-friction reduction.

When to add a "Notes for reviewers" block:

- A construct looks like dead code but isn't (or a removed construct looks load-bearing but wasn't)
- A field's semantics *could* have changed but explicitly didn't (response shape, ordering, counts, nullability)
- A function is called with a "larger" argument than strictly needed, by design
- A deletion looks risky but is safe because of a different code path
- A test that looks timing-dependent isn't — or vice versa
- An earlier iteration had a construct that was flagged in review and removed; surface this so reviewers don't re-raise it from the current diff alone
- The change relies on a codebase invariant not visible in the diff

Heuristic: if the author had to work through it while writing the code, a reviewer will have to work through it too. Spend one sentence per item now instead of a review round-trip per item later.

Format each note as a bullet with a bolded claim + one-line justification. Keep the block tight — 3-6 bullets. Do NOT pre-empt real concerns; this is only for choices that look wrong but are intentionally correct. Reviewers should still raise actual issues.

Illustrative shape (generic — substitute real claims from the diff):

```markdown
### Notes for reviewers (pre-empting false positives)

- **[Intentional choice that looks wrong]** — [one-line justification tying it back to a caller, invariant, or prior review round].
- **[Semantic that appears to have changed but didn't]** — [how that's verified: existing test, unchanged contract, etc.].
- **[Deletion or removal that looks risky]** — [why it's safe: alternate code path, no consumers, etc.].
```

## Output Format

Generate the description in this format. Include only the blocks that apply to the change:

```
[One-line summary in imperative mood]

Key changes:
- [Change 1]
- [Change 2]
- [Change 3]
...

Bug fix details (include only when the change is a fix):
- Issue: [observable symptom]
- Root Cause: [actual defect]
- Fix: [what this PR changes and why it resolves the root cause]
- Regression: [how recurrence is prevented]

Evidence (include only when evidence was captured):
- Before: [failing test run, output, or screenshot]
- After: [passing test run, output, or screenshot]

Merge danger:
- Door: [one-way | two-way]
- Blast radius: [one word] - [ramification, omitted when none]

Notes for reviewers (include only when the diff contains intentional choices that look wrong):
- **[claim]** — [one-line justification]
- **[claim]** — [one-line justification]

Files: X changed (Y new, Z modified, W deleted) | +N/-M lines
Areas: [area1], [area2], ...
```

## Rules

- NO emojis
- NO Claude attribution or signatures
- NO "Co-Authored-By" lines
- Keep it professional and concise
- Omit any block that doesn't apply; do NOT leave empty headers
- Total length scales with the change — small refactors stay 10-15 lines, bug fixes with reviewer notes may run 25-40 lines

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
