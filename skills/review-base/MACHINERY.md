# Review Shared Machinery

Canonical implementation of mode detection, change fetching, and GitHub posting. This is the ONLY copy - review skills reference these steps by name instead of inlining them.

## Step A: Mode Detection

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

## Step B: Get Changes

### IF MODE=local

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

### IF MODE=github

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

## Step C: Resolve Lines, Deduplicate, Post Pending Review

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
