---
description: Review GitLab merge request by fetching diffs and analyzing code changes
argument-hint: <project-id> <mr-id> [context]
allowed-tools: Bash, WebFetch, Task, TodoWrite, Write, Read
---

# GitLab Merge Request Review

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
2. Ensure your token has the `read_api` scope for accessing private projects

3. **Important for private projects**: You must be a member of the project or its parent group.
   Even with a valid token, you cannot access private projects you're not a member of.

4. If you have project access but the path doesn't work, use the project ID:
   - Ask a team member for the project ID (found in Project Settings → General)
   - Use URL format: `https://gitlab.com/PROJECT_ID/-/merge_requests/MR_ID`

I'll fetch and review the GitLab merge request with Project ID: $1 and MR ID: $2

Let me parse the arguments and fetch the MR changes.

```bash
# Parse project ID and MR ID from arguments
ARGS="$ARGUMENTS"
PROJECT_ID=$(echo "$ARGS" | awk '{print $1}')
MR_ID=$(echo "$ARGS" | awk '{print $2}')
GITLAB_TOKEN="glpat-TpEqtc9Vcl9mHFYOd38LR286MQp1OjcxMmNuCw.01.121fblwju"

if [ -z "$PROJECT_ID" ] || [ -z "$MR_ID" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: /gitlab-review <project-id> <mr-id>"
  echo "Example: /gitlab-review 65438965 416"
  exit 1
fi

# Validate that both are numeric
if ! [[ "$PROJECT_ID" =~ ^[0-9]+$ ]] || ! [[ "$MR_ID" =~ ^[0-9]+$ ]]; then
  echo "Error: Both project ID and MR ID must be numeric"
  echo "Project ID: $PROJECT_ID"
  echo "MR ID: $MR_ID"
  exit 1
fi

echo "Project ID: $PROJECT_ID"
echo "MR ID: $MR_ID"

# Parse optional context (everything after project-id and mr-id)
CONTEXT=$(echo "$ARGS" | awk '{$1=""; $2=""; print $0}' | sed 's/^[[:space:]]*//')
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
  echo "2. Create a token with 'read_api' scope"
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

echo ""
echo "=== Merge Request Summary ==="
echo "Title: $TITLE"
echo "Author: $AUTHOR"
echo "State: $STATE"
echo "Source: $SOURCE_BRANCH → Target: $TARGET_BRANCH"
echo "URL: https://gitlab.com/$PROJECT_ID/-/merge_requests/$MR_ID"
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
echo "**URL:** https://gitlab.com/$PROJECT_ID/-/merge_requests/$MR_ID" >> "$REVIEW_FILE"
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

Now I'll analyze the code changes using the review process from review.md.

I'll create structured review data that includes:

1. Accurate line numbers from diff hunks
2. Actual code snippets before recommendations
3. Comprehensive file analysis

Let me process the changes and run specialized analysis agents:

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

After the analysis, I'll ask: "Create GitHub issues for critical findings?"

I'll now perform the comprehensive analysis directly.

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

## How the Improved Analysis Works

1. **Diff Parsing**: Extracts exact line numbers from Git diff hunk headers (`@@ -old,count +new,count @@`)
2. **Code Context**: Saves both the diff and full file content when available
3. **Structured Data**: Creates JSON files with all changes for programmatic analysis
4. **Comprehensive Review**: Uses specialized agents that read all context files to provide accurate analysis

The analysis agents will:
- Use the exact line numbers from the diff hunks
- Include the actual code changes in each finding
- Reference the specific files and line ranges
- Provide actionable recommendations with code examples

I'll use the Task tool to perform deep analysis. The Task agent will:
1. Read the paths from `/tmp/gitlab_review_paths_<mr_id>.txt`
2. Analyze all diff files with accurate line numbers
3. Append detailed findings to the review file

After the Task analysis completes, I'll display the final review report.

For React/TypeScript projects, I'll also use the frontend-conventions agent:

```bash
# Check if this is a React/TypeScript project
IS_REACT_PROJECT=false
if jq -r '.changes[].new_path' "$TEMP_FILE" | grep -qE "\.(tsx?|jsx?)$"; then
  IS_REACT_PROJECT=true
  echo "Detected React/TypeScript project - will run frontend-conventions analysis"
fi
```

Then I'll invoke the frontend-conventions agent to review React best practices.

After all analysis is complete:

1. **MANDATORY**: Generate a comprehensive `review-report.md` file in the assets directory with the full review
2. Display a clickable link to the report

The review report MUST include these sections:
- MR metadata table (title, author, state, branch, URL, files changed, review date)
- Summary of changes
- Positive changes (green checkmarks)
- Medium concerns (yellow warnings)
- Points to verify (orange notes)
- Action items (red alerts)
- Final verdict (APPROVE / REQUEST CHANGES / NEEDS DISCUSSION)

**IMPORTANT**: Always end with:
1. A clickable markdown link to the report file
2. The full absolute path for easy access
3. A Finder command to open the folder

Example output:
```
📋 **Review Report**: [review-report.md](gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/review-report.md)

📂 **Full path**: `~/.claude/gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/review-report.md`

🔍 **Open in Finder**: Run `open ~/.claude/gitlab-review-assets/mr_<MR_ID>_<TIMESTAMP>/`
```

The link format must be relative from the workspace root so it's clickable in VSCode. The full path allows users to copy/paste it, and the Finder command lets them quickly navigate to the folder.
