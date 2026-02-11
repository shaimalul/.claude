---
description: DEPRECATED - Use /review <mr-url> instead
argument-hint: <mr-url> [context]
allowed-tools:
---

# GitLab MR Review (DEPRECATED)

This command has been merged into `/review`.

**New usage:** `/review <gitlab-mr-url> [context]`

**Examples:**
- `/review https://gitlab.com/group/project/-/merge_requests/123`
- `/review https://gitlab.com/group/project/-/merge_requests/123 focus on security`

The unified `/review` command automatically detects GitLab URLs and performs MR review with draft comment posting.
