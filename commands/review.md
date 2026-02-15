---
description: Code Review - Review local branch changes or GitLab MR with principal agents
argument-hint: [gitlab-mr-url] [context]
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite, Write, WebFetch
skills: review-base
---

# Code Review

Comprehensive code review using all relevant principal agents in parallel.

**Modes:**
- `/review [context]` - Review current branch changes
- `/review <gitlab-mr-url> [context]` - Review GitLab MR and post draft comments

**Uses:** `review-base` skill for finding prefixes, agent routing, comment style, and learning feedback loop.

## FULLY AUTOMATED WORKFLOW

This command runs **without any user prompts**. It will:
1. Detect mode (local branch vs GitLab MR)
2. Fetch changes (git diff or GitLab API)
3. Analyze code using principal agents in parallel
4. Post findings as draft comments on GitLab (GitLab mode only)
5. Generate a comprehensive review report
6. Display the final summary with links

**Do NOT ask user questions during execution.** Proceed directly through all phases.

## Instructions

### Phase 0: Mode Detection

```bash
ARGS="$ARGUMENTS"
FIRST_ARG=$(echo "$ARGS" | awk '{print $1}')

if echo "$FIRST_ARG" | grep -qE '^https://gitlab\.com/.*/merge_requests/[0-9]+'; then
  MODE="gitlab"
  MR_URL="$FIRST_ARG"
  CONTEXT=$(echo "$ARGS" | awk '{$1=""; print $0}' | sed 's/^[[:space:]]*//')
  echo "Mode: GitLab MR Review"
  echo "MR URL: $MR_URL"
else
  MODE="local"
  MR_URL=""
  CONTEXT="$ARGS"
  echo "Mode: Local Branch Review"
fi

if [ -n "$CONTEXT" ]; then
  echo "Review Context: $CONTEXT"
fi
```

---

### Phase 1: Get Changes

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

#### IF MODE=gitlab

Fetch MR data from GitLab API:

```bash
# Source secrets file if it exists
if [ -f "$HOME/.claude/.secrets" ]; then
  source "$HOME/.claude/.secrets"
fi

# Parse MR URL
MR_URL="$FIRST_ARG"

PROJECT_PATH=$(echo "$MR_URL" | sed -n 's|https://gitlab\.com/\(.*\)/-/merge_requests/.*|\1|p')
MR_ID=$(echo "$MR_URL" | sed -n 's|.*/-/merge_requests/\([0-9]*\).*|\1|p')

if [ -z "$PROJECT_PATH" ] || [ -z "$MR_ID" ]; then
  echo "Error: Invalid GitLab MR URL format"
  echo "Expected: https://gitlab.com/<project-path>/-/merge_requests/<mr-id>"
  exit 1
fi

echo "Project Path: $PROJECT_PATH"
echo "MR ID: $MR_ID"

# Check for GitLab token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable not set"
  echo "Please set your GitLab personal access token: export GITLAB_TOKEN=your_token"
  echo ""
  echo "To create a token:"
  echo "1. Go to GitLab -> Settings -> Access Tokens"
  echo "2. Create a token with 'api' scope (required for posting draft review comments)"
  echo "3. Run: export GITLAB_TOKEN='your-token-here'"
  exit 1
fi

# Get numeric project ID
ENCODED_PATH=$(echo "$PROJECT_PATH" | sed 's|/|%2F|g')
PROJECT_INFO=$(curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$ENCODED_PATH")

PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.id // empty')

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find project. Check URL and token permissions."
  echo "$PROJECT_INFO" | jq -r '.message // .'
  exit 1
fi

echo "Project ID: $PROJECT_ID"

# Validate token has 'api' scope
DRAFT_CHECK_CODE=$(curl -s -w "%{http_code}" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/draft_notes" \
  -o /dev/null)

if [ "$DRAFT_CHECK_CODE" = "403" ]; then
  echo "Error: Token lacks 'api' scope. Draft notes require write access."
  exit 1
fi

# Fetch MR data
ENCODED_PROJECT="$PROJECT_ID"
API_URL="https://gitlab.com/api/v4/projects/$ENCODED_PROJECT/merge_requests/$MR_ID/changes?access_raw_diffs=true"
TEMP_FILE="/tmp/gitlab_mr_${MR_ID}.json"

HTTP_CODE=$(curl -s -w "%{http_code}" -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API_URL" -o "$TEMP_FILE")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch MR data (HTTP $HTTP_CODE)"
  if [ "$HTTP_CODE" = "401" ]; then
    echo "Authentication failed. Please check your GitLab token."
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "Project or MR not found. Check URL and token permissions."
  fi
  rm -f "$TEMP_FILE"
  exit 1
fi

# Extract MR info
TITLE=$(jq -r '.title' "$TEMP_FILE")
DESCRIPTION=$(jq -r '.description // ""' "$TEMP_FILE")
STATE=$(jq -r '.state' "$TEMP_FILE")
AUTHOR=$(jq -r '.author.name' "$TEMP_FILE")
SOURCE_BRANCH=$(jq -r '.source_branch' "$TEMP_FILE")
TARGET_BRANCH=$(jq -r '.target_branch' "$TEMP_FILE")
BASE_SHA=$(jq -r '.diff_refs.base_sha // empty' "$TEMP_FILE")
HEAD_SHA=$(jq -r '.diff_refs.head_sha // empty' "$TEMP_FILE")
START_SHA=$(jq -r '.diff_refs.start_sha // empty' "$TEMP_FILE")

echo ""
echo "=== Merge Request Summary ==="
echo "Title: $TITLE"
echo "Author: $AUTHOR"
echo "State: $STATE"
echo "Source: $SOURCE_BRANCH -> Target: $TARGET_BRANCH"

# Create assets directory
ASSETS_DIR="$HOME/.claude/gitlab-review-assets/mr_${MR_ID}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ASSETS_DIR/diffs" "$ASSETS_DIR/files"
DIFFS_DIR="$ASSETS_DIR/diffs"
FILES_DIR="$ASSETS_DIR/files"

# Extract diffs for each changed file
jq -r '.changes[] | @base64' "$TEMP_FILE" | while read -r change_base64; do
  change=$(echo "$change_base64" | base64 -d)
  new_path=$(echo "$change" | jq -r '.new_path')
  diff=$(echo "$change" | jq -r '.diff // ""')

  if [ -n "$diff" ]; then
    safe_filename=$(echo "$new_path" | tr '/' '_')
    echo "$diff" > "$DIFFS_DIR/${safe_filename}.diff"
  fi
done

# Fetch full file content for new/modified files
SOURCE_SHA=$(jq -r '.sha' "$TEMP_FILE")
jq -r '.changes[] | select(.deleted_file != true) | .new_path' "$TEMP_FILE" | while read -r filepath; do
  safe_filename=$(echo "$filepath" | tr '/' '_')
  FILE_URL="https://gitlab.com/api/v4/projects/$ENCODED_PROJECT/repository/files/$(echo "$filepath" | jq -sRr @uri)/raw?ref=$SOURCE_SHA"
  curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$FILE_URL" -o "$FILES_DIR/${safe_filename}.content" 2>/dev/null
done

# Copy MR data and save paths for later phases
cp "$TEMP_FILE" "$ASSETS_DIR/mr_data.json"

PATHS_FILE="/tmp/gitlab_review_paths_${MR_ID}.txt"
echo "ASSETS_DIR=$ASSETS_DIR" > "$PATHS_FILE"
echo "DIFFS_DIR=$DIFFS_DIR" >> "$PATHS_FILE"
echo "FILES_DIR=$FILES_DIR" >> "$PATHS_FILE"
echo "PROJECT_ID=$PROJECT_ID" >> "$PATHS_FILE"
echo "MR_ID=$MR_ID" >> "$PATHS_FILE"
echo "MR_URL=$MR_URL" >> "$PATHS_FILE"
echo "BASE_SHA=$BASE_SHA" >> "$PATHS_FILE"
echo "HEAD_SHA=$HEAD_SHA" >> "$PATHS_FILE"
echo "START_SHA=$START_SHA" >> "$PATHS_FILE"
echo "GITLAB_TOKEN=$GITLAB_TOKEN" >> "$PATHS_FILE"

FINDINGS_FILE="$ASSETS_DIR/findings.json"
echo "[]" > "$FINDINGS_FILE"
echo "FINDINGS_FILE=$FINDINGS_FILE" >> "$PATHS_FILE"

# Get changed files list for categorization
CHANGED_FILES_LIST=$(jq -r '.changes[].new_path' "$TEMP_FILE")

rm -f "$TEMP_FILE"
echo ""
echo "Assets dir: $ASSETS_DIR"
```

---

### Phase 2: Categorize Changed Files

Group files by type to determine which agents to spawn:

| Category | File Patterns | Agents |
|----------|---------------|--------|
| **Frontend** | `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.module.scss` | frontend-principal, ux-principal |
| **Backend** | `*.ts` in `controllers/`, `services/`, `repositories/`, `middleware/` | backend-principal |
| **DevOps** | `*.tf`, `*.yaml`, `*.yml`, `Dockerfile*`, `docker-compose*` | devops-principal |
| **AI/ML** | Files with `openai`, `llm`, `prompt`, `embedding`, `ai` in path | ai-principal |
| **All Changes** | All files | security-principal, architect-principal, bug-finder |

---

### Phase 3: Spawn Principal Agents in Parallel

Use the **Task tool** to spawn multiple agents simultaneously based on changed files.

### Shared Agent Output Format

**IMPORTANT:** When constructing each agent prompt below, always append this full output format section to the prompt text sent to the agent.

```
OUTPUT FORMAT - Return findings as JSON array:
[
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "exact code snippet from a + line (5-50 chars)",
    "comment": "Single-paragraph concise feedback. No multi-section format."
  },
  {
    "type": "general",
    "prefix": "[Nice to have]",
    "file_path": "src/path/to/file.ts",
    "comment": "File-level or architectural concern."
  }
]

RULES:
- type: "inline" for comments on specific changed lines, "general" for file-level/cross-cutting/architectural concerns
- prefix: Use [Blocker], [Nice to have], [Suggestion], [Need to check], or [Question]
- code_pattern (inline only): Copy EXACT code from a PLUS LINE (+ prefix) in the diff (5-50 chars)
  - CRITICAL: ONLY from + lines (added/modified). NEVER from context/unchanged lines
  - Use a unique snippet that appears only once in the file
  - Omit code_pattern entirely for "general" type findings
- comment: Write concise, single-paragraph feedback:
  - Jump straight to the feedback (NO intro restating what code does)
  - Brief reason only if not obvious (don't belabor the point)
  - Code examples ONLY for complex fixes (high-level guidance, not full solution)
  - NO code examples for simple changes (moving files, renaming, extracting constants)
  - NO multi-section format (no separate "Why:", "Suggestion:", "Question:" subsections)
- Write as if YOU are the reviewer - natural, human, professional tone
- DO NOT post positive/complimentary comments - only actionable feedback

TEST COVERAGE RULE:
- Flag critical paths (business logic, error handling, edge cases) that lack test coverage
- Not demanding 100% coverage - focus on core logic that could break silently
- Use a "general" type finding to note missing tests

UNCHANGED CODE RULE:
- NEVER create inline findings for unchanged/context lines in the diff
- For architectural concerns about existing code, create ONE "general" type finding summarizing all observations
- Example: "Several services duplicate validation logic (UserService, OrderService). Consider extracting to shared validators/"
```

### Comment Style Guidelines

- Sound natural and human, not robotic
- Keep it concise - single paragraph strongly preferred
- Relaxed grammar is fine if it improves flow
- Skip the emojis
- DO NOT repeat what the code is doing - jump straight to the feedback
- DO NOT post positive/complimentary comments - only actionable feedback
- Code examples ONLY for complex fixes (high-level guidance, not complete solution)
- NO multi-section format (no separate "Why:", "Suggestion:", "Question:" subsections)

**GOOD (concise, single paragraph):**
```
[Nice to have] Consider moving ServiceModule enum to a shared types file, those enums used across multiple domains.
```

**GOOD (question, straight to the point):**
```
[Question] Is losing the original error type intentional here? Consider attaching the original as cause.
```

**GOOD (complex fix deserving code example - high level):**
```
[Blocker] Use a type guard instead of `as` casting here - bypasses type safety and bugs surface only at runtime.

\`\`\`typescript
function isUserDTO(obj: unknown): obj is UserDTO {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
\`\`\`
```

**BAD (multi-section verbose format - DO NOT USE):**
```
[Nice to have] Consider moving ServiceModule enum to a shared types file.

Why: Enums used across multiple domains should be centralized.

Suggestion:
\`\`\`typescript
// types/services.ts
export enum ServiceModule { USERS, ORDERS }
\`\`\`
```

**BAD (redundant intro restating what code does):**
```
[Suggestion] This code converts duration from milliseconds to seconds. Consider extracting to a constant.
```

**BAD (unnecessary code example for simple change):**
```
[Suggestion] Consider renaming getUserData to fetchUser.

\`\`\`typescript
const fetchUser = async (id: string) => { ... }
\`\`\`
```

### Mode-Specific Prompt Content

**LOCAL mode:** Include the git diff output directly in each agent's prompt:
```
Review ONLY the following diff. Do NOT review unchanged code.

Branch: [current branch name]

Diff (review ONLY these changes):
[git diff output]

IMPORTANT: Only review the lines shown in the diff (+ and - lines).
Do NOT comment on existing code that wasn't changed in this branch.
```

**GITLAB mode:** Reference the assets directory with saved diffs:
```
Review this GitLab MR. Do NOT review unchanged code.

Assets: $ASSETS_DIR
Diffs: $DIFFS_DIR/*.diff
Full files: $FILES_DIR

IMPORTANT: Only review the lines shown in the diffs (+ and - lines).
Do NOT comment on existing code that wasn't changed in this MR.
```

### Agents to Spawn

**ALWAYS spawn these agents:**

**Security Review (ALWAYS):**
```
subagent_type: security-principal
prompt: |
  [Mode-specific diff content from above]

  Focus on:
  - OWASP Top 10 vulnerabilities
  - Credential/secret exposure
  - Input validation gaps
  - SQL injection / XSS risks
  - Authentication/authorization issues
  - Insecure dependencies

  [Append Shared Agent Output Format]
```

**Architecture & Code Quality Review (ALWAYS):**
```
subagent_type: architect-principal
prompt: |
  [Mode-specific diff content from above]

  Focus on:
  **CLAUDE.md Compliance:**
  - File length (max 150 lines)
  - Function length (max 30 lines)
  - Three-layer architecture violations
  - Export default usage (should use named exports)
  - Barrel file usage (should import directly)

  **Code Cleanup & Quality:**
  - Code duplication (repeated logic > 3 lines that should be extracted)
  - Backward compatibility hacks (unused re-exports, `_unusedVar`, deprecated aliases, `// removed` comments)
  - Dead code (unused imports, unreachable code, commented-out blocks)
  - Over-engineering (unnecessary abstractions, premature optimization, extra indirection)
  - File minimization (can large files be split? can small related files be consolidated?)
  - Better approaches (simpler patterns, more idiomatic solutions, modern alternatives)

  **Test Coverage:**
  - Check if new/modified business logic has corresponding test files
  - Flag critical paths (error handling, branching logic, edge cases) that lack tests
  - Not demanding 100% - just core logic that could break silently

  [Append Shared Agent Output Format]
```

**Bug Finder (ALWAYS):**
```
subagent_type: bug-finder
prompt: |
  [Mode-specific diff content from above]

  Look for:
  - Logic errors
  - Edge cases not handled
  - Race conditions
  - Null/undefined risks
  - Off-by-one errors
  - Edge cases that should have test coverage but likely don't

  [Append Shared Agent Output Format]
```

**Spawn these agents IF relevant files exist:**

**Frontend Review (if .tsx/.jsx/.css/.scss files):**
```
subagent_type: frontend-principal
prompt: |
  [Mode-specific diff content from above - frontend files only]

  Focus on:
  **React Patterns:**
  - React component patterns (hooks, state management)
  - React anti-patterns (prop explosion, setState as props)
  - TypeScript best practices (no type casting)
  - Performance (unnecessary useMemo/useCallback)

  **Code Quality:**
  - CLAUDE.md compliance (file/function length limits)
  - Dead code and unused components/imports
  - Simplification opportunities (can this be done with less code?)
  - Deprecated React patterns (class components, legacy lifecycle, old context API)
  - Duplication across components (extract to shared hooks/utils)
  - Modern alternatives (old lodash usage when native methods exist, etc.)

  **Testing:**
  - Testing considerations
  - Missing test coverage for critical paths

  [Append Shared Agent Output Format]
```

**UX/Accessibility Review (if frontend files):**
```
subagent_type: ux-principal
prompt: |
  [Mode-specific diff content from above - frontend files only]

  Focus on:
  - WCAG 2.1 AA compliance
  - Semantic HTML usage
  - ARIA patterns
  - Keyboard navigation
  - Focus management
  - Loading states and error handling UX

  [Append Shared Agent Output Format]
```

**Backend Review (if backend .ts files):**
```
subagent_type: backend-principal
prompt: |
  [Mode-specific diff content from above - backend files only]

  Focus on:
  **Architecture:**
  - Three-layer architecture compliance
  - API design patterns (RESTful conventions)
  - CLAUDE.md compliance (file/function length limits)

  **Code Quality:**
  - Error handling (use http-status-codes, not raw numbers)
  - Database query optimization (N+1 problems)
  - Validation (Zod/class-validator patterns)
  - Code duplication across services (extract to shared utils)
  - Unnecessary backward compatibility (old aliases, deprecated endpoints)
  - Over-complicated abstractions (unnecessary layers, premature generalization)
  - Dead code (unused handlers, orphaned utilities)

  **Simplification:**
  - Can this be done with less code?
  - Are there simpler patterns available?
  - Modern alternatives to deprecated approaches?

  **Testing:**
  - Missing test coverage for service/controller logic
  - Critical paths (error handling, business logic) without tests

  [Append Shared Agent Output Format]
```

**DevOps Review (if .tf/.yaml/Dockerfile files):**
```
subagent_type: devops-principal
prompt: |
  [Mode-specific diff content from above - devops files only]

  Focus on:
  **Security:**
  - Container security (non-root user)
  - Secrets management (no hardcoded secrets)

  **Best Practices:**
  - Multi-stage Docker builds
  - Kubernetes resource limits
  - Terraform variable validation
  - CI/CD best practices

  **Code Quality:**
  - Duplication across Terraform modules
  - Unused resources or configurations
  - Simplification opportunities
  - Deprecated patterns or images

  [Append Shared Agent Output Format]
```

**AI/ML Review (if AI-related files):**
```
subagent_type: ai-principal
prompt: |
  [Mode-specific diff content from above - AI-related files only]

  Focus on:
  **Security & Reliability:**
  - Prompt injection prevention
  - Error handling and retries
  - Rate limiting

  **Best Practices:**
  - OpenAI integration patterns
  - Token management
  - Streaming implementation
  - Cost optimization

  **Code Quality:**
  - Duplicated prompt logic (extract to templates)
  - Hardcoded model names (use config)
  - Simplification opportunities
  - Deprecated API usage

  [Append Shared Agent Output Format]
```

---

### Phase 4: Aggregate Results

Collect findings from all spawned agents (from their Task outputs) and aggregate into a unified findings list.

**CRITICAL: Use Bash (echo/jq) for all findings.json file operations** - do NOT use Write/Read tools for intermediate data files (this avoids permission prompts). Only use Write for the final report in Phase 6.

```bash
# Merge all agent JSON outputs into findings.json using jq
# Example: jq -s 'add' <(echo "$SECURITY_FINDINGS") <(echo "$ARCHITECT_FINDINGS") > "$FINDINGS_FILE"
```

**Merge same-region findings** before proceeding. If multiple agents produced findings for the same `file_path` with overlapping `code_pattern`, combine them into a single finding with merged comments (separated by `\n\n---\n\n`).

Group findings by prefix in this order:
1. `[Blocker]` - MUST fix before merge
2. `[Nice to have]` - SHOULD fix
3. `[Suggestion]` - Consider fixing
4. `[Need to check]` - Verify/explain
5. `[Question]` - Needs clarification

---

### Phase 5: Post to GitLab (GITLAB MODE ONLY)

**Skip this phase entirely if MODE=local.**

```bash
# Source the paths file
source "/tmp/gitlab_review_paths_${MR_ID}.txt"

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
            line_content = line[1:] if line.startswith('+') or line.startswith(' ') else line
            if match_fn(line_content):
                return current_new_line
            if line.startswith('+') or line.startswith(' ') or (not line.startswith('-') and not line.startswith('\\') and not line.startswith('@@')):
                current_new_line += 1
        return None

    # Pass 1: Exact match
    result = scan_diff(lambda lc: pattern_clean in lc)
    if result is not None:
        return result

    # Pass 2: Whitespace-normalized match
    result = scan_diff(lambda lc: pattern_normalized in ' '.join(lc.split()))
    if result is not None:
        return result

    # Pass 3: Stripped syntax match for longer patterns
    if len(pattern_clean) >= 15:
        pattern_core = pattern_clean.strip('(){};,').strip()
        if pattern_core:
            result = scan_diff(lambda lc: pattern_core in lc)
            if result is not None:
                return result

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
        finding['type'] = 'general'
        finding['code_pattern'] = ''
        finding['line_number'] = None
        converted_count += 1

if converted_count > 0:
    print(f"Converted {converted_count} findings to general (code on unchanged lines)")

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

FINDINGS_COUNT=$(jq 'length' "$FINDINGS_FILE")

# Post each finding as a draft note
post_draft_note() {
  local note="$1"
  local file_path="$2"
  local line_number="$3"

  if [ -n "$file_path" ] && [ -n "$line_number" ] && [ "$line_number" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
      --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
      --url "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/draft_notes" \
      --data-urlencode "note=$note" \
      --data "position[base_sha]=$BASE_SHA" \
      --data "position[head_sha]=$HEAD_SHA" \
      --data "position[start_sha]=$START_SHA" \
      --data "position[position_type]=text" \
      --data "position[new_path]=$file_path" \
      --data "position[new_line]=$line_number")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
      --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
      --url "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/draft_notes" \
      --data-urlencode "note=$note")
  fi

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  [ "$HTTP_CODE" = "201" ] && return 0 || return 1
}

POSTED_COUNT=0

if [ "$FINDINGS_COUNT" -gt 0 ]; then
  jq -c '.[]' "$FINDINGS_FILE" | while read -r finding; do
    prefix=$(echo "$finding" | jq -r '.prefix // "[Suggestion]"')
    comment=$(echo "$finding" | jq -r '.comment // ""')
    file_path=$(echo "$finding" | jq -r '.file_path // ""')
    line_number=$(echo "$finding" | jq -r '.line_number // ""')
    code_pattern=$(echo "$finding" | jq -r '.code_pattern // ""')

    # Validate file exists in diff
    if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
      safe_filename=$(echo "$file_path" | tr '/' '_')
      if [ ! -f "$DIFFS_DIR/${safe_filename}.diff" ]; then
        file_path=""
        line_number=""
      fi
    fi

    # Build note content
    if [ "$line_number" = "null" ] || [ -z "$line_number" ]; then
      # Line calculation failed - post as clean general comment
      # Do NOT include file/code references (confusing in general section)
      note="$prefix $comment"
      file_path=""
      line_number=""
    else
      # Successful inline comment
      note="$prefix $comment"
    fi

    if post_draft_note "$note" "$file_path" "$line_number"; then
      if [ -n "$file_path" ] && [ -n "$line_number" ]; then
        echo "  Posted inline: $prefix ($file_path:$line_number)"
      else
        echo "  Posted general: $prefix"
      fi
      POSTED_COUNT=$((POSTED_COUNT + 1))
    fi

    sleep 0.1
  done

  echo ""
  echo "Posted $POSTED_COUNT draft notes to GitLab"
  echo "Click 'Submit review' in GitLab to publish all comments."
fi
```

---

### Phase 6: Generate Report

**MANDATORY**: Generate a comprehensive `review-report.md` file.

Save location:
- LOCAL mode: `$ASSETS_DIR/review-report.md`
- GITLAB mode: `$ASSETS_DIR/review-report.md`

Use the **Write** tool to create the report file.

The report MUST use this format:

```markdown
# Code Review Report

## Review Details

| Field | Value |
|-------|-------|
| **Mode** | Local Branch / GitLab MR |
| **Branch** | [source] -> [target] |
| **Title** | [MR title - GitLab mode only] |
| **Author** | [MR author - GitLab mode only] |
| **State** | [MR state - GitLab mode only] |
| **URL** | [MR URL - GitLab mode only] |
| **Files Changed** | X |
| **Review Date** | YYYY-MM-DD |

[If CONTEXT provided:]

## Review Context

[context text]

---

## Summary

- [Blocker]: X
- [Nice to have]: X
- [Suggestion]: X
- [Need to check]: X
- [Question]: X

### Files Reviewed

| Category | Count | Files |
|----------|-------|-------|
| Frontend | X | file1.tsx, file2.tsx |
| Backend | X | service.ts |
| DevOps | X | Dockerfile |

### Agents Used
- security-principal
- architect-principal
- bug-finder
- [list only agents that were spawned]

---

## Verdict

[APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

**Rationale:** [Brief explanation based on findings]

---

## [Blocker] - Must fix before merge

---

**`src/services/userService.ts`** | `return user as UserDTO`

> [Blocker] Use a type guard instead of `as` casting here. This bypasses type safety -
> if `user` doesn't match `UserDTO`, bugs will only surface at runtime.
>
> ```typescript
> function isUserDTO(obj: unknown): obj is UserDTO {
>   return typeof obj === 'object' && obj !== null && 'id' in obj;
> }
> if (!isUserDTO(user)) throw new Error('Invalid user shape');
> return user;
> ```

---

## [Nice to have] - Should fix

[Same format as above]

## [Suggestion] - Consider fixing

[Same format as above]

## [Need to check] - Verify/explain

[Same format as above]

## [Question] - Needs clarification

[Same format as above]

---

## Key Recommendations

1. [Most important action item]
2. [Second priority]
3. [Third priority]

---

[GITLAB mode only:]

## Draft Notes Posted

Posted X draft notes to GitLab
Review at: [MR URL]
Click "Submit review" in GitLab to publish all comments.
```

**IMPORTANT**: Always end by displaying:
1. A clickable markdown link to the report file
2. The full absolute path for easy access
3. Summary of findings and verdict

---

### Phase 7: Learning Feedback Loop

After generating the review report, execute the learning feedback loop.

#### Step 1: Extract Learnable Patterns

From your review findings, identify all findings with these prefixes:
- `[Blocker]` - Critical issues (MUST learn from these)
- `[Nice to have]` - Important improvements (SHOULD learn from these)
- `[Suggestion]` - Best practices to adopt (SHOULD learn from these)

Skip `[Need to check]`, `[Question]`, and project-specific bugs.

#### Step 2: For Each Learnable Pattern, Invoke improve-claude

For each `[Blocker]`, `[Nice to have]`, or `[Suggestion]` finding:

1. **Determine the category** based on the finding content:
   - Keywords `any`, `casting`, `type`, `TypeScript` -> category: `typescript-types`
   - Keywords `useEffect`, `useState`, `hook`, `React`, `component` -> category: `react-component`
   - Keywords `controller`, `service`, `repository`, `layer` -> category: `backend-patterns`
   - Keywords `injection`, `XSS`, `secret`, `auth`, `security` -> category: `security-patterns`
   - Other patterns -> category: `general`

2. **Check if the rule already exists** by searching CLAUDE.md for similar rules. Skip if already covered.

3. **Invoke the Skill tool** with:
   - skill: `improve-claude`
   - args: `[category]: [concise rule description] --save-skill`

The `/improve-claude` command will automatically:
- Update relevant config files (CLAUDE.md, agents, skills)
- Integrate the pattern into the appropriate existing domain skill (styling-rtl, react-component, etc.)

#### Step 3: Report Learning Results

Include in your final output to the user:

```
## Learning Feedback Loop

**Patterns Found:** [count]
**Rules Applied:** [list of rules added via improve-claude]
**Skills Updated:** [list of domain skills updated]
```

If no patterns were learned, report: "No learnable patterns identified in this review (no Blocker, Nice-to-have, or Suggestion findings)."

---

### Phase 8: Create Follow-up TODOs

If critical or high-priority issues were found, create TODO items to track resolution.

#### Step 1: Identify Actionable Items

From the review findings, identify:
- `[Blocker]` issues that need code changes
- `[Nice to have]` improvements worth tracking
- Technical debt items for future sprints

#### Step 2: Create TODOs

Use TodoWrite to track each actionable item with:
- Clear description of the fix needed
- File and line reference
- Priority based on severity tier (in_progress for blockers, pending for others)

#### Step 3: Report TODOs Created

Include in your output:

```markdown
## Follow-up TODOs Created

| Priority | Description | File |
|----------|-------------|------|
| High | Fix SQL injection vulnerability | src/api/users.ts:45 |
| Medium | Extract duplicate validation logic | src/services/*.ts |
| Low | Remove unused legacy alias | utils.ts:12 |
```

**Note:** If no actionable items found or all issues are minor style improvements, skip this phase.

---

## Important Notes

- **NEVER** add "Co-authored-by" or any Claude signatures
- **NEVER** add AI attribution to output
- Focus on **real problems** that impact reliability, maintainability, and security
- Reference **CLAUDE.md** standards for modularity rules
- Only review files that are **part of the changes** (branch diff or MR diff)
- **Think like a principal engineer**: Look for simplification, duplication, tech debt, and better approaches
- **Flag backward compatibility code** that may no longer be needed
- **Suggest file minimization**: Can large files be split? Can dead code be removed?
- **Prefer simplicity**: If something can be done with less code, suggest it
