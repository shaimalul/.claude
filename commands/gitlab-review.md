---
description: Automatically review GitLab MR, post draft comments, and generate report
argument-hint: <mr-url> [context]
allowed-tools: Bash, WebFetch, Task, TodoWrite, Write, Read
---

# GitLab Merge Request Review

## FULLY AUTOMATED WORKFLOW

This command runs **without any user prompts**. It will:
1. Fetch MR data and diffs
2. Analyze code using principal agents (frontend, security, bug-finder, etc.)
3. Post findings as draft comments on GitLab
4. Generate a comprehensive review report
5. Display the final summary with links

**Do NOT ask user questions during execution.** Proceed directly through all phases.

## MANDATORY OUTPUT

Every MR review MUST end with:
1. A `review-report.md` file saved in `~/.claude/gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/`
2. A clickable link displayed to the user: `[review-report.md](gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/review-report.md)`

Use the **Write** tool to create the comprehensive review report file.

## Prerequisites

1. Set your GitLab personal access token:
   ```bash
   export GITLAB_TOKEN='token'
   ```
2. Token MUST have **`api` scope** (not just `read_api`) to post draft review comments

3. **Important for private projects**: You must be a member of the project or its parent group.
   Even with a valid token, you cannot access private projects you're not a member of.

4. Paste the full MR URL (the command will extract project path and MR ID automatically)

I'll fetch and review the GitLab merge request from the provided URL.

Let me parse the URL and fetch the MR changes.

```bash
# Source secrets file if it exists
if [ -f "$HOME/.claude/.secrets" ]; then
  source "$HOME/.claude/.secrets"
fi

# Parse MR URL and optional context from arguments
ARGS="$ARGUMENTS"
MR_URL=$(echo "$ARGS" | awk '{print $1}')

if [ -z "$MR_URL" ]; then
  echo "Error: Missing MR URL"
  echo "Usage: /gitlab-review <mr-url> [context]"
  echo "Example: /gitlab-review https://gitlab.com/group/project/-/merge_requests/123"
  exit 1
fi

# Extract project path and MR ID using sed (more portable than BASH_REMATCH)
PROJECT_PATH=$(echo "$MR_URL" | sed -n 's|https://gitlab\.com/\(.*\)/-/merge_requests/.*|\1|p')
MR_ID=$(echo "$MR_URL" | sed -n 's|.*/-/merge_requests/\([0-9]*\).*|\1|p')

if [ -z "$PROJECT_PATH" ] || [ -z "$MR_ID" ]; then
  echo "Error: Invalid GitLab MR URL format"
  echo "Expected: https://gitlab.com/<project-path>/-/merge_requests/<mr-id>"
  echo "Got: $MR_URL"
  exit 1
fi

echo "Project Path: $PROJECT_PATH"
echo "MR ID: $MR_ID"

# Get numeric project ID from GitLab API
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

# Parse optional context (everything after the URL)
CONTEXT=$(echo "$ARGS" | awk '{$1=""; print $0}' | sed 's/^[[:space:]]*//')
if [ -n "$CONTEXT" ]; then
  echo "Review Context: $CONTEXT"
fi

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

# Use the project ID directly (no encoding needed)
ENCODED_PROJECT="$PROJECT_ID"

# Fetch MR data
API_URL="https://gitlab.com/api/v4/projects/$ENCODED_PROJECT/merge_requests/$MR_ID/changes?access_raw_diffs=true"
echo "Fetching MR data from: $API_URL"

# Save response to temporary file
TEMP_FILE="/tmp/gitlab_mr_${MR_ID}.json"

# Build curl command with optional token
CURL_CMD="curl -s -w %{http_code}"
if [ -n "$GITLAB_TOKEN" ]; then
  CURL_CMD="$CURL_CMD -H 'PRIVATE-TOKEN: $GITLAB_TOKEN'"
fi

HTTP_CODE=$(eval "$CURL_CMD '$API_URL' -o '$TEMP_FILE'")

echo "HTTP Response Code: $HTTP_CODE"

# Check if request was successful
if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch MR data (HTTP $HTTP_CODE)"

  if [ "$HTTP_CODE" = "401" ]; then
    echo "Authentication failed. Please check your GitLab token."
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "Project or MR not found. This could mean:"
    echo "- The project is private and your token doesn't have access"
    echo "- The MR ID is incorrect"
    echo "- The project ID is incorrect"
    echo ""
    echo "Ensure your token has 'read_api' scope for private projects."
    echo ""
    echo "You can find the project ID in GitLab project settings."
  fi

  if [ -s "$TEMP_FILE" ]; then
    echo "API Response:"
    jq -r '.message // .' "$TEMP_FILE" 2>/dev/null || cat "$TEMP_FILE"
  fi

  rm -f "$TEMP_FILE"
  exit 1
fi

# Check if response is valid JSON
if ! jq -e . "$TEMP_FILE" >/dev/null 2>&1; then
  echo "Error: Invalid JSON response from GitLab API"
  head -n 10 "$TEMP_FILE"
  rm -f "$TEMP_FILE"
  exit 1
fi

# Extract basic MR info
TITLE=$(jq -r '.title' "$TEMP_FILE")
DESCRIPTION=$(jq -r '.description // ""' "$TEMP_FILE")
STATE=$(jq -r '.state' "$TEMP_FILE")
AUTHOR=$(jq -r '.author.name' "$TEMP_FILE")
SOURCE_BRANCH=$(jq -r '.source_branch' "$TEMP_FILE")
TARGET_BRANCH=$(jq -r '.target_branch' "$TEMP_FILE")

# Extract diff_refs SHAs needed for draft note positioning
BASE_SHA=$(jq -r '.diff_refs.base_sha // empty' "$TEMP_FILE")
HEAD_SHA=$(jq -r '.diff_refs.head_sha // empty' "$TEMP_FILE")
START_SHA=$(jq -r '.diff_refs.start_sha // empty' "$TEMP_FILE")

if [ -z "$BASE_SHA" ] || [ -z "$HEAD_SHA" ] || [ -z "$START_SHA" ]; then
  echo "Warning: Could not extract diff_refs SHAs - inline comments may not work"
  echo "BASE_SHA: $BASE_SHA, HEAD_SHA: $HEAD_SHA, START_SHA: $START_SHA"
fi

# Validate token has 'api' scope by checking draft_notes endpoint
echo "Validating GitLab token permissions..."
DRAFT_CHECK_CODE=$(curl -s -w "%{http_code}" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/draft_notes" \
  -o /dev/null)

if [ "$DRAFT_CHECK_CODE" = "403" ]; then
  echo "Error: Token lacks 'api' scope. Draft notes require write access."
  echo "Please create a token with 'api' scope at:"
  echo "  GitLab → Settings → Access Tokens"
  exit 1
elif [ "$DRAFT_CHECK_CODE" != "200" ]; then
  echo "Warning: Could not verify draft_notes access (HTTP $DRAFT_CHECK_CODE)"
fi

echo ""
echo "=== Merge Request Summary ==="
echo "Title: $TITLE"
echo "Author: $AUTHOR"
echo "State: $STATE"
echo "Source: $SOURCE_BRANCH → Target: $TARGET_BRANCH"
echo "URL: $MR_URL"
echo ""

# Create assets directory for this review in the correct location
ASSETS_DIR="$HOME/.claude/gitlab-review-assets/mr_${MR_ID}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ASSETS_DIR/diffs"
DIFFS_DIR="$ASSETS_DIR/diffs"

echo "Creating review assets in: $ASSETS_DIR"

# Extract each changed file
jq -r '.changes[] | @base64' "$TEMP_FILE" | while read -r change_base64; do
  change=$(echo "$change_base64" | base64 -d)
  new_path=$(echo "$change" | jq -r '.new_path')
  old_path=$(echo "$change" | jq -r '.old_path')
  diff=$(echo "$change" | jq -r '.diff // ""')
  new_file=$(echo "$change" | jq -r '.new_file // false')
  deleted_file=$(echo "$change" | jq -r '.deleted_file // false')
  renamed_file=$(echo "$change" | jq -r '.renamed_file // false')

  if [ -n "$diff" ]; then
    # Save diff to file
    safe_filename=$(echo "$new_path" | tr '/' '_')
    echo "$diff" > "$DIFFS_DIR/${safe_filename}.diff"
    echo "Saved diff for: $new_path"

    # Save metadata about the file
    echo "{" > "$DIFFS_DIR/${safe_filename}.meta"
    echo "  \"new_path\": \"$new_path\"," >> "$DIFFS_DIR/${safe_filename}.meta"
    echo "  \"old_path\": \"$old_path\"," >> "$DIFFS_DIR/${safe_filename}.meta"
    echo "  \"new_file\": $new_file," >> "$DIFFS_DIR/${safe_filename}.meta"
    echo "  \"deleted_file\": $deleted_file," >> "$DIFFS_DIR/${safe_filename}.meta"
    echo "  \"renamed_file\": $renamed_file" >> "$DIFFS_DIR/${safe_filename}.meta"
    echo "}" >> "$DIFFS_DIR/${safe_filename}.meta"
  fi
done

# Optionally fetch full file content for new/modified files for better context
echo ""
echo "Fetching file contents for comprehensive analysis..."
FILES_DIR="$ASSETS_DIR/files"
mkdir -p "$FILES_DIR"

# Get the source branch SHA
SOURCE_SHA=$(jq -r '.sha' "$TEMP_FILE")

jq -r '.changes[] | select(.deleted_file != true) | .new_path' "$TEMP_FILE" | while read -r filepath; do
  safe_filename=$(echo "$filepath" | tr '/' '_')

  # Fetch the full file content from the source branch
  FILE_URL="https://gitlab.com/api/v4/projects/$ENCODED_PROJECT/repository/files/$(echo "$filepath" | jq -sRr @uri)/raw?ref=$SOURCE_SHA"

  # Try to fetch the file (it might fail for binary files or large files)
  FILE_RESPONSE=$(curl -s -w "\n%{http_code}" -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$FILE_URL" -o "$FILES_DIR/${safe_filename}.content" 2>/dev/null | tail -n1)

  if [ "$FILE_RESPONSE" = "200" ]; then
    echo "Fetched content for: $filepath"
  else
    # Clean up failed fetch
    rm -f "$FILES_DIR/${safe_filename}.content"
  fi
done

echo ""
echo "All diffs saved to: $DIFFS_DIR"

# Copy MR data to assets directory
cp "$TEMP_FILE" "$ASSETS_DIR/mr_data.json"

# Create initial review report file
REVIEW_FILE="$ASSETS_DIR/review.md"
echo "# GitLab Merge Request Review" > "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "**MR Title:** $TITLE" >> "$REVIEW_FILE"
echo "**Author:** $AUTHOR" >> "$REVIEW_FILE"
echo "**Date:** $(date)" >> "$REVIEW_FILE"
echo "**URL:** $MR_URL" >> "$REVIEW_FILE"
echo "**State:** $STATE" >> "$REVIEW_FILE"
echo "**Branch:** $SOURCE_BRANCH → $TARGET_BRANCH" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "## Description" >> "$REVIEW_FILE"
echo "$DESCRIPTION" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Add reviewer context if provided
if [ -n "$CONTEXT" ]; then
  echo "## Reviewer Context" >> "$REVIEW_FILE"
  echo "$CONTEXT" >> "$REVIEW_FILE"
  echo "" >> "$REVIEW_FILE"
fi

echo "Review assets created in: $ASSETS_DIR"
echo "Review report: $REVIEW_FILE"
```

## Phase 2: Agent-Based Analysis (Automated)

After fetching MR data, **immediately** spawn specialist agents **IN PARALLEL** for comprehensive review. Do NOT wait for user confirmation.

### Review Comment Format

Use the team's code review prefix format. **DO NOT post positive/complimentary comments** - only actionable feedback:

- `[Blocker]` - MR won't be approved without fixing this - breaks coding principals
- `[Nice to have]` - Not a blocker but better if changed (e.g., function could be split for readability)
- `[Suggestion]` - Opinionated preference (e.g., types vs enums, forEach vs map)
- `[Need to check]` - Something looks weird, worth checking/testing/explaining
- `[Question]` - Needs clarification or explanation

**Comment style:**
- Sound natural and human, not robotic
- Keep it concise and professional
- Relaxed grammar is fine if it improves flow
- Skip the emojis
- **DO NOT repeat what the code is doing** - the comment is attached to the line, so context is already visible
- Jump straight to the actionable feedback

### Findings JSON structure

```json
{
  "type": "inline",
  "prefix": "[Suggestion]",
  "file_path": "src/foo.ts",
  "code_pattern": "return variant as SomeType",
  "comment": "Type guard would make the intent clearer here."
}
```

**IMPORTANT - code_pattern field:**
- Copy the EXACT code snippet from the diff that you're commenting on (5-50 chars)
- Use a unique snippet that appears only once in the file
- If code appears multiple times, include more context to make it unique
- Line numbers will be calculated automatically from code_pattern - do NOT guess them

**Bad vs Good examples:**
- Bad: `[Suggestion] Duration conversion logic - could extract to a constant`
- Good: `[Suggestion] Could extract to a named constant for clarity.`

### Launch ALL Principal Agents in Parallel

Based on the file types in the MR, spawn the relevant agents using **multiple Task tool calls in a single message**:

**1. Frontend Principal** (if `.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.scss` files):
```
subagent_type: frontend-principal
prompt: |
  Review this GitLab MR for React/TypeScript issues.

  Assets: $ASSETS_DIR
  Diffs: $DIFFS_DIR/*.diff
  Full files: $FILES_DIR
  Findings file: $FINDINGS_FILE

  Use skills: react-component, typescript-types, refactoring-patterns, testing-patterns

  Review for:
  - React hooks usage and patterns
  - TypeScript best practices (no `any`, proper typing)
  - Component structure and modularity
  - Performance (useMemo, useCallback usage)
  - CLAUDE.md compliance

  OUTPUT FORMAT - Use code_pattern instead of line_number:
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on",
    "comment": "Your feedback here."
  }

  RULES:
  - code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
  - Use a unique snippet that appears only once in the file
  - If code appears multiple times, include more context to make it unique
  - DO NOT include line_number - it will be calculated automatically from code_pattern
  - Keep comments concise and natural-sounding
  - DO NOT describe what the code does - jump straight to the feedback
```

**2. Backend Principal** (if service/api/controller/repository files):
```
subagent_type: backend-principal
prompt: |
  Review this GitLab MR for backend/API issues.

  Assets: $ASSETS_DIR
  Diffs: $DIFFS_DIR/*.diff
  Findings file: $FINDINGS_FILE

  Use skills: backend-patterns, api-design, database-patterns

  Review for:
  - Three-layer architecture (Controller → Service → Repository)
  - API design patterns
  - Error handling
  - Database query optimization
  - Input validation

  OUTPUT FORMAT - Use code_pattern instead of line_number:
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on",
    "comment": "Your feedback here."
  }

  RULES:
  - code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
  - Use a unique snippet that appears only once in the file
  - If code appears multiple times, include more context to make it unique
  - DO NOT include line_number - it will be calculated automatically from code_pattern
  - Keep comments concise and natural-sounding
  - DO NOT describe what the code does - jump straight to the feedback
```

**3. Security Principal** (always run):
```
subagent_type: security-principal
prompt: |
  Review this GitLab MR for security vulnerabilities.

  Assets: $ASSETS_DIR
  Diffs: $DIFFS_DIR/*.diff
  Findings file: $FINDINGS_FILE

  Use skills: security-patterns

  Review for:
  - OWASP Top 10 vulnerabilities
  - Hardcoded secrets/tokens/passwords
  - Input validation and sanitization
  - Authentication/authorization issues
  - SQL injection, XSS, CSRF risks

  OUTPUT FORMAT - Use code_pattern instead of line_number:
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on",
    "comment": "Your feedback here."
  }

  RULES:
  - code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
  - Use a unique snippet that appears only once in the file
  - If code appears multiple times, include more context to make it unique
  - DO NOT include line_number - it will be calculated automatically from code_pattern
  - Keep comments concise and natural-sounding
  - DO NOT describe what the code does - jump straight to the feedback
```

**4. Architect Principal** (if significant structural changes):
```
subagent_type: architect-principal
prompt: |
  Review this GitLab MR for architecture concerns.

  Assets: $ASSETS_DIR
  Diffs: $DIFFS_DIR/*.diff
  Findings file: $FINDINGS_FILE

  Use skills: architect

  Review for:
  - Module boundaries and coupling
  - Design patterns usage
  - Scalability concerns
  - Code organization

  OUTPUT FORMAT - Use code_pattern instead of line_number:
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on",
    "comment": "Your feedback here."
  }

  RULES:
  - code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
  - Use a unique snippet that appears only once in the file
  - If code appears multiple times, include more context to make it unique
  - DO NOT include line_number - it will be calculated automatically from code_pattern
  - Keep comments concise and natural-sounding
  - DO NOT describe what the code does - jump straight to the feedback
```

**5. Bug Finder** (always run):
```
subagent_type: bug-finder
prompt: |
  Analyze this GitLab MR for potential bugs.

  Assets: $ASSETS_DIR
  Diffs: $DIFFS_DIR/*.diff
  Findings file: $FINDINGS_FILE

  Use skills: find-bug

  Look for:
  - Logic errors
  - Edge cases not handled
  - Race conditions
  - Null/undefined risks
  - Off-by-one errors

  OUTPUT FORMAT - Use code_pattern instead of line_number:
  {
    "type": "inline",
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on",
    "comment": "Your feedback here."
  }

  RULES:
  - code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
  - Use a unique snippet that appears only once in the file
  - If code appears multiple times, include more context to make it unique
  - DO NOT include line_number - it will be calculated automatically from code_pattern
  - Keep comments concise and natural-sounding
  - DO NOT describe what the code does - jump straight to the feedback
```

### Example: Launching Agents in Parallel

```markdown
I'll spawn the following agents in parallel using multiple Task tool calls:
1. frontend-principal - for React/TypeScript review
2. security-principal - for security vulnerabilities
3. bug-finder - for potential bugs

[Use Task tool 3 times in single message with the prompts above]
```

Now I'll process the changes and run the analysis:

```bash
# Count changed files
CHANGED_FILES=$(jq -r '.changes | length' "$TEMP_FILE")
echo "Total files changed: $CHANGED_FILES"

# Analyze file types
echo ""
echo "=== File Types Changed ==="
jq -r '.changes[].new_path' "$TEMP_FILE" | while read -r file; do
  ext="${file##*.}"
  echo "$ext"
done | sort | uniq -c | sort -rn
```

I'll now perform a comprehensive code review using specialized analysis agents.

First, let me continue the analysis in the review report:

```bash
# Continue analysis in the review report
echo "## Code Review Analysis" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "Review started at: $(date)" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
```

I'll examine the changes using multiple specialized agents:

## Security Analysis

Checking for:

- Credential exposure and hardcoded secrets
- Input validation vulnerabilities
- SQL injection, XSS, and other security flaws
- Authentication and authorization issues

## Performance Analysis

Examining:

- Database query efficiency
- Memory usage patterns
- Algorithmic complexity
- Resource bottlenecks

## Code Quality Analysis

Reviewing:

- Code complexity and maintainability
- Error handling patterns
- Test coverage implications
- Adherence to project conventions

## Architecture Analysis

Assessing:

- Layer separation and boundaries
- Dependency direction
- Scalability patterns
- Design pattern usage

````bash
# Generate a summary of changes for focused analysis
echo "### Change Summary" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
jq -r '.changes[] | "- **\(.new_path)**: +\(.added_lines)/-\(.removed_lines) lines"' "$TEMP_FILE" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Create a detailed analysis file with accurate line numbers
ANALYSIS_FILE="$ASSETS_DIR/detailed_analysis.md"
echo "# Detailed Code Analysis" > "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"

# Process each diff to extract line numbers and code snippets
for diff_file in "$DIFFS_DIR"/*.diff; do
  if [ -f "$diff_file" ]; then
    filename=$(basename "$diff_file" .diff | tr '_' '/')
    echo "## File: $filename" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"

    # Create a structured JSON file with all changes for this file
    CHANGES_JSON="$ASSETS_DIR/changes_${filename//\//_}.json"

    # Parse diff to extract hunks with accurate line numbers
    awk -v filename="$filename" -v json_file="$CHANGES_JSON" '
      BEGIN {
        print "[" > json_file
        first = 1
      }
      /^@@/ {
        # Extract line numbers from hunk header
        match($0, /@@.*-([0-9]+),?([0-9]*) \+([0-9]+),?([0-9]*)/, nums)
        old_start = nums[1]
        old_count = (nums[2] == "" ? 1 : nums[2])
        new_start = nums[3]
        new_count = (nums[4] == "" ? 1 : nums[4])

        if (!first) print "," > json_file
        first = 0

        print "### Change at lines " new_start "-" (new_start + new_count - 1)
        print ""
        print "```diff"

        # Collect the diff content and track specific line numbers
        diff_content = ""
        current_new_line = new_start
        added_lines = ""
        getline
        while ($0 !~ /^@@/ && NF >= 0) {
          print $0
          diff_content = diff_content $0 "\n"

          # Track line numbers for added/modified lines
          if (substr($0, 1, 1) == "+") {
            if (added_lines != "") added_lines = added_lines ","
            added_lines = added_lines current_new_line
            current_new_line++
          } else if (substr($0, 1, 1) != "-") {
            current_new_line++
          }

          if (getline <= 0) break
        }
        print "```"
        print ""

        # Write to JSON with added line numbers
        gsub(/"/, "\\\"", diff_content)
        gsub(/\n/, "\\n", diff_content)
        printf "  {\"file\": \"%s\", \"start_line\": %d, \"end_line\": %d, \"added_lines\": \"%s\", \"diff\": \"%s\"}",
               filename, new_start, new_start + new_count - 1, added_lines, diff_content > json_file
      }
      END {
        print "\n]" > json_file
      }
    ' "$diff_file" >> "$ANALYSIS_FILE"
  fi
done

# Create a master changes file
echo "Creating master changes file..."
MASTER_CHANGES="$ASSETS_DIR/all_changes.json"
echo "[" > "$MASTER_CHANGES"
first=1
for json_file in "$ASSETS_DIR"/changes_*.json; do
  if [ -f "$json_file" ] && [ "$json_file" != "$MASTER_CHANGES" ]; then
    if [ $first -eq 0 ]; then
      echo "," >> "$MASTER_CHANGES"
    fi
    first=0
    # Remove the surrounding brackets and append
    sed '1d;$d' "$json_file" >> "$MASTER_CHANGES"
  fi
done
echo "]" >> "$MASTER_CHANGES"

# Identify high-risk file patterns
echo "### High-Risk Areas" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Check for security-sensitive files
echo "#### Security-sensitive files:" >> "$REVIEW_FILE"
SECURITY_FILES=$(jq -r '.changes[].new_path' "$TEMP_FILE" | grep -E "(auth|security|token|password|secret|config|env)" || echo "")
if [ -n "$SECURITY_FILES" ]; then
  echo "$SECURITY_FILES" | while read -r file; do
    echo "- $file" >> "$REVIEW_FILE"
  done
else
  echo "- No obvious security-sensitive files detected" >> "$REVIEW_FILE"
fi
echo "" >> "$REVIEW_FILE"

# Check for database/query files
echo "#### Database-related files:" >> "$REVIEW_FILE"
DB_FILES=$(jq -r '.changes[].new_path' "$TEMP_FILE" | grep -E "(query|sql|database|db|migration)" || echo "")
if [ -n "$DB_FILES" ]; then
  echo "$DB_FILES" | while read -r file; do
    echo "- $file" >> "$REVIEW_FILE"
  done
else
  echo "- No database files detected" >> "$REVIEW_FILE"
fi
echo "" >> "$REVIEW_FILE"

# Save file type analysis
echo "#### File Types Changed:" >> "$REVIEW_FILE"
jq -r '.changes[].new_path' "$TEMP_FILE" | while read -r file; do
  ext="${file##*.}"
  echo "$ext"
done | sort | uniq -c | sort -rn | while read -r count ext; do
  echo "- $ext: $count files" >> "$REVIEW_FILE"
done
echo "" >> "$REVIEW_FILE"
````

Now I'll analyze each changed file systematically using the saved diffs.

```bash
echo "### Detailed Analysis" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "Analyzing $(ls -1 $DIFFS_DIR | wc -l) changed files..." >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Create a summary at the end
echo "" >> "$REVIEW_FILE"
echo "---" >> "$REVIEW_FILE"
echo "## Review Summary" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "Review completed at: $(date)" >> "$REVIEW_FILE"
echo "All review assets saved to: $ASSETS_DIR" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Clean up temporary file
rm -f "$TEMP_FILE"

# Display final paths
echo ""
echo "=== Review Assets Created ==="
echo "📁 Main review report: $REVIEW_FILE"
echo "📊 Detailed analysis: $ANALYSIS_FILE"
echo "📝 Diff files: $DIFFS_DIR"
echo "🗂️  Full files: $FILES_DIR"
echo "📋 MR data: $ASSETS_DIR/mr_data.json"
echo "🔍 All changes: $MASTER_CHANGES"
echo ""
echo "To view the review report: cat $REVIEW_FILE"
echo "To see detailed analysis: cat $ANALYSIS_FILE"

# Export the paths for the Task agent to use
export GITLAB_REVIEW_ASSETS_DIR="$ASSETS_DIR"
export GITLAB_REVIEW_FILE="$REVIEW_FILE"
export GITLAB_ANALYSIS_FILE="$ANALYSIS_FILE"
export GITLAB_REVIEW_CONTEXT="$CONTEXT"
```

Now I'll perform comprehensive code analysis using specialized agents.

I'll analyze the merge request data and diffs to provide:

1. **Accurate Line Numbers**: Extract from diff hunk headers (@@ -old,count +new,count @@)
2. **Code Context**: Include actual changed code snippets before each recommendation
3. **Comprehensive Analysis**: Use multiple specialized agents for thorough review

The analysis will examine:

- Security vulnerabilities with exact locations
- Performance bottlenecks with code snippets
- Code quality issues with specific examples
- Architecture concerns with file references

**Reviewer Context (if provided):** The reviewer has provided specific context or focus areas for this MR. Pay special attention to any areas mentioned in the context when performing the analysis.

Each finding will include:

- **Location**: Exact file path and line numbers (e.g., `file.ts:15-25`)
- **Changed Code**: The actual code snippet being reviewed
- **Issue Description**: What the problem is and why it matters
- **Recommendation**: Specific fix with example code
- **Severity**: Critical, High, Medium, or Low

Proceeding with automated analysis, draft posting, and report generation.

````bash
# Perform comprehensive code review analysis
echo "## 🔍 Code Review: Detailed Analysis" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Function to extract line numbers from diff hunk header
extract_line_numbers() {
  local hunk_header="$1"
  echo "$hunk_header" | sed -n 's/@@ -[0-9]*,[0-9]* +\([0-9]*\),\([0-9]*\) @@.*/\1 \2/p'
}

# Analyze each diff file with accurate line tracking
for diff_file in "$DIFFS_DIR"/*.diff; do
  if [ -f "$diff_file" ]; then
    filename=$(basename "$diff_file" .diff | tr '_' '/')

    echo "### File: \`$filename\`" >> "$REVIEW_FILE"
    echo "" >> "$REVIEW_FILE"

    # Read the diff and extract hunks with line numbers
    current_line=0
    in_hunk=false
    hunk_start=0
    hunk_content=""

    while IFS= read -r line; do
      if [[ "$line" =~ ^@@ ]]; then
        # New hunk found, process previous if exists
        if [ "$in_hunk" = true ] && [ -n "$hunk_content" ]; then
          # Analyze the hunk content
          if echo "$hunk_content" | grep -q "GET_MULTI_THREAD_MESSAGE_DELAY\|MAXIMUM_NUMBER_OF_MULTI_THREAD"; then
            echo "#### 🔴 HIGH IMPACT: Aggressive Polling Configuration" >> "$REVIEW_FILE"
            echo "**Location**: \`$filename:$hunk_start-$((current_line-1))\`" >> "$REVIEW_FILE"
            echo "**Changed Code**:" >> "$REVIEW_FILE"
            echo '```diff' >> "$REVIEW_FILE"
            echo "$hunk_content" >> "$REVIEW_FILE"
            echo '```' >> "$REVIEW_FILE"
            echo "**Issue**: 180 API requests over 15 minutes (5s intervals) can overwhelm the backend" >> "$REVIEW_FILE"
            echo "**Impact**: Multiple concurrent users could cause DoS conditions" >> "$REVIEW_FILE"
            echo "**Recommendation**:" >> "$REVIEW_FILE"
            echo '```typescript' >> "$REVIEW_FILE"
            echo '// Implement exponential backoff' >> "$REVIEW_FILE"
            echo 'const getPollingInterval = (attempt: number) => {' >> "$REVIEW_FILE"
            echo '  const base = 5000; // 5 seconds' >> "$REVIEW_FILE"
            echo '  const max = 30000; // 30 seconds max' >> "$REVIEW_FILE"
            echo '  return Math.min(base * Math.pow(1.5, attempt), max);' >> "$REVIEW_FILE"
            echo '};' >> "$REVIEW_FILE"
            echo '```' >> "$REVIEW_FILE"
            echo "" >> "$REVIEW_FILE"
          fi

          if echo "$hunk_content" | grep -q "useEffect.*numberOfGetMessage"; then
            echo "#### 🚨 CRITICAL: React Hook Dependency Issue" >> "$REVIEW_FILE"
            echo "**Location**: \`$filename:$hunk_start-$((current_line-1))\`" >> "$REVIEW_FILE"
            echo "**Changed Code**:" >> "$REVIEW_FILE"
            echo '```diff' >> "$REVIEW_FILE"
            echo "$hunk_content" | grep -A5 -B5 "useEffect" >> "$REVIEW_FILE"
            echo '```' >> "$REVIEW_FILE"
            echo "**Issue**: \`numberOfGetMessage\` used in useEffect but missing from dependency array" >> "$REVIEW_FILE"
            echo "**Impact**: Stale closure bugs - the effect won't update when numberOfGetMessage changes" >> "$REVIEW_FILE"
            echo "**Recommendation**: Add \`numberOfGetMessage\` to the dependency array" >> "$REVIEW_FILE"
            echo "" >> "$REVIEW_FILE"
          fi
        fi

        # Parse new hunk header
        line_info=$(echo "$line" | sed -n 's/@@ -[0-9]*,[0-9]* +\([0-9]*\),\([0-9]*\) @@.*/\1 \2/p')
        hunk_start=$(echo "$line_info" | cut -d' ' -f1)
        current_line=$hunk_start
        hunk_content=""
        in_hunk=true
      elif [ "$in_hunk" = true ]; then
        hunk_content="${hunk_content}${line}\n"
        if [[ "$line" =~ ^\+ ]]; then
          ((current_line++))
        elif [[ ! "$line" =~ ^- ]]; then
          ((current_line++))
        fi
      fi
    done < "$diff_file"

    echo "" >> "$REVIEW_FILE"
  fi
done

echo "## Summary of Findings" >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"
echo "Analysis completed. Review the findings above for detailed recommendations." >> "$REVIEW_FILE"
echo "" >> "$REVIEW_FILE"

# Save the paths to a temporary file for the Task agent
PATHS_FILE="/tmp/gitlab_review_paths_${MR_ID}.txt"
echo "ASSETS_DIR=$ASSETS_DIR" > "$PATHS_FILE"
echo "REVIEW_FILE=$REVIEW_FILE" >> "$PATHS_FILE"
echo "ANALYSIS_FILE=$ANALYSIS_FILE" >> "$PATHS_FILE"
echo "DIFFS_DIR=$DIFFS_DIR" >> "$PATHS_FILE"
echo "FILES_DIR=$FILES_DIR" >> "$PATHS_FILE"
echo "MASTER_CHANGES=$MASTER_CHANGES" >> "$PATHS_FILE"
echo "PROJECT_ID=$PROJECT_ID" >> "$PATHS_FILE"
echo "MR_ID=$MR_ID" >> "$PATHS_FILE"
echo "MR_URL=$MR_URL" >> "$PATHS_FILE"
echo "BASE_SHA=$BASE_SHA" >> "$PATHS_FILE"
echo "HEAD_SHA=$HEAD_SHA" >> "$PATHS_FILE"
echo "START_SHA=$START_SHA" >> "$PATHS_FILE"
echo "GITLAB_TOKEN=$GITLAB_TOKEN" >> "$PATHS_FILE"

# Create findings JSON file for structured output
FINDINGS_FILE="$ASSETS_DIR/findings.json"
echo "[]" > "$FINDINGS_FILE"
echo "FINDINGS_FILE=$FINDINGS_FILE" >> "$PATHS_FILE"

echo ""
echo "=== ANALYSIS COMPLETE ==="
echo ""
echo "Review saved to: $REVIEW_FILE"
echo "Detailed analysis saved to: $ANALYSIS_FILE"
echo ""
echo "----------------------------------------"
echo "DISPLAYING COMPLETE REVIEW:"
echo "----------------------------------------"
echo ""

# Display the complete review
cat "$REVIEW_FILE"

echo ""
echo "----------------------------------------"
echo "To view this review again:"
echo "cat $REVIEW_FILE"
echo ""
echo "All review assets are in:"
echo "$ASSETS_DIR"
````

Example format for each finding:

````markdown
### 🔴 HIGH IMPACT: [Issue Title]

**File**: `path/to/file.ts:15-25`
**Changed Code**:

```diff
@@ -15,5 +15,10 @@
 const TIMEOUT = 2000;
+const GET_MULTI_THREAD_DELAY = 5000;
+const MAX_ATTEMPTS = 180; // 15 minutes of polling
```
````

**Issue**: Extended polling creates potential for resource exhaustion
**Impact**: Multiple concurrent users could overwhelm backend with 180 requests each
**Recommendation**:

```typescript
// Implement exponential backoff
const getPollingInterval = (attempt: number) => {
  return Math.min(5000 * Math.pow(1.5, attempt), 30000);
};
```

```

## Detecting Which Agents to Run

```bash
# Detect file types to determine which agents to spawn
HAS_FRONTEND=false
HAS_BACKEND=false
HAS_TESTS=false
HAS_CONFIG=false

FILE_TYPES=$(jq -r '.changes[].new_path' "$TEMP_FILE")

if echo "$FILE_TYPES" | grep -qE "\.(tsx?|jsx?)$"; then
  HAS_FRONTEND=true
  echo "✓ Detected React/TypeScript files - will run frontend-principal"
fi

if echo "$FILE_TYPES" | grep -qE "(service|controller|repository|api|handler)\.(ts|js)$"; then
  HAS_BACKEND=true
  echo "✓ Detected backend files - will run backend-principal"
fi

if echo "$FILE_TYPES" | grep -qE "\.(spec|test)\.(ts|tsx|js|jsx)$"; then
  HAS_TESTS=true
  echo "✓ Detected test files - will check testing patterns"
fi

if echo "$FILE_TYPES" | grep -qE "(Dockerfile|docker-compose|\.yml|\.yaml|terraform|\.tf)$"; then
  HAS_CONFIG=true
  echo "✓ Detected config/infra files - will run devops-principal"
fi

# Always run security-principal and bug-finder
echo "✓ Running security-principal (always)"
echo "✓ Running bug-finder (always)"
```

Now I'll spawn the relevant agents **IN PARALLEL** using multiple Task tool calls in a single message.

**IMPORTANT:** Launch agents based on detected file types:
- **Always run:** security-principal, bug-finder
- **If frontend files:** frontend-principal
- **If backend files:** backend-principal
- **If significant changes:** architect-principal
- **If infra/config files:** devops-principal

## Phase 3: Post Draft Notes to GitLab (Automated)

After analysis is complete and findings are saved to `$FINDINGS_FILE`, **immediately** post them as draft notes. Do NOT ask user for confirmation:

```bash
# Source the paths file to get all variables
source "/tmp/gitlab_review_paths_${MR_ID}.txt"

# Function to post a draft note to GitLab
post_draft_note() {
  local note="$1"
  local file_path="$2"
  local line_number="$3"

  # URL-encode the note content
  local encoded_note=$(printf '%s' "$note" | jq -sRr @uri)

  if [ -n "$file_path" ] && [ -n "$line_number" ] && [ "$line_number" != "null" ]; then
    # Inline comment on a specific line
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
    # General comment (not on a specific line)
    RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
      --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
      --url "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/draft_notes" \
      --data-urlencode "note=$note")
  fi

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$HTTP_CODE" = "201" ]; then
    return 0
  else
    echo "Warning: Failed to post draft note (HTTP $HTTP_CODE)"
    return 1
  fi
}

# Read findings and post each as a draft note
echo ""
echo "=== Posting Draft Notes to GitLab ==="

# Calculate line numbers from code patterns using Python
echo "Calculating line numbers from code patterns..."

export ASSETS_DIR
python3 << 'PYTHON_EOF'
import json
import re
import os

assets_dir = os.environ.get('ASSETS_DIR', '')
diffs_dir = os.path.join(assets_dir, 'diffs')
findings_file = os.path.join(assets_dir, 'findings.json')

def find_line_in_diff(diff_content, pattern):
    """Find the new file line number for a code pattern in a diff."""
    if not pattern or not pattern.strip():
        return None

    current_new_line = 0
    pattern_clean = pattern.strip()

    for line in diff_content.split('\n'):
        # Parse hunk header: @@ -old,count +new,count @@
        if line.startswith('@@'):
            match = re.search(r'\+(\d+)', line)
            if match:
                current_new_line = int(match.group(1))
            continue

        # Skip deleted lines (don't exist in new file)
        if line.startswith('-') and not line.startswith('---'):
            continue

        # Check if this line contains the pattern
        line_content = line[1:] if line.startswith('+') or line.startswith(' ') else line
        if pattern_clean in line_content:
            return current_new_line

        # Increment line counter for added/context lines
        if line.startswith('+') or line.startswith(' ') or (not line.startswith('-') and not line.startswith('\\') and not line.startswith('@@')):
            current_new_line += 1

    return None

# Load findings
try:
    with open(findings_file, 'r') as f:
        findings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    findings = []

# Process each finding
updated_findings = []
for finding in findings:
    file_path = finding.get('file_path', '')
    code_pattern = finding.get('code_pattern', '')

    # Skip if no file path
    if not file_path:
        updated_findings.append(finding)
        continue

    # Read the diff file
    safe_filename = file_path.replace('/', '_') + '.diff'
    diff_file = os.path.join(diffs_dir, safe_filename)

    if not os.path.exists(diff_file):
        print(f"  ⚠ Diff not found for {file_path}")
        finding['line_number'] = None
        updated_findings.append(finding)
        continue

    with open(diff_file, 'r') as f:
        diff_content = f.read()

    # Find line number from code pattern
    line_number = find_line_in_diff(diff_content, code_pattern)

    if line_number:
        pattern_preview = code_pattern[:30] + '...' if len(code_pattern) > 30 else code_pattern
        print(f"  ✓ Found '{pattern_preview}' at line {line_number}")
        finding['line_number'] = line_number
    else:
        pattern_preview = code_pattern[:40] + '...' if len(code_pattern) > 40 else code_pattern
        print(f"  ⚠ Pattern not found: '{pattern_preview}'")
        finding['line_number'] = None

    updated_findings.append(finding)

# Save updated findings
with open(findings_file, 'w') as f:
    json.dump(updated_findings, f, indent=2)

print(f"\nProcessed {len(updated_findings)} findings")
PYTHON_EOF

# Deduplicate findings by file_path + code_pattern
echo "Deduplicating findings..."
ORIGINAL_COUNT=$(jq 'length' "$FINDINGS_FILE")
UNIQUE_FINDINGS=$(jq 'unique_by(.file_path + ":" + (.code_pattern // ""))' "$FINDINGS_FILE")
echo "$UNIQUE_FINDINGS" > "$FINDINGS_FILE"
FINDINGS_COUNT=$(jq 'length' "$FINDINGS_FILE")
echo "Deduplicated: $ORIGINAL_COUNT → $FINDINGS_COUNT findings"

POSTED_COUNT=0

if [ "$FINDINGS_COUNT" -gt 0 ]; then
  jq -c '.[]' "$FINDINGS_FILE" | while read -r finding; do
    prefix=$(echo "$finding" | jq -r '.prefix // "[Suggestion]"')
    comment=$(echo "$finding" | jq -r '.comment // ""')
    file_path=$(echo "$finding" | jq -r '.file_path // ""')
    line_number=$(echo "$finding" | jq -r '.line_number // ""')
    code_pattern=$(echo "$finding" | jq -r '.code_pattern // ""')

    # Validate file exists in diff - if not, post as general comment
    if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
      safe_filename=$(echo "$file_path" | tr '/' '_')
      diff_file="$DIFFS_DIR/${safe_filename}.diff"
      if [ ! -f "$diff_file" ]; then
        echo "  ⚠ File not in diff: $file_path - posting as general comment"
        file_path=""
        line_number=""
      fi
    fi

    # If line_number is null or empty, post as general comment with file/code context
    if [ "$line_number" = "null" ] || [ -z "$line_number" ]; then
      if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
        if [ -n "$code_pattern" ] && [ "$code_pattern" != "null" ]; then
          note="$prefix **File**: \`$file_path\`
**Code**: \`$code_pattern\`

$comment"
        else
          note="$prefix **File**: \`$file_path\`

$comment"
        fi
        echo "  → Posting as general comment (pattern not found in diff)"
        file_path=""
        line_number=""
      else
        note="$prefix $comment"
      fi
    else
      # Build the comment with prefix for inline note
      note="$prefix $comment"
    fi

    if post_draft_note "$note" "$file_path" "$line_number"; then
      if [ -n "$file_path" ] && [ -n "$line_number" ]; then
        echo "  ✓ Posted inline: $prefix ($file_path:$line_number)"
      else
        echo "  ✓ Posted general: $prefix"
      fi
      POSTED_COUNT=$((POSTED_COUNT + 1))
    fi

    # Small delay to avoid rate limiting
    sleep 0.1
  done

  echo ""
  echo "Posted $POSTED_COUNT draft notes to GitLab"
  echo ""
  echo "→ Review your pending comments at the MR page"
  echo ""
  echo "When ready, click 'Submit review' in GitLab to publish all comments."
else
  echo "No findings to post as draft notes."
fi
```

## Phase 4: Generate Report (Automated)

After all analysis is complete, **immediately** generate the report without asking:

1. **MANDATORY**: Generate a comprehensive `review-report.md` file in the assets directory with the full review
2. **MANDATORY**: Save all findings to `$FINDINGS_FILE` as JSON array for draft note posting
3. Display a clickable link to the report

The review report MUST include these sections:
- MR metadata table (title, author, state, branch, URL, files changed, review date)
- Summary of changes
- Findings grouped by prefix: [Blocker], [Nice to have], [Suggestion], [Need to check], [Question]
- Final verdict (APPROVE / REQUEST CHANGES / NEEDS DISCUSSION)

**Note:** Do NOT include positive/complimentary comments - only actionable feedback.

**IMPORTANT**: Always end with:
1. A clickable markdown link to the report file
2. The full absolute path for easy access
3. A Finder command to open the folder
4. Summary of draft notes posted to GitLab
5. Direct link to review pending comments in GitLab

Example output:
```
📋 **Review Report**: [review-report.md](gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/review-report.md)

📂 **Full path**: `~/.claude/gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/review-report.md`

🔍 **Open in Finder**: Run `open ~/.claude/gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/`

---

✅ **Draft Notes Posted**: 5 findings posted as pending review comments

🔗 **Review in GitLab**: https://gitlab.com/<project>/-/merge_requests/<MR_ID>

💡 Click "Submit review" in GitLab to publish all comments, or edit/delete individual comments first.
```

The link format must be relative from the workspace root so it's clickable in VSCode. The full path allows users to copy/paste it, and the Finder command lets them quickly navigate to the folder.

---

## Phase 5: Learning Feedback Loop

After generating the review report, execute the learning feedback loop.

### Step 1: Extract Learnable Patterns

From your posted draft comments, identify all findings with these prefixes:
- `[Blocker]` - Critical issues (MUST learn from these)
- `[Nice to have]` - Important improvements (SHOULD learn from these)

Skip `[Suggestion]`, `[Need to check]`, `[Question]`, and project-specific bugs.

### Step 2: For Each Learnable Pattern, Invoke improve-claude

For each `[Blocker]` or `[Nice to have]` finding:

1. **Determine the category** based on the finding content:
   - Keywords `any`, `casting`, `type`, `TypeScript` → category: `typescript-types`
   - Keywords `useEffect`, `useState`, `hook`, `React`, `component` → category: `react-component`
   - Keywords `controller`, `service`, `repository`, `layer` → category: `backend-patterns`
   - Keywords `injection`, `XSS`, `secret`, `auth`, `security` → category: `security-patterns`
   - Other patterns → category: `general`

2. **Check if the rule already exists** by searching CLAUDE.md for similar rules. Skip if already covered.

3. **Invoke the Skill tool** with:
   - skill: `improve-claude`
   - args: `[category]: [concise rule description] - learned from MR #[MR_IID]`

### Step 3: Update Learning History

After invoking improve-claude for all learnable patterns, append a new entry to `~/.claude/learning-history.md` using the Edit tool.

Use this format (replace placeholders with actual values):

```
### [YYYY-MM-DD] - GitLab MR #[MR_IID]: [MR_TITLE]

**Source:** /gitlab-review
**URL:** [MR_WEB_URL]

**Patterns Learned:**
- [category]: [rule description]
- [category]: [rule description]

---
```

If no learnable patterns were found (no `[Blocker]` or `[Nice to have]` findings), skip this step.

### Step 4: Report Learning Results

Include in your final output to the user:

```
## Learning Feedback Loop

**Patterns Found:** [count]
**Rules Applied:** [list of rules added via improve-claude]

Learning history updated: ~/.claude/learning-history.md
```

If no patterns were learned, report: "No learnable patterns identified in this review (no Blocker or Nice-to-have findings)."
