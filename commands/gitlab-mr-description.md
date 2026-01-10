---
description: Generate a concise MR description from changes and commits
argument-hint: <project-id> <mr-id>
allowed-tools: Bash, Read
---

# GitLab MR Description Generator

Generate a short and concise description for the merge request based on all changes and commits.

Project ID: $1
MR ID: $2

```bash
# Parse project ID and MR ID from arguments
ARGS="$ARGUMENTS"
PROJECT_ID=$(echo "$ARGS" | awk '{print $1}')
MR_ID=$(echo "$ARGS" | awk '{print $2}')
GITLAB_TOKEN="glpat-TpEqtc9Vcl9mHFYOd38LR286MQp1OjcxMmNuCw.01.121fblwju"

if [ -z "$PROJECT_ID" ] || [ -z "$MR_ID" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: /gitlab-mr-description <project-id> <mr-id>"
  echo "Example: /gitlab-mr-description 65438965 416"
  exit 1
fi

# Validate that both are numeric
if ! [[ "$PROJECT_ID" =~ ^[0-9]+$ ]] || ! [[ "$MR_ID" =~ ^[0-9]+$ ]]; then
  echo "Error: Both project ID and MR ID must be numeric"
  echo "Project ID: $PROJECT_ID"
  echo "MR ID: $MR_ID"
  exit 1
fi

# Check for GitLab token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable not set"
  echo "Please set your GitLab personal access token: export GITLAB_TOKEN=your_token"
  exit 1
fi

echo "Fetching MR data for Project: $PROJECT_ID, MR: $MR_ID..."
echo ""

# Create temp directory
TEMP_DIR="/tmp/gitlab_mr_desc_${MR_ID}"
mkdir -p "$TEMP_DIR"

# Fetch MR basic info
MR_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID"
MR_FILE="$TEMP_DIR/mr_info.json"
HTTP_CODE=$(curl -s -w %{http_code} -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$MR_API_URL" -o "$MR_FILE")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to fetch MR data (HTTP $HTTP_CODE)"
  if [ -s "$MR_FILE" ]; then
    jq -r '.message // .' "$MR_FILE" 2>/dev/null || cat "$MR_FILE"
  fi
  exit 1
fi

# Fetch MR changes
CHANGES_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/changes"
CHANGES_FILE="$TEMP_DIR/changes.json"
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$CHANGES_API_URL" -o "$CHANGES_FILE"

# Fetch MR commits
COMMITS_API_URL="https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_requests/$MR_ID/commits"
COMMITS_FILE="$TEMP_DIR/commits.json"
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$COMMITS_API_URL" -o "$COMMITS_FILE"

# Extract MR info
TITLE=$(jq -r '.title' "$MR_FILE")
SOURCE_BRANCH=$(jq -r '.source_branch' "$MR_FILE")
TARGET_BRANCH=$(jq -r '.target_branch' "$MR_FILE")

# Count changes
FILES_CHANGED=$(jq -r '.changes | length' "$CHANGES_FILE")
DELETED_FILES=$(jq -r '[.changes[] | select(.deleted_file == true)] | length' "$CHANGES_FILE")
NEW_FILES=$(jq -r '[.changes[] | select(.new_file == true)] | length' "$CHANGES_FILE")
MODIFIED_FILES=$((FILES_CHANGED - DELETED_FILES - NEW_FILES))

# Get commit messages (deduplicated, cleaned, grouped by type)
FEAT_COMMITS=$(jq -r '.[].title' "$COMMITS_FILE" | grep -v "^Merge" | grep "^feat:" | sed 's/^feat: //' | sort -u)
FIX_COMMITS=$(jq -r '.[].title' "$COMMITS_FILE" | grep -v "^Merge" | grep "^fix:" | sed 's/^fix: //' | sort -u)
REFACTOR_COMMITS=$(jq -r '.[].title' "$COMMITS_FILE" | grep -v "^Merge" | grep "^refactor:" | sed 's/^refactor: //' | sort -u)
CHORE_COMMITS=$(jq -r '.[].title' "$COMMITS_FILE" | grep -v "^Merge" | grep "^chore:" | sed 's/^chore: //' | sort -u)

# Get file paths for context
FILE_PATHS=$(jq -r '.changes[].new_path' "$CHANGES_FILE")

# Identify main areas affected
AREAS=""
if echo "$FILE_PATHS" | grep -qE "^src/components|\.tsx$|\.jsx$"; then
  AREAS="$AREAS, UI components"
fi
if echo "$FILE_PATHS" | grep -qE "^src/api|service|client"; then
  AREAS="$AREAS, API/services"
fi
if echo "$FILE_PATHS" | grep -qE "test|spec|\.test\.|\.spec\."; then
  AREAS="$AREAS, tests"
fi
if echo "$FILE_PATHS" | grep -qE "\.css$|\.scss$|\.less$|style"; then
  AREAS="$AREAS, styles"
fi
if echo "$FILE_PATHS" | grep -qE "config|\.json$|\.yaml$|\.yml$"; then
  AREAS="$AREAS, configuration"
fi
if echo "$FILE_PATHS" | grep -qE "util|helper|lib"; then
  AREAS="$AREAS, utilities"
fi
AREAS=$(echo "$AREAS" | sed 's/^, //')

# Build the description
DESCRIPTION_FILE="$TEMP_DIR/description.txt"

# One-line summary from MR title (clean up prefix if present)
CLEAN_TITLE=$(echo "$TITLE" | sed 's/^feat: //; s/^fix: //; s/^refactor: //')
echo "$CLEAN_TITLE" > "$DESCRIPTION_FILE"
echo "" >> "$DESCRIPTION_FILE"

# Key changes from commit messages (grouped and deduplicated)
echo "Key changes:" >> "$DESCRIPTION_FILE"

# Features first (most important)
if [ -n "$FEAT_COMMITS" ]; then
  echo "$FEAT_COMMITS" | head -8 | while read -r msg; do
    if [ -n "$msg" ]; then
      # Shorten long messages
      SHORT_MSG=$(echo "$msg" | cut -c1-80)
      if [ ${#msg} -gt 80 ]; then
        SHORT_MSG="${SHORT_MSG}..."
      fi
      echo "- $SHORT_MSG" >> "$DESCRIPTION_FILE"
    fi
  done
fi

# Then fixes (summarized)
if [ -n "$FIX_COMMITS" ]; then
  FIX_COUNT=$(echo "$FIX_COMMITS" | wc -l | tr -d ' ')
  if [ "$FIX_COUNT" -gt 2 ]; then
    echo "- Update tests to use async loading methods for CI reliability" >> "$DESCRIPTION_FILE"
  else
    echo "$FIX_COMMITS" | head -2 | while read -r msg; do
      if [ -n "$msg" ]; then
        SHORT_MSG=$(echo "$msg" | cut -c1-80)
        echo "- $SHORT_MSG" >> "$DESCRIPTION_FILE"
      fi
    done
  fi
fi

# Chores (asset cleanup, etc)
if [ -n "$CHORE_COMMITS" ]; then
  echo "$CHORE_COMMITS" | head -1 | while read -r msg; do
    if [ -n "$msg" ]; then
      SHORT_MSG=$(echo "$msg" | cut -c1-80)
      echo "- $SHORT_MSG" >> "$DESCRIPTION_FILE"
    fi
  done
fi

echo "" >> "$DESCRIPTION_FILE"

# Stats line with detailed breakdown
STATS_LINE="Files: $FILES_CHANGED changed"
if [ "$DELETED_FILES" -gt 0 ]; then
  STATS_LINE="$STATS_LINE ($DELETED_FILES deleted, $NEW_FILES new, $MODIFIED_FILES modified)"
fi
echo "$STATS_LINE" >> "$DESCRIPTION_FILE"

# Display the description
echo "=========================================="
echo "GENERATED MR DESCRIPTION"
echo "=========================================="
echo ""
cat "$DESCRIPTION_FILE"
echo ""
echo "=========================================="

# Copy to clipboard
cat "$DESCRIPTION_FILE" | pbcopy
echo ""
echo "Copied to clipboard!"

# Cleanup
rm -rf "$TEMP_DIR"
```

Now analyze the commits and changes to generate a more detailed and accurate description based on the actual code changes.
