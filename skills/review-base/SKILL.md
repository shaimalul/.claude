---
name: review-base
description: Shared code review framework with finding prefixes, agent routing, severity tiers, and learning feedback loop. Use when performing code reviews, routing review findings to specialist agents, or formatting review comments.
user-invocable: false
---

# Code Review Framework

Shared patterns for the `/review` command (local branch and GitHub PR modes).

## Two Pillars: SSOT and Tests

Every code review MUST prioritize these two principles above all others:

### SSOT (Single Source of Truth)

SSOT violations are ALWAYS `[Blocker]` - not suggestions, not nice-to-haves.

- Every constant, type, enum, and piece of logic has ONE authoritative location
- Check: Can you change this in one place and have it propagate everywhere?
- If no: it is a BLOCKER

Examples to flag:
- Same enum/constant defined in multiple files
- Same validation logic copy-pasted across services
- Same type definition in frontend AND backend (instead of shared)
- Same business rule implemented in two places
- Same error messages hardcoded in multiple locations

### Test Coverage

Untested behavioral changes are ALWAYS `[Blocker]`.

- Every behavioral change needs a test that would fail without it
- Check: If someone reverts this change, will a test fail?
- If no: it is a BLOCKER

These are the foundation of maintainable code. Other issues (patterns, style, architecture) matter only after these are satisfied.

## Extending This Base

Every review skill inherits from this file. A consumer skill MUST NOT restate anything defined here - it declares only what it overrides.

Inherited by default (never copy into a consumer):

| What | Section here |
| --------------------------------- | -------------------------------- |
| Finding prefixes and severity | Finding Prefixes, Severity Tiers |
| Comment style and tone | Comment Style Guidelines |
| Which agent reviews which file | Agent Routing Table |
| What each agent looks for | Review Focus Areas by Agent |
| Mode detection, fetching, posting | Shared Machinery |
| Pinning the fixed point | Fixed Point |
| The two review axes | Two Axes: Standards and Spec |
| Fowler smell baseline | Smell Baseline |
| Existing-discussion handling | Existing Discussion Awareness |
| Learning feedback loop | Learning Feedback Loop |

A consumer skill contains only:

1. Its frontmatter
2. An `Extends: review-base` declaration
3. An Overrides section listing every deviation - and nothing that merely agrees with the base
4. Its own report template, if the output shape genuinely differs

If a consumer needs to change a rule for everyone, change it here, not in the consumer.

### Prefix Modes

Consumers set `PREFIX_MODE` to control how findings are labelled:

| Mode | Behaviour | Used by |
| ------------ | -------------------------------------------------- | -------- |
| `prefixed` | Findings carry `[Blocker]`, `[Nice to have]`, etc. | review |
| `unprefixed` | Findings are bare sentences, no bracket tags | consumers that post outside a PR |

The machinery below honours `PREFIX_MODE`. In `unprefixed` mode the `prefix` field is omitted from findings and nothing is prepended when posting.

## Two Axes: Standards and Spec

Every review runs along two independent axes:

- STANDARDS: does the code follow this repo's documented standards, plus the smell baseline below?
- SPEC: does the code faithfully implement the originating issue, PRD, or phase document?

A change can pass one and fail the other:

- Follows every standard but implements the wrong thing: Standards pass, Spec fail
- Does exactly what the issue asked but breaks the project's conventions: Spec pass, Standards fail

Report the axes SEPARATELY and never merge or re-rank findings across them. One axis masking the other is exactly what the separation exists to prevent. The summary names the worst issue WITHIN each axis; it never picks a single winner across both.

If no spec can be found, the Spec axis is skipped and the report says so explicitly.

## Fixed Point

Every review is a diff between `HEAD` and a fixed point. Resolve it BEFORE spawning any agent, so a bad ref fails here instead of inside seven parallel sub-agents.

```bash
# 1. The fixed point: whatever the user supplied, or the merge-base with the base branch
FIXED_POINT="${1:-$(git merge-base HEAD origin/${BASE_BRANCH:-main})}"

# 2. It must resolve
git rev-parse --verify "$FIXED_POINT" >/dev/null 2>&1 || {
  echo "Fixed point does not resolve: $FIXED_POINT"; exit 1; }

# 3. Three-dot, so the comparison is against the merge-base
git diff "$FIXED_POINT"...HEAD --stat
git log "$FIXED_POINT"..HEAD --oneline

# 4. An empty diff is a hard stop, not an empty review
[ -z "$(git diff "$FIXED_POINT"...HEAD --name-only)" ] && {
  echo "No changes between $FIXED_POINT and HEAD"; exit 1; }
```

Use three-dot (`...`) everywhere. Two-dot compares against the tip of the fixed point, which reports changes that came from the base branch as if the author made them.

## Finding Prefixes

Use these standardized prefixes for all review findings:

| Prefix | Meaning | Action Required |
|--------|---------|-----------------|
| `[Blocker]` | PR will not be approved without fixing - breaks coding principals | MUST fix before merge |
| `[Nice to have]` | Not a blocker but better if changed | SHOULD fix |
| `[Suggestion]` | Opinionated preference (e.g., types vs enums) | Consider fixing |
| `[Need to check]` | Something looks weird, worth investigating | Verify/explain |
| `[Question]` | Needs clarification or explanation | Respond |

## Comment Style Guidelines

- Keep it short: max 2 sentences for simple findings, or one intro sentence + bullet list for multiple related points on the same file
- Sound natural and human, not robotic
- Jump straight to the concern - NO context about what changed ("Behavioral change:", "The old code...", "This code...")
- Skip the emojis
- DO NOT repeat what the code is doing - just give the feedback
- DO NOT post positive/complimentary comments - only actionable feedback
- DO NOT add AI attribution or signatures
- Code examples ONLY for complex fixes where words alone are unclear
- NO multi-section format (no "Why:", "Suggestion:" subsections)
- NO lint-style comments (file length, function length, naming, import style, formatting)
- Prefer inline over general - if a comment references a specific file, it MUST be inline on that file, never general. General is ONLY for observations that can't be pinned to any single file.

**Good:** `[Nice to have] Consider moving ServiceModule enum to a shared types file, those enums used across multiple domains.`
**Good:** `[Blocker] If getAgentChatConfig throws here, it crashes the entire Promise.all. Wrap in try/catch or fetch only after confirming it's needed.`
**Good:** `[Question] Is losing the original error type intentional here? Consider attaching the original as cause.`

**Bad (verbose intro):** `[Need to check] Behavioral change: the old agent flow returned operational fields (model, maxTurns, etc.) from {...baseConfig, ...agentConfig}. The new code always takes these from baseConfig only. If agents can override these fields, this is a silent regression.`
**Bad (multi-section):** Separate "Why:", "Suggestion:", code block subsections
**Bad (lint-style):** `[Suggestion] This file exceeds 150 lines, consider splitting.`
**Bad (unnecessary code):** Full code solution for simple suggestions (renaming, moving files)

## Agent Routing Table

Route files to specialist agents based on file patterns:

| Category | File Patterns | Agents to Spawn |
|----------|---------------|-----------------|
| **Frontend** | `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.module.scss` | frontend-agent, ux-agent |
| **Backend** | `*.ts` in `controllers/`, `services/`, `repositories/`, `middleware/` | backend-agent |
| **DevOps** | `*.tf`, `*.yaml`, `*.yml`, `Dockerfile*`, `docker-compose*` | devops-agent |
| **AI/ML** | Files with `openai`, `llm`, `prompt`, `embedding`, `ai` in path | ai-agent |
| **All Changes** | All files (always run) | security-agent, architect-agent, bug-finder-agent |

### Agent Skills

Each agent automatically loads the skills declared in its own `skills:` frontmatter. That frontmatter is the SINGLE SOURCE OF TRUTH. Do not list them here, in the README, or in `consult` - three copies drift, and a drifted list is exactly the SSOT violation this base calls a `[Blocker]`.

To see what an agent loads:

```bash
grep -Hn '^skills:' agents/*.md
```

## Smell Baseline

On top of whatever the repo documents, the STANDARDS axis always carries this baseline: a fixed set of Fowler code smells (Refactoring, ch. 3) that applies even when a repo documents nothing.

Two rules bind it:

- THE REPO OVERRIDES. A documented repo standard always wins. Where `CLAUDE.md`, `rules/`, or a repo standards doc endorses something the baseline would flag, suppress the smell
- ALWAYS A JUDGEMENT CALL. Every smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Map them to `[Nice to have]` or `[Suggestion]`, NEVER `[Blocker]`. Skip anything tooling already enforces

Each smell reads as what it is, then how to fix. Match it against the diff.

| Smell | What it is | Fix |
|-------|-----------|-----|
| Mysterious Name | A function, variable, or type whose name does not reveal what it does or holds | Rename it. If no honest name comes, the design is murky |
| Duplicated Code | The same logic shape appears in more than one hunk or file in the change | Extract the shared shape, call it from both |
| Feature Envy | A method that reaches into another object's data more than its own | Move the method onto the data it envies |
| Data Clumps | The same few fields or params keep travelling together, a type wanting to be born | Bundle them into one type, pass that |
| Primitive Obsession | A primitive or string standing in for a domain concept that deserves its own type | Give the concept its own small type |
| Repeated Switches | The same switch or if-cascade on the same type recurs across the change | Replace with polymorphism, or one map both sites share |
| Shotgun Surgery | One logical change forces scattered edits across many files in the diff | Gather what changes together into one module |
| Divergent Change | One file or module is edited for several unrelated reasons | Split so each module changes for one reason |
| Speculative Generality | Abstraction, parameters, or hooks added for needs the spec does not have | Remove it. Inline back until a real need shows |
| Message Chains | Long `a.b().c().d()` navigation the caller should not depend on | Hide the walk behind one method on the first object |
| Middle Man | A class or function that mostly just delegates onward | Cut it, call the real target directly |
| Refused Bequest | A subclass or implementer that ignores or overrides most of what it inherits | Drop the inheritance, use composition |

Sub-agents have no other access to this table. Any consumer that spawns them MUST paste it into each Standards-axis prompt in full.

## Severity Tiers

Aggregate findings into these priority levels:

1. **Critical/Blocker** - Security vulnerabilities, data exposure (MUST fix - blocks merge)
2. **High** - Architecture violations, major bugs (SHOULD fix before merge)
3. **Medium** - Code quality issues, patterns (recommended to fix)
4. **Low** - Style, minor improvements (nice to have)
5. **Improvement Opportunities** - Non-blocking suggestions (cleanup, simplification)

## Report Template

`review` reproduces this skeleton in full (Files Reviewed, Agents Used, Summary shape) since its
report is a literal output artifact rather than an instruction, and swaps the severity tiers
below for its own prefix-grouped sections. Update both when the shape changes.

```markdown
## Code Review Report

### Branch/PR Info
- **Branch/PR**: [name/url]
- **Base**: [main/master]
- **Files changed**: X

### Files Reviewed
| Category | Count | Files |
|----------|-------|-------|
| Frontend | X | file1.tsx, file2.tsx |
| Backend | X | service.ts |
| DevOps | X | Dockerfile |

### Agents Used
- security-agent
- architect-agent
- [list only agents that were spawned]

### Summary
- Critical issues: X
- High priority: X
- Medium priority: X
- Low priority: X

### Critical Issues (BLOCKING)
| File | Line | Issue | Agent | Fix |
|------|------|-------|-------|-----|
| ... | ... | ... | security-agent | ... |

### High Priority Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | ... |

### Medium Priority Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | ... |

### Low Priority Issues
[List if any]

### Improvement Opportunities (Non-Blocking)
Suggestions for cleaner code, reduced duplication, and better approaches:

| File | Current State | Suggestion | Impact |
|------|---------------|------------|--------|
| service.ts:45-60 | Duplicate validation logic | Extract to `validators/shared.ts` | -30 lines |
| utils.ts:12 | Legacy alias `oldFunctionName` | Remove (no usages found) | Cleanup |

### Key Recommendations
1. [Most important action item]
2. [Second priority]
3. [Third priority]
```

## CLAUDE.md Compliance Checks (Review-Worthy Only)

Only flag items that require human judgment. Lint-detectable items are enforced by linters, not code review.

### Architecture (flag these)
- Single Source of Truth violations (duplicate constants, types, or logic across files)
- Three-layer architecture compliance (UI -> Logic -> Data)
- Never skip layers
- Proper separation of concerns

### Logic & Safety (flag these)
- No type casting with `as` (use type guards)
- No `any` or `unknown` without type guards
- No empty catch blocks (always log errors)
- No backward compatibility wrappers in new code

### NOT for review (enforced by linters)
- File/function/class length limits
- Named exports vs default exports
- Barrel file usage
- Import ordering
- Formatting and naming conventions

### NOT for review (requires online verification first)
- External service/package assertions: NEVER flag model names, API versions, SDK features, library names, package versions, or third-party identifiers as invalid without first verifying via WebSearch. Training data may be outdated.

## Review Focus Areas by Agent

### security-agent Focus
- OWASP Top 10 vulnerabilities
- Credential/secret exposure
- Input validation gaps
- SQL injection / XSS risks
- Authentication/authorization issues
- Insecure dependencies

### architect-agent Focus

PRIMARY (always `[Blocker]`):
- SSOT violations: same constant, type, enum, or logic in multiple places
- Missing tests for behavioral changes

SECONDARY:
- Three-layer architecture violations
- Shallow modules: a large interface hiding little implementation (see `codebase-design`)
- Tests written past the interface rather than at a seam
- Code duplication (repeated logic > 3 lines)
- Backward compatibility hacks
- Dead code (unreachable code, commented-out blocks)
- Over-engineering (unnecessary abstractions, premature optimization)
- Behavioral regressions (changed semantics, lost functionality)

NOTE: Do NOT flag lint-style items (file length, function length, export default, barrel files)

### bug-finder-agent Focus
- Logic errors and off-by-one mistakes
- Null and undefined dereference risks
- Unhandled edge cases and error paths
- Race conditions and async ordering
- Silent behavioral regressions

### frontend-agent Focus
- React patterns (hooks, state management)
- React anti-patterns (prop explosion, setState as props)
- TypeScript best practices (no type casting)
- Performance (unnecessary useMemo/useCallback)
- Testing considerations

### backend-agent Focus
- Three-layer architecture compliance
- API design patterns (RESTful conventions)
- Error handling (use http-status-codes, not raw numbers)
- Database query optimization (N+1 problems)
- Validation (Zod/class-validator patterns)

### ux-agent Focus
- WCAG 2.1 AA compliance
- Semantic HTML usage
- ARIA patterns
- Keyboard navigation
- Focus management
- Loading states and error handling UX

## Learning Feedback Loop

After generating findings, execute this loop for patterns with `[Blocker]`, `[Nice to have]`, or `[Suggestion]` prefixes.

### Step 1: Determine Category

| Keywords in Finding | Category |
|---------------------|----------|
| `any`, `casting`, `type`, `TypeScript` | `typescript-types` |
| `useEffect`, `useState`, `hook`, `React`, `component` | `react-component` |
| `controller`, `service`, `repository`, `layer` | `js-backend-patterns` |
| `injection`, `XSS`, `secret`, `auth`, `security` | `security-patterns` |
| Other patterns | `general` |

### Step 2: Check for Duplicates

Search CLAUDE.md for similar rules. Skip if already covered.

### Step 3: Invoke improve-claude

```
skill: improve-claude
args: [category]: [concise rule description] --save-skill
```

### Step 4: Report Results

```markdown
## Learning Feedback Loop

**Patterns Found:** [count]
**Rules Applied:** [list of rules added via improve-claude]
**Skills Saved:** [list of skills saved to ~/.claude/skills/learned/]
```

If no patterns were learned, report: "No learnable patterns identified in this review (no Blocker, Nice-to-have, or Suggestion findings)."

## JSON Findings Format (for GitHub mode)

When posting findings to GitHub, use one of these JSON structures:

**Inline finding** (on a specific changed line):
```json
{
  "type": "inline",
  "prefix": "[Suggestion]",
  "file_path": "src/foo.ts",
  "code_pattern": "exact code snippet 5-50 chars from a + line",
  "comment": "Your feedback here."
}
```

**General finding** (file-level, cross-cutting, or issue in unchanged code):
```json
{
  "type": "general",
  "prefix": "[Blocker]",
  "file_path": "src/foo.ts",
  "comment": "Your feedback here."
}
```

**type rules:**
- `"inline"`: Comment on a specific added/modified line. Requires `code_pattern` from a `+` line in the diff.
- `"general"`: File-level concern, cross-cutting pattern, or architectural observation about existing code. Does NOT require `code_pattern`.

**code_pattern rules (inline only):**
- Copy the EXACT code snippet from a `+` (added/modified) line in the diff (5-50 chars)
- CRITICAL: ONLY copy code from + lines (added/modified). NEVER from context/unchanged lines
- Use a unique snippet that appears only once in the file
- If code appears multiple times, include more context to make it unique
- Line numbers will be calculated automatically from code_pattern

**Architectural concerns about existing/unchanged code:**
- For observations about existing code patterns, create ONE "general" type finding
- Summarize all architectural observations in a single general comment
- Do NOT create separate inline findings for unchanged code
- Example: "Several services duplicate validation logic (UserService, OrderService). Consider extracting to shared validators/"

**Cross-cutting rules:**
- If the same issue appears in multiple files, produce ONE general finding listing all file paths in the comment
- Do NOT produce separate findings for each occurrence of the same pattern

## Existing Discussion Awareness (GitHub PR Mode)

When reviewing a remote GitHub PR, the review process MUST consider all existing discussions and comments on the PR to avoid redundancy.

### How It Works

1. **Fetch Phase**: All existing PR discussions are fetched via GitHub API (`/discussions` endpoint) and saved to `existing_discussions_summary.txt` and `existing_comments_index.json`
2. **Agent Context**: Each review agent receives the existing discussions summary and is instructed to skip topics already covered
3. **Deduplication**: After agents produce findings, a deduplication step filters out findings that overlap with existing comments (same file + 30%+ word overlap, or 50%+ keyword overlap across files)

### Rules for Agents

- DO NOT comment on topics already addressed by existing discussions (from bots, other reviewers, or the PR author)
- If an existing comment already raises the same concern, SKIP the finding entirely
- If your finding adds genuinely NEW insight beyond what's already discussed, include it
- Both open and resolved discussions count - resolved discussions mean the issue was already handled
- Bot comments (CI bots, linters, coverage bots) are real feedback - do not duplicate their findings

## Shared Machinery

Canonical implementation of mode detection, change fetching, and GitHub posting. This is the ONLY copy - review skills reference these steps by name instead of inlining them.

### Step A: Mode Detection

```bash
ARGS="$ARGUMENTS"
FIRST_ARG=$(echo "$ARGS" | awk '{print $1}')

if echo "$FIRST_ARG" | grep -qE '^https://github\.com/[^/]+/[^/]+/pull/[0-9]+'; then
  MODE="github"
  PR_URL="$FIRST_ARG"
  CONTEXT=$(echo "$ARGS" | awk '{$1=""; print $0}' | sed 's/^[[:space:]]*//')
  echo "Mode: GitHub PR Review"
  echo "PR URL: $PR_URL"
else
  MODE="local"
  PR_URL=""
  CONTEXT="$ARGS"
  echo "Mode: Local Branch Review"
fi

if [ -n "$CONTEXT" ]; then
  echo "Review Context: $CONTEXT"
fi
```

### Step B: Get Changes

#### IF MODE=local

Get the list of changed files in the current branch compared to the base branch:

```bash
git fetch origin

BASE_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5 2>/dev/null || echo "main")

CURRENT_BRANCH=$(git branch --show-current)
echo "Branch: $CURRENT_BRANCH"
echo "Base: $BASE_BRANCH"

# Get list of changed files
CHANGED_FILES_LIST=$(git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD --name-only)
echo ""
echo "=== Changed Files ==="
echo "$CHANGED_FILES_LIST"

# Get the actual diff content
DIFF_CONTENT=$(git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD)

# Get diff stat summary
git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD --stat

# Create assets directory for report
ASSETS_DIR="$HOME/.claude/review-assets/branch_${CURRENT_BRANCH//\//_}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ASSETS_DIR"
echo "Assets dir: $ASSETS_DIR"
```

#### IF MODE=github

Fetch PR data from GitHub API:

```bash
# Parse PR URL: https://github.com/<owner>/<repo>/pull/<number>
PR_URL="$FIRST_ARG"

REPO=$(echo "$PR_URL" | sed -n 's|https://github\.com/\([^/]*/[^/]*\)/pull/.*|\1|p')
PR_NUMBER=$(echo "$PR_URL" | sed -n 's|.*/pull/\([0-9]*\).*|\1|p')

if [ -z "$REPO" ] || [ -z "$PR_NUMBER" ]; then
  echo "Error: Invalid GitHub PR URL format"
  echo "Expected: https://github.com/<owner>/<repo>/pull/<number>"
  exit 1
fi

echo "Repo: $REPO"
echo "PR: #$PR_NUMBER"

# Verify gh is installed and authenticated. gh reads GH_TOKEN from the
# environment or falls back to its own stored credentials.
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found. Install from https://cli.github.com"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated."
  echo "Run: gh auth login    (or export GH_TOKEN with repo scope)"
  exit 1
fi

# Fetch PR metadata
PR_JSON="/tmp/gh_pr_${PR_NUMBER}.json"
if ! gh pr view "$PR_NUMBER" --repo "$REPO" \
  --json title,body,state,author,headRefName,baseRefName,headRefOid,baseRefOid,files \
  > "$PR_JSON"; then
  echo "Error: Failed to fetch PR data. Check the URL and your token permissions."
  exit 1
fi

TITLE=$(jq -r '.title' "$PR_JSON")
DESCRIPTION=$(jq -r '.body // ""' "$PR_JSON")
STATE=$(jq -r '.state' "$PR_JSON")
AUTHOR=$(jq -r '.author.login' "$PR_JSON")
SOURCE_BRANCH=$(jq -r '.headRefName' "$PR_JSON")
TARGET_BRANCH=$(jq -r '.baseRefName' "$PR_JSON")
HEAD_SHA=$(jq -r '.headRefOid' "$PR_JSON")
BASE_SHA=$(jq -r '.baseRefOid' "$PR_JSON")

echo ""
echo "=== Pull Request Summary ==="
echo "Title: $TITLE"
echo "Author: $AUTHOR"
echo "State: $STATE"
echo "Source: $SOURCE_BRANCH -> Target: $TARGET_BRANCH"

# Create assets directory
ASSETS_DIR="$HOME/.claude/review-assets/pr_${PR_NUMBER}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ASSETS_DIR/diffs" "$ASSETS_DIR/files"
DIFFS_DIR="$ASSETS_DIR/diffs"
FILES_DIR="$ASSETS_DIR/files"

# Split the unified PR diff into one file per changed path
gh pr diff "$PR_NUMBER" --repo "$REPO" > "$ASSETS_DIR/pr.diff"

python3 << 'SPLIT_DIFF_EOF'
import os, re

assets_dir = os.environ['ASSETS_DIR']
diffs_dir = os.path.join(assets_dir, 'diffs')

with open(os.path.join(assets_dir, 'pr.diff')) as f:
    content = f.read()

current_path, buf = None, []

def flush():
    if current_path and buf:
        safe = current_path.replace('/', '_')
        with open(os.path.join(diffs_dir, safe + '.diff'), 'w') as out:
            out.write('\n'.join(buf))

for line in content.split('\n'):
    m = re.match(r'^diff --git a/(.+?) b/(.+)$', line)
    if m:
        flush()
        current_path, buf = m.group(2), []
        continue
    if current_path is not None:
        buf.append(line)
flush()
SPLIT_DIFF_EOF

# Fetch full file content at the PR head for non-deleted files
jq -r '.files[] | select(.path != null) | .path' "$PR_JSON" | while read -r filepath; do
  safe_filename=$(echo "$filepath" | tr '/' '_')
  gh api "repos/$REPO/contents/$filepath?ref=$HEAD_SHA" \
    --header "Accept: application/vnd.github.raw" \
    > "$FILES_DIR/${safe_filename}.content" 2>/dev/null || true
done

# Save PR data and paths for later phases
cp "$PR_JSON" "$ASSETS_DIR/pr_data.json"

DESCRIPTION_FILE="$ASSETS_DIR/pr_description.txt"
printf '%s\n' "$DESCRIPTION" > "$DESCRIPTION_FILE"

PATHS_FILE="/tmp/gh_review_paths_${PR_NUMBER}.txt"
echo "ASSETS_DIR=$ASSETS_DIR" > "$PATHS_FILE"
echo "DIFFS_DIR=$DIFFS_DIR" >> "$PATHS_FILE"
echo "FILES_DIR=$FILES_DIR" >> "$PATHS_FILE"
echo "REPO=$REPO" >> "$PATHS_FILE"
echo "PR_NUMBER=$PR_NUMBER" >> "$PATHS_FILE"
echo "PR_URL=$PR_URL" >> "$PATHS_FILE"
echo "BASE_SHA=$BASE_SHA" >> "$PATHS_FILE"
echo "HEAD_SHA=$HEAD_SHA" >> "$PATHS_FILE"
echo "DESCRIPTION_FILE=$DESCRIPTION_FILE" >> "$PATHS_FILE"

FINDINGS_FILE="$ASSETS_DIR/findings.json"
echo "[]" > "$FINDINGS_FILE"
echo "FINDINGS_FILE=$FINDINGS_FILE" >> "$PATHS_FILE"

# Get changed files list for categorization
CHANGED_FILES_LIST=$(jq -r '.files[].path' "$PR_JSON")

rm -f "$PR_JSON"

# Fetch existing PR review threads and issue comments (bots, reviewers, author)
echo ""
echo "=== Fetching Existing PR Discussions ==="
DISCUSSIONS_FILE="$ASSETS_DIR/existing_discussions.json"
gh api --paginate "repos/$REPO/pulls/$PR_NUMBER/comments" > "$ASSETS_DIR/review_comments.json"
gh api --paginate "repos/$REPO/issues/$PR_NUMBER/comments" > "$ASSETS_DIR/issue_comments.json"
jq -s 'add' "$ASSETS_DIR/review_comments.json" "$ASSETS_DIR/issue_comments.json" > "$DISCUSSIONS_FILE"

# Extract a summary of existing comments for agent context
python3 << 'DISCUSSIONS_EOF'
import json
import os

assets_dir = os.environ.get('ASSETS_DIR', '')
discussions_file = os.path.join(assets_dir, 'existing_discussions.json')
summary_file = os.path.join(assets_dir, 'existing_discussions_summary.txt')

try:
    with open(discussions_file, 'r') as f:
        discussions = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    discussions = []

# Review comments carry path/line; issue comments are PR-level only.
comments = []
for note in discussions:
    body = (note.get('body') or '').strip()
    if not body:
        continue
    comments.append({
        'author': note.get('user', {}).get('login', 'Unknown'),
        'body': body[:500],
        'file_path': note.get('path', '') or '',
        'line': note.get('line') or note.get('original_line') or '',
        # An outdated inline comment no longer applies to the current head.
        'resolved': note.get('position') is None and note.get('path') is not None,
    })

# Write human-readable summary for agent prompts
with open(summary_file, 'w') as f:
    if not comments:
        f.write("No existing discussions on this PR.\n")
    else:
        f.write(f"Existing PR discussions ({len(comments)} comments):\n\n")
        for c in comments:
            status = "[RESOLVED]" if c['resolved'] else "[OPEN]"
            location = f" ({c['file_path']}:{c['line']})" if c['file_path'] else ""
            f.write(f"{status} @{c['author']}{location}:\n{c['body']}\n\n")

# Also save as structured JSON for deduplication in Phase 5
dedup_file = os.path.join(assets_dir, 'existing_comments_index.json')
with open(dedup_file, 'w') as f:
    json.dump(comments, f, indent=2)

print(f"Found {len(comments)} existing comments ({sum(1 for c in comments if not c['resolved'])} open, {sum(1 for c in comments if c['resolved'])} resolved)")
DISCUSSIONS_EOF

echo "DISCUSSIONS_SUMMARY=$ASSETS_DIR/existing_discussions_summary.txt" >> "$PATHS_FILE"
echo "EXISTING_COMMENTS_INDEX=$ASSETS_DIR/existing_comments_index.json" >> "$PATHS_FILE"

echo ""
echo "Assets dir: $ASSETS_DIR"
```

### Step C: Resolve Lines, Deduplicate, Post Pending Review

Skip entirely if `MODE=local`.

In `unprefixed` mode, drop the `$prefix` variable from the inline comment body and from the general-notes `jq` expression below. Everything else is identical.

**Skip this phase entirely if MODE=local.**

```bash
# Source the paths file
source "/tmp/gh_review_paths_${PR_NUMBER}.txt"

# Calculate line numbers from code patterns using Python
python3 << 'PYTHON_EOF'
import json
import re
import os

assets_dir = os.environ.get('ASSETS_DIR', '')
diffs_dir = os.path.join(assets_dir, 'diffs')
findings_file = os.path.join(assets_dir, 'findings.json')

def find_line_in_diff(diff_content, pattern):
    """Find the new file line number for a code pattern in a diff.
    ONLY matches on + lines (added/modified). Never matches context lines.
    Uses exact match first, then falls back to fuzzy matching."""
    if not pattern or not pattern.strip():
        return None

    pattern_clean = pattern.strip()
    pattern_normalized = ' '.join(pattern_clean.split())

    def scan_diff(match_fn):
        current_new_line = 0
        for line in diff_content.split('\n'):
            if line.startswith('@@'):
                m = re.search(r'\+(\d+)', line)
                if m:
                    current_new_line = int(m.group(1))
                continue
            if line.startswith('-') and not line.startswith('---'):
                continue
            # Only match on + lines (changed lines), never on context lines
            if line.startswith('+') and not line.startswith('+++'):
                line_content = line[1:]
                if match_fn(line_content):
                    return current_new_line
            # Track line numbers for both + and context lines
            if line.startswith('+') or line.startswith(' ') or (not line.startswith('-') and not line.startswith('\\') and not line.startswith('@@')):
                current_new_line += 1
        return None

    # Pass 1: Exact match on + lines only
    result = scan_diff(lambda lc: pattern_clean in lc)
    if result is not None:
        return result

    # Pass 2: Whitespace-normalized match on + lines only
    result = scan_diff(lambda lc: pattern_normalized in ' '.join(lc.split()))
    if result is not None:
        return result

    # Pass 3: Stripped syntax match for longer patterns on + lines only
    if len(pattern_clean) >= 15:
        pattern_core = pattern_clean.strip('(){};,').strip()
        if pattern_core:
            result = scan_diff(lambda lc: pattern_core in lc)
            if result is not None:
                return result

    return None

def find_first_plus_line(diff_content):
    """Find the line number of the first + line in a diff.
    Used as fallback when a specific code_pattern can't be found."""
    current_new_line = 0
    for line in diff_content.split('\n'):
        if line.startswith('@@'):
            m = re.search(r'\+(\d+)', line)
            if m:
                current_new_line = int(m.group(1))
            continue
        if line.startswith('-') and not line.startswith('---'):
            continue
        if line.startswith('+') and not line.startswith('+++'):
            return current_new_line
        if line.startswith('+') or line.startswith(' ') or (not line.startswith('-') and not line.startswith('\\') and not line.startswith('@@')):
            current_new_line += 1
    return None

try:
    with open(findings_file, 'r') as f:
        findings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    findings = []

updated_findings = []
for finding in findings:
    file_path = finding.get('file_path', '')
    code_pattern = finding.get('code_pattern', '')

    if not file_path:
        updated_findings.append(finding)
        continue

    safe_filename = file_path.replace('/', '_') + '.diff'
    diff_file = os.path.join(diffs_dir, safe_filename)

    if not os.path.exists(diff_file):
        finding['line_number'] = None
        updated_findings.append(finding)
        continue

    with open(diff_file, 'r') as f:
        diff_content = f.read()

    line_number = find_line_in_diff(diff_content, code_pattern)
    if line_number is None and code_pattern:
        # Pattern not on a + line - fallback to first changed line in file
        fallback_line = find_first_plus_line(diff_content)
        if fallback_line is not None:
            finding['line_number'] = fallback_line
            finding['comment'] = f"> **Note**: _Not directly related to this line, but regarding this file:_\n\n{finding.get('comment', '')}"
            finding['code_pattern'] = ''
        else:
            finding['line_number'] = None
    else:
        finding['line_number'] = line_number
    updated_findings.append(finding)

with open(findings_file, 'w') as f:
    json.dump(updated_findings, f, indent=2)

print(f"Processed {len(updated_findings)} findings")
PYTHON_EOF

# Validate findings: ensure inline code_patterns are on + lines only, then deduplicate by line
python3 << 'VALIDATE_DEDUP_EOF'
import json
import os
import re
from collections import defaultdict

assets_dir = os.environ.get('ASSETS_DIR', '')
diffs_dir = os.path.join(assets_dir, 'diffs')
findings_file = os.path.join(assets_dir, 'findings.json')

try:
    with open(findings_file, 'r') as f:
        findings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    findings = []

original_count = len(findings)

def code_is_on_plus_line(diff_content, pattern):
    """Check if code pattern appears on a + line (added/modified), not context."""
    if not pattern or not pattern.strip():
        return False
    pattern_clean = pattern.strip()
    for line in diff_content.split('\n'):
        if line.startswith('+') and not line.startswith('+++'):
            if pattern_clean in line[1:]:
                return True
    return False

def find_first_plus_line(diff_content):
    """Find the line number of the first + line in a diff."""
    current_new_line = 0
    for line in diff_content.split('\n'):
        if line.startswith('@@'):
            m = re.search(r'\+(\d+)', line)
            if m:
                current_new_line = int(m.group(1))
            continue
        if line.startswith('-') and not line.startswith('---'):
            continue
        if line.startswith('+') and not line.startswith('+++'):
            return current_new_line
        if line.startswith('+') or line.startswith(' ') or (not line.startswith('-') and not line.startswith('\\') and not line.startswith('@@')):
            current_new_line += 1
    return None

def make_file_note_disclaimer(original_comment):
    """Wrap a comment with a disclaimer that it is not tied to a specific line."""
    return f"> **Note**: _Not directly related to this line, but regarding this file:_\n\n{original_comment}"

# Step 1: Validate inline findings - convert unchanged-code findings to general
converted_count = 0
for finding in findings:
    file_path = finding.get('file_path', '')
    code_pattern = finding.get('code_pattern', '')
    finding_type = finding.get('type', 'inline')

    if finding_type == 'general' or not code_pattern:
        continue

    if not file_path:
        continue

    safe_filename = file_path.replace('/', '_') + '.diff'
    diff_file = os.path.join(diffs_dir, safe_filename)

    if not os.path.exists(diff_file):
        continue

    with open(diff_file, 'r') as f:
        diff_content = f.read()

    if not code_is_on_plus_line(diff_content, code_pattern):
        # Pattern not on a changed line - try to pin to first changed line in file
        first_plus = find_first_plus_line(diff_content)
        if first_plus is not None:
            finding['line_number'] = first_plus
            finding['code_pattern'] = ''
            if not finding.get('comment', '').startswith('> **Note**'):
                finding['comment'] = make_file_note_disclaimer(finding.get('comment', ''))
        else:
            # File has no + lines (pure deletion) - fall back to general
            finding['type'] = 'general'
            finding['code_pattern'] = ''
            finding['line_number'] = None
        converted_count += 1

if converted_count > 0:
    print(f"Converted {converted_count} findings to general (code on unchanged lines)")

# Step 1b: Promote general findings to inline when they reference a file with changes
promoted_count = 0
for finding in findings:
    finding_type = finding.get('type', 'inline')
    file_path = finding.get('file_path', '')

    if finding_type != 'general' or not file_path:
        continue

    safe_filename = file_path.replace('/', '_') + '.diff'
    diff_file = os.path.join(diffs_dir, safe_filename)

    if not os.path.exists(diff_file):
        continue

    with open(diff_file, 'r') as f:
        diff_content = f.read()

    first_plus = find_first_plus_line(diff_content)
    if first_plus is None:
        continue  # Pure deletion - stays general

    finding['type'] = 'inline'
    finding['line_number'] = first_plus
    finding['code_pattern'] = ''
    finding['comment'] = make_file_note_disclaimer(finding.get('comment', ''))
    promoted_count += 1

if promoted_count > 0:
    print(f"Promoted {promoted_count} general findings to inline (file has changes in PR)")

# Step 2: Deduplicate by file_path + line_number (merge same-line findings)
grouped = defaultdict(list)
for finding in findings:
    file_path = finding.get('file_path', '')
    line_number = finding.get('line_number')

    if not line_number or line_number == 'null' or line_number is None:
        key = f"general:{id(finding)}"
    else:
        key = f"{file_path}:{line_number}"

    grouped[key].append(finding)

deduplicated = []
for key, group in grouped.items():
    if len(group) == 1:
        deduplicated.append(group[0])
    else:
        base = group[0].copy()
        unique_comments = []
        for f in group:
            c = f.get('comment', '')
            if c and c not in unique_comments:
                unique_comments.append(c)
        base['comment'] = '\n\n---\n\n'.join(unique_comments)
        deduplicated.append(base)

with open(findings_file, 'w') as f:
    json.dump(deduplicated, f, indent=2)

print(f"Deduplicated: {original_count} -> {len(deduplicated)} findings")
VALIDATE_DEDUP_EOF

# Deduplicate findings against existing PR discussions
python3 << 'EXISTING_DEDUP_EOF'
import json
import os
import re

assets_dir = os.environ.get('ASSETS_DIR', '')
findings_file = os.path.join(assets_dir, 'findings.json')
existing_index_file = os.path.join(assets_dir, 'existing_comments_index.json')

try:
    with open(findings_file, 'r') as f:
        findings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    findings = []

try:
    with open(existing_index_file, 'r') as f:
        existing_comments = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    existing_comments = []

if not existing_comments:
    print("No existing discussions to deduplicate against")
else:
    original_count = len(findings)

    def normalize(text):
        """Normalize text for fuzzy comparison."""
        return re.sub(r'\s+', ' ', text.lower().strip())

    def finding_overlaps_existing(finding, existing):
        """Check if a finding overlaps with an existing comment."""
        f_comment = normalize(finding.get('comment', ''))
        f_file = finding.get('file_path', '')

        for ec in existing:
            ec_body = normalize(ec.get('body', ''))
            ec_file = ec.get('file_path', '')

            # Same file + similar content (30%+ word overlap)
            if f_file and ec_file and f_file == ec_file:
                f_words = set(f_comment.split())
                ec_words = set(ec_body.split())
                if f_words and ec_words:
                    overlap = len(f_words & ec_words) / min(len(f_words), len(ec_words))
                    if overlap > 0.3:
                        return True

            # Check for keyword overlap even across files
            # Extract key technical terms (3+ char words)
            f_terms = {w for w in f_comment.split() if len(w) > 3}
            ec_terms = {w for w in ec_body.split() if len(w) > 3}
            if f_terms and ec_terms:
                overlap = len(f_terms & ec_terms) / min(len(f_terms), len(ec_terms))
                if overlap > 0.5:
                    return True

        return False

    filtered = []
    skipped = 0
    for finding in findings:
        if finding_overlaps_existing(finding, existing_comments):
            skipped += 1
        else:
            filtered.append(finding)

    with open(findings_file, 'w') as f:
        json.dump(filtered, f, indent=2)

    print(f"Existing discussion dedup: {original_count} -> {len(filtered)} findings ({skipped} skipped as already discussed)")
EXISTING_DEDUP_EOF

FINDINGS_COUNT=$(jq 'length' "$FINDINGS_FILE")

# GitHub has no per-comment draft API. Instead, build ONE pending review
# containing every inline comment plus a consolidated body, then create it
# without an `event` field so it lands as a pending (draft) review the user
# submits from the UI.
REVIEW_PAYLOAD="$ASSETS_DIR/review_payload.json"
FAILED_INLINES_FILE="/tmp/gh_review_failed_${PR_NUMBER}.txt"
> "$FAILED_INLINES_FILE"

if [ "$FINDINGS_COUNT" -gt 0 ]; then
  # Step 1: Build the inline comments array. Drop findings whose file has no
  # diff - GitHub rejects comments on lines outside the PR diff.
  INLINE_COMMENTS="[]"
  while read -r finding; do
    [ -z "$finding" ] && continue
    prefix=$(echo "$finding" | jq -r '.prefix // "[Suggestion]"')
    comment=$(echo "$finding" | jq -r '.comment // ""')
    file_path=$(echo "$finding" | jq -r '.file_path // ""')
    line_number=$(echo "$finding" | jq -r '.line_number // ""')

    safe_filename=$(echo "$file_path" | tr '/' '_')
    if [ ! -f "$DIFFS_DIR/${safe_filename}.diff" ]; then
      echo "- $prefix \`$file_path\`: $comment" >> "$FAILED_INLINES_FILE"
      echo "  Skipped (not in diff): $prefix ($file_path)"
      continue
    fi

    INLINE_COMMENTS=$(echo "$INLINE_COMMENTS" | jq \
      --arg path "$file_path" \
      --argjson line "$line_number" \
      --arg body "$prefix $comment" \
      '. + [{path: $path, line: $line, side: "RIGHT", body: $body}]')
    echo "  Queued inline: $prefix ($file_path:$line_number)"
  done < <(jq -c '.[] | select(.line_number != null and .line_number != "null" and (.line_number | tostring) != "")' "$FINDINGS_FILE")

  # Step 2: Collect general findings + any dropped inlines into the review body
  GENERAL_NOTES=$(jq -r '[.[] | select(.line_number == null or .line_number == "null" or (.line_number | tostring) == "") | "- \(.prefix // "[Suggestion]") \(.comment // "")"] | join("\n")' "$FINDINGS_FILE")

  FAILED_NOTES=""
  if [ -s "$FAILED_INLINES_FILE" ]; then
    FAILED_NOTES=$(cat "$FAILED_INLINES_FILE")
  fi

  ALL_GENERAL=""
  if [ -n "$GENERAL_NOTES" ] && [ -n "$FAILED_NOTES" ]; then
    ALL_GENERAL="$GENERAL_NOTES
$FAILED_NOTES"
  elif [ -n "$GENERAL_NOTES" ]; then
    ALL_GENERAL="$GENERAL_NOTES"
  elif [ -n "$FAILED_NOTES" ]; then
    ALL_GENERAL="$FAILED_NOTES"
  fi

  REVIEW_BODY=""
  if [ -n "$ALL_GENERAL" ]; then
    TOTAL_POINTS=$(echo "$ALL_GENERAL" | grep -c "^- " || true)
    if [ "$TOTAL_POINTS" -eq 1 ]; then
      SINGLE_LINE=$(echo "$ALL_GENERAL" | head -1 | sed 's/^- //')
      REVIEW_BODY="Thanks, one comment:

$SINGLE_LINE"
    else
      REVIEW_BODY="Thanks, a few comments:

$ALL_GENERAL"
    fi
  fi

  INLINE_COUNT=$(echo "$INLINE_COMMENTS" | jq 'length')

  if [ "$INLINE_COUNT" -gt 0 ] || [ -n "$REVIEW_BODY" ]; then
    jq -n \
      --arg commit_id "$HEAD_SHA" \
      --arg body "$REVIEW_BODY" \
      --argjson comments "$INLINE_COMMENTS" \
      '{commit_id: $commit_id, body: $body, comments: $comments}' > "$REVIEW_PAYLOAD"

    # No `event` field => the review is created in PENDING state
    if gh api --method POST "repos/$REPO/pulls/$PR_NUMBER/reviews" \
      --input "$REVIEW_PAYLOAD" > "$ASSETS_DIR/review_response.json"; then
      echo ""
      echo "Created 1 pending review with $INLINE_COUNT inline comment(s) on GitHub"
      echo "Click 'Submit review' in GitHub to publish it."
    else
      echo "Error: Failed to create the pending review. Payload saved at $REVIEW_PAYLOAD"
    fi
  else
    echo "No postable findings."
  fi

  rm -f "$FAILED_INLINES_FILE"
fi
```
