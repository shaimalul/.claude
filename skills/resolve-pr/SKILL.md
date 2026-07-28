---
name: resolve-pr
description: Analyze all PR review threads, create a response plan, apply fixes, post replies, and resolve threads on GitHub
argument-hint: <pr-url>
allowed-tools: Bash, Task, Read, Grep, Glob, Edit, Write, AskUserQuestion
disable-model-invocation: true
---

# Resolve PR Review Threads

Fetch all GitHub PR review threads, analyze reviewer feedback, present a response plan for approval, then execute fixes and post replies.

## Prerequisites

1. `gh` CLI installed and authenticated (`gh auth login`, or `GH_TOKEN` with `repo` scope)
2. Current branch should match the PR head branch

## Phase 1: Fetch PR Data

```bash
PR_URL="$ARGUMENTS"

if [ -z "$PR_URL" ]; then
  echo "Error: Missing PR URL"
  echo "Usage: /resolve-pr <pr-url>"
  exit 1
fi

REPO=$(echo "$PR_URL" | sed -n 's|https://github\.com/\([^/]*/[^/]*\)/pull/.*|\1|p')
PR_NUMBER=$(echo "$PR_URL" | sed -n 's|.*/pull/\([0-9]*\).*|\1|p')

if [ -z "$REPO" ] || [ -z "$PR_NUMBER" ]; then
  echo "Error: Invalid GitHub PR URL"
  echo "Expected: https://github.com/<owner>/<repo>/pull/<number>"
  exit 1
fi

OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

SESSION_DIR="$HOME/.claude/resolve-pr-assets/pr_${PR_NUMBER}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SESSION_DIR"

gh pr view "$PR_NUMBER" --repo "$REPO" \
  --json title,author,headRefName,baseRefName,url \
  > "$SESSION_DIR/pr_info.json" || { echo "Error: Failed to fetch PR"; exit 1; }

TITLE=$(jq -r '.title' "$SESSION_DIR/pr_info.json")
AUTHOR=$(jq -r '.author.login' "$SESSION_DIR/pr_info.json")
SOURCE=$(jq -r '.headRefName' "$SESSION_DIR/pr_info.json")
TARGET=$(jq -r '.baseRefName' "$SESSION_DIR/pr_info.json")
WEB_URL=$(jq -r '.url' "$SESSION_DIR/pr_info.json")

echo "PR: $TITLE (#$PR_NUMBER)"
echo "Author: $AUTHOR | Branch: $SOURCE -> $TARGET"
echo "URL: $WEB_URL"
echo ""

# Review threads and their resolution state are only exposed via GraphQL.
# The thread id returned here is what resolveReviewThread needs in Phase 2.
gh api graphql --paginate \
  -F owner="$OWNER" -F name="$NAME" -F number="$PR_NUMBER" \
  -f query='
query($owner:String!, $name:String!, $number:Int!, $endCursor:String) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100, after:$endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first:100) {
            nodes { databaseId author { login } body createdAt }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[]' \
  | jq -s '.' > "$SESSION_DIR/threads.json"

TOTAL=$(jq 'length' "$SESSION_DIR/threads.json")
UNRESOLVED=$(jq '[.[] | select(.isResolved == false)] | length' "$SESSION_DIR/threads.json")
echo "Review threads: $TOTAL total, $UNRESOLVED unresolved"

cat > "$SESSION_DIR/metadata.json" << EOF
{
  "repo": "$REPO",
  "pr_number": "$PR_NUMBER",
  "session_dir": "$SESSION_DIR",
  "pr_url": "$WEB_URL",
  "title": "$TITLE",
  "author": "$AUTHOR",
  "source_branch": "$SOURCE",
  "target_branch": "$TARGET"
}
EOF
```

## Phase 2: Analyze

Invoke the `pr-resolver-agent` agent to analyze all unresolved threads and create a response plan. Pass `SESSION_DIR`, `REPO`, and `PR_NUMBER` to the agent context.

The agent reads `threads.json` and `metadata.json`, analyzes each thread, and returns a structured plan (Phase B of the agent). It cannot ask you directly - sub-agents have no `AskUserQuestion` access - so it stops there and hands the plan back to you.

## Phase 3: Get Approval and Resume

Present the returned plan and use `AskUserQuestion` yourself:
- Question: "How would you like to proceed with the N discussion responses?"
- Header: "Confirm"
- Options: "Approve" (execute the plan), "Modify" (change some items), "Cancel" (discard)

Resume the `pr-resolver-agent` with the decision:
- Approve: the agent proceeds to Phase C (execute) and Phase D (report)
- Modify: pass your changes back; the agent returns an updated plan; ask again
- Cancel: stop, nothing is applied
