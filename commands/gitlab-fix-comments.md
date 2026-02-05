---
description: Analyze GitLab MR comments and intelligently apply necessary fixes with detailed reporting
argument-hint: <mr-url>
allowed-tools: Bash, WebFetch, Task, TodoWrite, Edit, MultiEdit, Read, Grep, Glob, Skill
skills: extract-learning
---

# GitLab MR Comments Intelligent Analyzer & Fixer

**Uses:** `extract-learning` skill for continuous learning feedback loop.

## Prerequisites

1. Set your GitLab personal access token:
   ```bash
   export GITLAB_TOKEN='token'
   ```
2. Ensure your token has the `api` scope for accessing private projects and posting comments
3. The current project and branch should match the MR being analyzed

I'll analyze GitLab merge request comments and intelligently determine which fixes to apply, generating a detailed report of all decisions.

Let me fetch and analyze the MR discussions and comments from the provided URL.

```bash
# Source secrets file if it exists
if [ -f "$HOME/.claude/.secrets" ]; then
  source "$HOME/.claude/.secrets"
fi

# Parse MR URL from arguments
MR_URL="$ARGUMENTS"

if [ -z "$MR_URL" ]; then
  echo "Error: Missing MR URL"
  echo "Usage: /gitlab-fix-comments <mr-url>"
  echo "Example: /gitlab-fix-comments https://gitlab.com/group/project/-/merge_requests/123"
  exit 1
fi

# Validate URL format
if ! [[ "$MR_URL" =~ gitlab\.com.*merge_requests ]]; then
  echo "Error: Invalid GitLab MR URL format"
  echo "Expected: https://gitlab.com/<project-path>/-/merge_requests/<mr-id>"
  echo "Got: $MR_URL"
  exit 1
fi

# Extract project path and MR ID using sed (same as gitlab-review.md)
PROJECT_PATH=$(echo "$MR_URL" | sed -n 's|https://gitlab\.com/\(.*\)/-/merge_requests/.*|\1|p')
MR_ID=$(echo "$MR_URL" | sed -n 's|.*/-/merge_requests/\([0-9]*\).*|\1|p')

if [ -z "$PROJECT_PATH" ] || [ -z "$MR_ID" ]; then
  echo "Error: Could not parse project path or MR ID from URL"
  echo "URL: $MR_URL"
  exit 1
fi

echo "Project Path: $PROJECT_PATH"
echo "MR ID: $MR_ID"

# Check for GitLab token first
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable not set"
  echo "Please set your GitLab personal access token: export GITLAB_TOKEN=your_token"
  exit 1
fi

# Get numeric project ID from GitLab API (same as gitlab-review.md)
ENCODED_PATH=$(echo "$PROJECT_PATH" | sed 's|/|%2F|g')
echo "Fetching project ID for: $PROJECT_PATH"

PROJECT_INFO=$(curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$ENCODED_PATH")

PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.id // empty')

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find project. Check URL and token permissions."
  echo "$PROJECT_INFO" | jq -r '.message // .'
  exit 1
fi

echo "Project ID: $PROJECT_ID"

echo "=========================================="
echo "GitLab MR Comment Intelligent Analyzer"
echo "=========================================="
echo "Project ID: $PROJECT_ID"
echo "MR ID: $MR_ID"
echo ""

# Check for GitLab token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable not set"
  echo "Please set your GitLab personal access token: export GITLAB_TOKEN=your_token"
  exit 1
fi

# Create session directory for this analysis
SESSION_DIR="$HOME/.claude/gitlab-fix-comments/mr_${MR_ID}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SESSION_DIR"

echo "Creating session assets in: $SESSION_DIR"
echo ""

# Fetch MR basic info first
MR_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID"
echo "Fetching MR info..."
MR_DATA_FILE="$SESSION_DIR/mr_info.json"

HTTP_CODE=$(curl -s -w %{http_code} -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$MR_API_URL" -o "$MR_DATA_FILE")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch MR data (HTTP $HTTP_CODE)"
  if [ -s "$MR_DATA_FILE" ]; then
    cat "$MR_DATA_FILE"
  fi
  exit 1
fi

# Extract MR info
TITLE=$(jq -r '.title' "$MR_DATA_FILE")
AUTHOR=$(jq -r '.author.name' "$MR_DATA_FILE")
SOURCE_BRANCH=$(jq -r '.source_branch' "$MR_DATA_FILE")
TARGET_BRANCH=$(jq -r '.target_branch' "$MR_DATA_FILE")
STATE=$(jq -r '.state' "$MR_DATA_FILE")
WEB_URL=$(jq -r '.web_url' "$MR_DATA_FILE")

echo "=== Merge Request Info ==="
echo "Title: $TITLE"
echo "Author: $AUTHOR"
echo "State: $STATE"
echo "Branch: $SOURCE_BRANCH → $TARGET_BRANCH"
echo "URL: $WEB_URL"
echo ""

# Fetch all discussions (threaded comments)
DISCUSSIONS_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/discussions"
echo "Fetching MR discussions..."
DISCUSSIONS_FILE="$SESSION_DIR/discussions.json"

HTTP_CODE=$(curl -s -w %{http_code} -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$DISCUSSIONS_API_URL" -o "$DISCUSSIONS_FILE")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch discussions (HTTP $HTTP_CODE)"
  if [ -s "$DISCUSSIONS_FILE" ]; then
    cat "$DISCUSSIONS_FILE"
  fi
  exit 1
fi

# Fetch all notes (simple comments)
NOTES_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/notes"
echo "Fetching MR notes..."
NOTES_FILE="$SESSION_DIR/notes.json"

HTTP_CODE=$(curl -s -w %{http_code} -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$NOTES_API_URL" -o "$NOTES_FILE")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch notes (HTTP $HTTP_CODE)"
  if [ -s "$NOTES_FILE" ]; then
    cat "$NOTES_FILE"
  fi
  exit 1
fi

# Count comments
DISCUSSION_COUNT=$(jq '. | length' "$DISCUSSIONS_FILE")
NOTE_COUNT=$(jq '. | length' "$NOTES_FILE")

echo "Found $DISCUSSION_COUNT discussions and $NOTE_COUNT notes"
echo ""

# Process discussions to extract actionable comments
COMMENTS_FILE="$SESSION_DIR/all_comments.json"
echo "Processing comments for analysis..."

# Combine discussions and notes into a structured format
jq -s '
  (.[0] | map({
    id: .id,
    type: "discussion",
    notes: .notes | map({
      id: .id,
      body: .body,
      author: .author.name,
      created_at: .created_at,
      position: .position,
      resolved: .resolved,
      resolvable: .resolvable,
      system: .system
    })
  })) +
  (.[1] | map({
    id: .id,
    type: "note",
    notes: [{
      id: .id,
      body: .body,
      author: .author.name,
      created_at: .created_at,
      resolved: .resolved,
      resolvable: .resolvable,
      system: .system
    }]
  }))
' "$DISCUSSIONS_FILE" "$NOTES_FILE" > "$COMMENTS_FILE"

# Extract comments with positions (inline code comments)
echo "Extracting inline code comments for analysis..."
INLINE_COMMENTS_FILE="$SESSION_DIR/inline_comments.json"

jq '[
  .[] | select(.type == "discussion") | .notes[] |
  select(.position != null and .system != true) |
  {
    id: .id,
    body: .body,
    author: .author,
    file_path: .position.new_path // .position.old_path,
    new_line: .position.new_line,
    old_line: .position.old_line,
    line_range: .position.line_range,
    resolved: .resolved,
    resolvable: .resolvable
  }
]' "$COMMENTS_FILE" > "$INLINE_COMMENTS_FILE"

# Extract general comments (non-inline)
echo "Extracting general comments for analysis..."
GENERAL_COMMENTS_FILE="$SESSION_DIR/general_comments.json"

jq '[
  .[] | .notes[] |
  select(.position == null and .system != true) |
  {
    id: .id,
    body: .body,
    author: .author,
    resolved: .resolved,
    resolvable: .resolvable
  }
]' "$COMMENTS_FILE" > "$GENERAL_COMMENTS_FILE"

INLINE_COUNT=$(jq '. | length' "$INLINE_COMMENTS_FILE")
GENERAL_COUNT=$(jq '. | length' "$GENERAL_COMMENTS_FILE")

echo ""
echo "=== Comments Summary ==="
echo "Inline code comments: $INLINE_COUNT"
echo "General comments: $GENERAL_COUNT"
echo ""

# Initialize the analysis report
REPORT_FILE="$SESSION_DIR/fix_report.md"
echo "# GitLab MR Comment Analysis & Fix Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**MR Title:** $TITLE (#$MR_ID)" >> "$REPORT_FILE"
echo "**URL:** $WEB_URL" >> "$REPORT_FILE"
echo "**Analysis Date:** $(date)" >> "$REPORT_FILE"
echo "**Author:** $AUTHOR" >> "$REPORT_FILE"
echo "**Branch:** $SOURCE_BRANCH → $TARGET_BRANCH" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Initialize counters
TOTAL_COMMENTS=0
FIXES_APPLIED=0
FIXES_SKIPPED=0
MANUAL_REVIEW_NEEDED=0

# Create a structured analysis file
ANALYSIS_FILE="$SESSION_DIR/comment_analysis.json"
echo "[]" > "$ANALYSIS_FILE"

# Display unresolved comments that need analysis
echo "=== Analyzing Unresolved Comments ==="
echo ""

UNRESOLVED_INLINE=$(jq '[.[] | select(.resolved == false)]' "$INLINE_COMMENTS_FILE")
UNRESOLVED_COUNT=$(echo "$UNRESOLVED_INLINE" | jq '. | length')

if [ "$UNRESOLVED_COUNT" -gt 0 ]; then
  echo "Found $UNRESOLVED_COUNT unresolved inline comments to analyze:"
  echo ""
  echo "$UNRESOLVED_INLINE" | jq -r '.[] |
    "📍 \(.file_path)" +
    (if .new_line then ":\(.new_line)" else "" end) +
    "\n   Author: \(.author)" +
    "\n   Comment: \(.body | split("\n")[0] | .[0:100])" +
    (if (.body | length) > 100 then "..." else "" end) +
    "\n"'

  # Save unresolved comments for detailed analysis
  echo "$UNRESOLVED_INLINE" > "$SESSION_DIR/unresolved_comments.json"
else
  echo "No unresolved inline comments found."
fi

# Save all analysis paths for the agent
PATHS_FILE="$SESSION_DIR/paths.txt"
echo "SESSION_DIR=$SESSION_DIR" > "$PATHS_FILE"
echo "DISCUSSIONS_FILE=$DISCUSSIONS_FILE" >> "$PATHS_FILE"
echo "NOTES_FILE=$NOTES_FILE" >> "$PATHS_FILE"
echo "COMMENTS_FILE=$COMMENTS_FILE" >> "$PATHS_FILE"
echo "INLINE_COMMENTS_FILE=$INLINE_COMMENTS_FILE" >> "$PATHS_FILE"
echo "GENERAL_COMMENTS_FILE=$GENERAL_COMMENTS_FILE" >> "$PATHS_FILE"
echo "REPORT_FILE=$REPORT_FILE" >> "$PATHS_FILE"
echo "ANALYSIS_FILE=$ANALYSIS_FILE" >> "$PATHS_FILE"
echo "PROJECT_ID=$PROJECT_ID" >> "$PATHS_FILE"
echo "MR_ID=$MR_ID" >> "$PATHS_FILE"

echo ""
echo "=========================================="
echo "Comment data fetched successfully!"
echo "Session assets saved to: $SESSION_DIR"
echo "=========================================="
echo ""
echo "Starting intelligent comment analysis..."
echo ""
```

Now I'll analyze each comment to determine if fixes are needed and generate a detailed report.

## Intelligent Comment Analysis

I'll analyze each unresolved comment to:

1. **Validate the suggestion** - Check if it's correct and beneficial
2. **Examine current code** - Verify if the fix is actually needed
3. **Assess impact** - Determine the consequences of applying or skipping the fix
4. **Make informed decisions** - Only apply fixes that are 100% necessary

```bash
# Add analysis summary header to report
echo "## Analysis Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Analysis Approach:**" >> "$REPORT_FILE"
echo "- Each comment is analyzed for validity and necessity" >> "$REPORT_FILE"
echo "- Current code is examined to verify if fixes are needed" >> "$REPORT_FILE"
echo "- Only 100% necessary and beneficial fixes are applied" >> "$REPORT_FILE"
echo "- Detailed reasoning is provided for all decisions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Initialize decision tracking
echo "## Comment Analysis Details" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
```

## Phase 2: Agent-Based Analysis

Use the **Task tool** to invoke the `gitlab-comment-fixer` agent for intelligent comment analysis:

**Task tool invocation:**
```
subagent_type: gitlab-comment-fixer
prompt: |
  Analyze GitLab MR comments and apply necessary fixes.

  **Session Context:**
  - Session directory: $SESSION_DIR
  - Unresolved comments: $SESSION_DIR/unresolved_comments.json
  - Project: $PROJECT_ID, MR: $MR_ID

  **Analysis Steps:**
  1. Parse each comment to extract the suggested fix
  2. Read the current code at the specified location
  3. Validate the suggestion against best practices
  4. Determine necessity (critical, beneficial, preference)
  5. Apply only 100% necessary and beneficial fixes
  6. Generate detailed decision report with reasoning

  **Categorize each suggestion as:**
  - Critical: Security/correctness issues (APPLY)
  - Recommended: Best practices improvements (APPLY)
  - Style: Personal preference (SKIP unless project standard)
  - Invalid: Incorrect suggestions (SKIP with explanation)
  - Already Correct: Code already follows suggestion (SKIP)

  Output a comprehensive fix report in $SESSION_DIR/fix_report.md
```

The gitlab-comment-fixer agent will analyze each comment and generate the comprehensive report.

## Performing Intelligent Analysis

I'll examine each comment, validate the suggestions, and make informed decisions about which fixes to apply.

```bash
# Create a fixes plan based on intelligent analysis
FIXES_PLAN="$SESSION_DIR/fixes_plan.json"

if [ "$UNRESOLVED_COUNT" -gt 0 ]; then
  echo "Creating intelligent fixes plan..."

  # Initialize the fixes plan with categories
  cat > "$FIXES_PLAN" << 'EOF'
{
  "critical_fixes": [],
  "recommended_fixes": [],
  "style_preferences": [],
  "invalid_suggestions": [],
  "already_correct": []
}
EOF

  echo "Fixes plan initialized at: $FIXES_PLAN"
  echo ""

  # Add more detailed tracking to the report
  echo "### Analysis Categories" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "Comments will be categorized as:" >> "$REPORT_FILE"
  echo "- **Critical Fixes** 🔴 - Must be fixed (bugs, security issues)" >> "$REPORT_FILE"
  echo "- **Recommended Fixes** 🟡 - Should be fixed (best practices, performance)" >> "$REPORT_FILE"
  echo "- **Style Preferences** 🔵 - Optional (formatting, naming conventions)" >> "$REPORT_FILE"
  echo "- **Invalid Suggestions** ❌ - Incorrect or harmful suggestions" >> "$REPORT_FILE"
  echo "- **Already Correct** ✅ - Code is already correct, no fix needed" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "---" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
fi

# Display current status
echo "Analysis plan created. Ready for intelligent processing."
echo ""
echo "The analysis will:"
echo "1. Read each comment and its context"
echo "2. Examine the current code"
echo "3. Validate the suggestion"
echo "4. Make an informed decision"
echo "5. Generate detailed reasoning"
echo "6. Apply only necessary fixes"
echo ""
```

I'll now perform the detailed analysis of each comment using a specialized agent.

The agent will:

- Read the comment data from `$SESSION_DIR`
- Analyze each unresolved comment intelligently
- Check the actual code to verify if fixes are needed
- Categorize each suggestion appropriately
- Generate a detailed report for each decision
- Apply only the fixes that are 100% necessary and beneficial
- Provide comprehensive reasoning for all decisions

After the analysis, you'll receive:

1. A complete report showing all decisions and reasoning
2. Statistics on fixes applied vs skipped
3. Detailed explanations for each action taken
4. An audit trail of all changes made

Let me complete the intelligent analysis and fix application process.

## Detailed Comment Analysis Process

I'll now analyze each comment individually to make informed decisions.

```bash
# Create detailed analysis entries for each comment
echo "### Individual Comment Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

comment_number=1

# Process each unresolved comment
if [ "$UNRESOLVED_COUNT" -gt 0 ]; then
  jq -c '.[]' "$SESSION_DIR/unresolved_comments.json" | while read -r comment; do
    file_path=$(echo "$comment" | jq -r '.file_path')
    line_number=$(echo "$comment" | jq -r '.new_line // .old_line // "N/A"')
    author=$(echo "$comment" | jq -r '.author')
    body=$(echo "$comment" | jq -r '.body')
    comment_id=$(echo "$comment" | jq -r '.id')

    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "#### Comment #$comment_number" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**File:** \`$file_path:$line_number\`" >> "$REPORT_FILE"
    echo "**Reviewer:** $author" >> "$REPORT_FILE"
    echo "**Comment ID:** $comment_id" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Suggestion:**" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$body" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    ((comment_number++))
    ((TOTAL_COMMENTS++))
  done
fi

# Save current analysis state
echo "{\"total_analyzed\": $TOTAL_COMMENTS, \"session_dir\": \"$SESSION_DIR\"}" > "$SESSION_DIR/analysis_state.json"
```

Now I'll use specialized agents to perform deep analysis on each comment.

The agents will:

1. **Read the actual code** at the specified locations
2. **Parse the suggestion** to understand what's being requested
3. **Validate the correctness** of the suggestion
4. **Check project conventions** to ensure consistency
5. **Determine the category** (critical, recommended, style, invalid, or already correct)
6. **Generate detailed reasoning** for the decision
7. **Apply fixes intelligently** only when necessary

## Intelligent Fix Application

After analysis, I'll apply only the necessary fixes with full justification.

```bash
# Function to categorize and validate suggestions
categorize_suggestion() {
  local suggestion="$1"
  local file_path="$2"
  local line_number="$3"

  # Pattern matching for different types of suggestions
  if echo "$suggestion" | grep -qiE "(security|vulnerability|injection|exposure|leak)"; then
    echo "critical"
  elif echo "$suggestion" | grep -qiE "(bug|error|crash|null|undefined|exception)"; then
    echo "critical"
  elif echo "$suggestion" | grep -qiE "(performance|optimization|memory|efficiency)"; then
    echo "recommended"
  elif echo "$suggestion" | grep -qiE "(best practice|should|consider|recommend)"; then
    echo "recommended"
  elif echo "$suggestion" | grep -qiE "(style|format|naming|convention|indent)"; then
    echo "style"
  elif echo "$suggestion" | grep -qiE "(wrong|incorrect|mistake|not needed)"; then
    echo "validate_first"
  else
    echo "manual_review"
  fi
}

# Process each comment with intelligent analysis
echo "" >> "$REPORT_FILE"
echo "## Analysis Results" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Create a decision log
DECISION_LOG="$SESSION_DIR/decisions.json"
echo "[]" > "$DECISION_LOG"

# Track statistics
CRITICAL_COUNT=0
RECOMMENDED_COUNT=0
STYLE_COUNT=0
INVALID_COUNT=0
ALREADY_CORRECT_COUNT=0

echo "Performing intelligent analysis on each comment..."
echo ""
```

I'll now complete the analysis with a specialized agent that will:

1. **Examine each comment in detail**
2. **Read the actual code files**
3. **Validate suggestions against the codebase**
4. **Make informed decisions**
5. **Apply only necessary fixes**
6. **Generate comprehensive reports**

The final report will include:

- **Decision for each comment** (Fix Applied/Skipped/Manual Review)
- **Detailed reasoning** explaining why
- **Code snippets** showing before/after for applied fixes
- **Impact assessment** for each decision
- **Summary statistics** of all actions taken

```bash
# Generate final summary
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Final Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Analysis Complete:** $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Statistics" >> "$REPORT_FILE"
echo "- Total Comments Analyzed: $TOTAL_COMMENTS" >> "$REPORT_FILE"
echo "- Critical Fixes Applied: $CRITICAL_COUNT" >> "$REPORT_FILE"
echo "- Recommended Fixes Applied: $RECOMMENDED_COUNT" >> "$REPORT_FILE"
echo "- Style Preferences Skipped: $STYLE_COUNT" >> "$REPORT_FILE"
echo "- Invalid Suggestions Rejected: $INVALID_COUNT" >> "$REPORT_FILE"
echo "- Already Correct (No Action): $ALREADY_CORRECT_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Files Modified" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# List all modified files
if [ -f "$SESSION_DIR/modified_files.txt" ]; then
  while read -r file; do
    echo "- \`$file\`" >> "$REPORT_FILE"
  done < "$SESSION_DIR/modified_files.txt"
else
  echo "- No files were modified" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "### Report Location" >> "$REPORT_FILE"
echo "\`$REPORT_FILE\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Display the final report
echo ""
echo "=========================================="
echo "INTELLIGENT ANALYSIS COMPLETE"
echo "=========================================="
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "To view the complete report:"
echo "cat $REPORT_FILE"
echo ""
echo "Session assets saved in: $SESSION_DIR"
echo ""

# Show a summary on screen
echo "=== Summary ==="
echo "Total Comments: $TOTAL_COMMENTS"
echo "Fixes Applied: $((CRITICAL_COUNT + RECOMMENDED_COUNT))"
echo "Fixes Skipped: $((STYLE_COUNT + INVALID_COUNT + ALREADY_CORRECT_COUNT))"
echo ""

# Export paths for agent use
export GITLAB_FIX_SESSION_DIR="$SESSION_DIR"
export GITLAB_FIX_REPORT_FILE="$REPORT_FILE"
export GITLAB_FIX_DECISION_LOG="$DECISION_LOG"
```

The intelligent analysis is now ready to process comments and make informed decisions about which fixes to apply.

## Decision Framework Implementation

I'll now use a specialized agent to analyze each comment and make informed decisions.

The agent will follow this decision framework:

### 1. Critical Fixes (Always Apply)

- Security vulnerabilities
- Null pointer exceptions
- Memory leaks
- Data corruption risks
- Authentication/authorization issues

**Example Report Entry:**

````markdown
#### Comment #1: Missing null check

**File:** `src/api/handler.ts:45`
**Decision:** Fix Applied ✅
**Category:** Critical - Bug Fix
**Reasoning:** The suggested null check prevents a potential crash when the API response is undefined. This is a critical bug that could cause service disruption.
**Applied Fix:**

```diff
- const data = response.body.data;
+ const data = response?.body?.data || {};
```
````

**Impact:** Prevents runtime errors and improves application stability.

````

### 2. Recommended Fixes (Apply with Validation)
- Performance improvements with clear benefits
- Best practices that improve maintainability
- Code clarity enhancements
- Error handling improvements

**Example Report Entry:**
```markdown
#### Comment #2: Inefficient array operation
**File:** `src/utils/transform.js:78`
**Decision:** Fix Applied ✅
**Category:** Recommended - Performance
**Reasoning:** Using `map()` instead of `forEach()` with push is more efficient and idiomatic.
**Current Code:** Uses forEach with manual array building
**Applied Fix:** Replaced with single map operation
**Impact:** 15-20% performance improvement for large datasets.
````

### 3. Style Preferences (Skip with Explanation)

- Formatting preferences
- Naming conventions that don't match project style
- Optional syntax choices
- Personal preferences without clear benefit

**Example Report Entry:**

```markdown
#### Comment #3: Variable naming suggestion

**File:** `src/components/Button.tsx:12`
**Decision:** Fix Skipped ⏭️
**Category:** Style Preference
**Reasoning:** The suggestion to rename 'onClick' to 'handleClick' is a style preference. The current naming follows React conventions and is consistent with the rest of the codebase.
**Impact:** No functional impact - maintaining consistency is more important.
```

### 4. Invalid Suggestions (Reject with Explanation)

- Suggestions that would break functionality
- Misunderstandings of the code's purpose
- Outdated practices
- Incorrect assumptions

**Example Report Entry:**

```markdown
#### Comment #4: Remove async/await

**File:** `src/services/api.ts:34`
**Decision:** Fix Rejected ❌
**Category:** Invalid Suggestion
**Reasoning:** The reviewer suggests removing async/await, but this would break the error handling flow and cause unhandled promise rejections. The current implementation is correct.
**Impact:** Rejecting this prevents introducing bugs into the error handling system.
```

### 5. Already Correct (No Action Needed)

- Code that already follows the suggestion
- Previously fixed issues
- Misread code

**Example Report Entry:**

```markdown
#### Comment #5: Add error handling

**File:** `src/handlers/upload.js:67`
**Decision:** No Action Needed ✅
**Category:** Already Correct
**Reasoning:** The code already has comprehensive error handling with try/catch blocks and proper error propagation. The reviewer may have looked at an older version.
**Current Implementation:** Proper error handling is already in place.
```

## Intelligent Agent Execution

Now I'll execute the specialized agent to perform the analysis.

The agent will:

1. Read all comment data from the session directory
2. Examine each file and line mentioned in comments
3. Apply the decision framework
4. Generate detailed reports for each decision
5. Apply only the necessary fixes
6. Create a comprehensive audit trail

After execution, you'll receive:

- A complete markdown report with all decisions
- JSON logs of all actions taken
- Modified files with applied fixes
- Statistics showing the breakdown of decisions

The agent ensures that:

- No harmful changes are made
- Project conventions are respected
- Only beneficial fixes are applied
- Every decision is justified and documented

This approach provides transparency and accountability for all automated fixes while preventing blind application of potentially harmful suggestions.

## Phase 3: Continuous Learning Integration

After applying fixes, extract learnable patterns to prevent recurring issues in future code reviews.

### Learning Triggers

Fixes in these categories trigger learning extraction:
- **Critical Fixes** (bugs, security) → ALWAYS extract
- **Recommended Fixes** (best practices) → Extract if pattern appears 2+ times
- **Errors during fix application** → Extract to prevent future failures
- **User-requested learning** → Extract when explicitly asked

### Step 1: Analyze Applied Fixes

```bash
# === CONTINUOUS LEARNING INTEGRATION ===

echo ""
echo "=========================================="
echo "CONTINUOUS LEARNING ANALYSIS"
echo "=========================================="
echo ""

# Check if any critical or recommended fixes were applied
if [ -f "$DECISION_LOG" ]; then
  CRITICAL_FIXES=$(jq '[.[] | select(.category == "critical")] | length' "$DECISION_LOG" 2>/dev/null || echo "0")
  RECOMMENDED_FIXES=$(jq '[.[] | select(.category == "recommended")] | length' "$DECISION_LOG" 2>/dev/null || echo "0")
else
  CRITICAL_FIXES=0
  RECOMMENDED_FIXES=0
fi

echo "Critical fixes applied: $CRITICAL_FIXES"
echo "Recommended fixes applied: $RECOMMENDED_FIXES"
echo ""

# Generate learning extraction file
LEARNING_FILE="$SESSION_DIR/learnings_to_extract.json"
TOTAL_LEARNABLE=$((CRITICAL_FIXES + RECOMMENDED_FIXES))

if [ "$TOTAL_LEARNABLE" -gt 0 ]; then
  echo "Learnable patterns detected!"
  echo ""

  # Extract patterns from decision log
  if [ -f "$DECISION_LOG" ]; then
    jq '[.[] | select(.category == "critical" or .category == "recommended") | {
      problem: .comment_body,
      solution: .fix_applied,
      file_type: (.file_path | split(".") | last // "unknown"),
      category: .category,
      reasoning: .reasoning,
      file_path: .file_path
    }]' "$DECISION_LOG" > "$LEARNING_FILE" 2>/dev/null || echo "[]" > "$LEARNING_FILE"
  else
    echo "[]" > "$LEARNING_FILE"
  fi

  echo "Learning patterns saved to: $LEARNING_FILE"
  echo ""

  # Add learning summary to report
  echo "" >> "$REPORT_FILE"
  echo "---" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "## Continuous Learning" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Learnable Patterns Found:** $TOTAL_LEARNABLE" >> "$REPORT_FILE"
  echo "- Critical fixes: $CRITICAL_FIXES" >> "$REPORT_FILE"
  echo "- Recommended fixes: $RECOMMENDED_FIXES" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Patterns to Extract:" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  # List each learnable pattern
  if [ -f "$LEARNING_FILE" ]; then
    jq -r '.[] | "- **\(.category | ascii_upcase)**: \(.problem // "No description")[" + (.file_path // "unknown") + "]"' "$LEARNING_FILE" >> "$REPORT_FILE" 2>/dev/null
  fi

  echo "" >> "$REPORT_FILE"
  echo "Run \`/extract-learning \"patterns from MR #$MR_ID\"\` to save as reusable skills." >> "$REPORT_FILE"
else
  echo "No critical or recommended fixes - no learning extraction needed."
  echo "" >> "$REPORT_FILE"
  echo "## Continuous Learning" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "No learnable patterns identified (no critical or recommended fixes applied)." >> "$REPORT_FILE"
fi

echo ""
echo "=========================================="
echo "FIX ANALYSIS COMPLETE"
echo "=========================================="
echo ""
echo "Report saved to: $REPORT_FILE"
echo "Session assets: $SESSION_DIR"
echo "MR URL: $MR_URL"
```

### Step 2: Extract Learning Patterns

For each learnable pattern, determine the category and invoke the learning system:

**Category Detection:**
| Pattern Keywords | Category |
|------------------|----------|
| `any`, `casting`, `type`, `TypeScript`, `interface` | `typescript` |
| `useEffect`, `useState`, `hook`, `React`, `component` | `react` |
| `controller`, `service`, `repository`, `API`, `endpoint` | `backend` |
| `injection`, `XSS`, `secret`, `auth`, `security`, `OWASP` | `security` |
| `Docker`, `K8s`, `terraform`, `CI/CD`, `pipeline` | `devops` |
| Other patterns | `general` |

### Step 3: Invoke Learning Extraction

After the analysis is complete, use the **Skill tool** to invoke `/extract-learning`:

```markdown
Skill invocation:
  skill: "extract-learning"
  args: "patterns from MR #<MR_ID> - <brief description of fixes>"
```

This will:
1. Analyze the applied fixes from `$LEARNING_FILE`
2. Verify each pattern passes quality gates (verified solution, reusable, no sensitive data)
3. Save patterns as skills to `~/.claude/skills/learned/`
4. The `session-start.js` hook will load these in future sessions

### Step 4: Report Learning Results

Include in the final output:

```markdown
## Learning Feedback Loop

**Patterns Found:** [count]
**Skills Saved:**
- ~/.claude/skills/learned/typescript-[description].md
- ~/.claude/skills/learned/react-[description].md

**Impact:** These patterns will be automatically loaded in future sessions to prevent similar issues.
```

### Error-Based Learning

When a fix fails or encounters an error:

1. **Capture the error context:**
   - Error message
   - File path and line number
   - Attempted fix
   - Why it failed

2. **Create error prevention skill:**
   ```markdown
   # [Error Type] Prevention

   **Extracted:** YYYY-MM-DD
   **Source:** /gitlab-fix-comments (error during fix)
   **Type:** error-resolution
   **Category:** [category]

   ## Problem
   [Exact error message and context]

   ## Solution
   [What should be done instead]

   ## When to Use
   Trigger on similar error patterns
   ```

3. **Invoke improve-claude:**
   ```
   Skill invocation:
     skill: "improve-claude"
     args: "[category]: [rule to prevent this error] --save-skill"
   ```

This ensures that:
- Every error becomes a learning opportunity
- Future sessions can avoid the same mistakes
- The configuration continuously improves based on real-world usage
