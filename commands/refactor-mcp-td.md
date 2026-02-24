---
description: Implement next task from MCP Server Refactoring TD using RGR methodology
argument-hint: "[task-letter]"
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite, Write, Edit, WebFetch, Skill, ToolSearch
model: opus
---

# Refactor MCP Tech Design

Fetches the TD from Notion, identifies the next incomplete task (or the specified one), understands the context, then implements using strict RGR with self-review before pushing.

**Usage:**
- `/refactor-mcp-td` - Auto-pick next incomplete task (issues first, then refactoring)
- `/refactor-mcp-td D` - Implement specific issue D
- `/refactor-mcp-td R3` - Implement specific refactoring task R.3

---

## Phase 1: Fetch TD & Identify Next Task

### Step 1: Fetch the Notion TD page

Use Notion MCP to fetch the TD content:

```
ToolSearch: select:mcp__notion__notion-fetch
```

Then fetch the page:

```
mcp__notion__notion-fetch with url: https://www.notion.so/zencity/MCP-Server-Refactoring-TD-302fd3ae77cd81e5b76bc65b00ced627
```

### Step 2: Parse tasks

The TD contains TWO categories:

- **Issues (A-N):** Architecture and performance improvements
- **Refactoring tasks (R.1 - R.25+):** Code quality improvements

Each task has: identifier, title, description, and status (Done / In Progress / Not Started).

Build a unified task list showing both categories with ID, name, and status.

### Step 3: Select task

Parse `$ARGUMENTS` for an optional task identifier.

- If matches a letter (A-N): use that issue
- If matches an R-pattern (R1, R.1, R3, R.3, etc.): use that refactoring task
- If empty: auto-pick the first incomplete task. Priority: issues first, then refactoring tasks
- If all tasks are done: report "All TD tasks are complete!" and stop

### Step 4: Confirm with user

Display the selected task details and use `AskUserQuestion`:

Options: "Yes, start implementation" / "Skip to next task" / "Choose different task"

### Step 5: Create Jira ticket

```
ToolSearch: select:mcp__claude_ai_Jira__createJiraIssue
```

Create a new Jira ticket under the MCP V2 & Refactoring epic:

```
mcp__claude_ai_Jira__createJiraIssue with:
  cloudId: zencity.atlassian.net
  projectKey: PLT
  issueType: Task
  summary: {task-id} - {task-name from TD}
  description: {task description from Notion TD}
  epicKey: PLT-3421
```

Store the created Jira ticket key (e.g., `PLT-3468`) for branch naming in Phase 3.

### Step 6: Update Notion status to "In Progress"

```
ToolSearch: select:mcp__notion__notion-update-page
```

Use `mcp__notion__notion-update-page` to update the task status to "In Progress":
- `page_id`: `302fd3ae77cd81e5b76bc65b00ced627`
- `command`: `replace_content_range`
- Find the status marker for the selected task and replace with "In Progress"

Fetch the page content first to see the exact format before attempting the update.

---

## Phase 2: Understand Essence

Before writing any code, build understanding of both the task and the codebase.

### Step 1: Understand the task purpose

From the TD description, answer:
- What problem does this task solve?
- What is the expected outcome after implementation?
- What are the boundaries (what should NOT change)?

### Step 2: Understand the repo architecture

Read the project README and explore the package structure relevant to this task:

```bash
cat README.md
ls packages/
```

Identify existing patterns, conventions, and dependencies in the area this task touches. Read 2-3 key files in the affected area to understand the current state.

### Step 3: Produce an essence summary

State in 2-3 sentences:
- The essence of the change (why it matters)
- The architectural approach (where changes will live)
- Any risks or dependencies to watch for

This summary feeds into Phase 4 (mastermind prompt) and Phase 7 (MR description).

---

## Phase 3: Branch Setup

```bash
git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"
```

Branch name is derived from the Jira ticket found in Phase 1 Step 5:
- Format: `PLT-{ticket-number}-{kebab-case-summary}` (e.g., `PLT-3468-aws-v3-migration`)
- Convert the Jira ticket summary to kebab-case, truncate to ~50 chars for readability

---

## Phase 4: Plan & Implement (RGR-Enforced)

Delegate planning and implementation to the **mastermind agent** via the Task tool.

**Task tool invocation:**
```
subagent_type: mastermind
prompt: |
  Implement this MCP Server Refactoring TD task:

  **Task:** {id} - {name}
  **Description:** {description from Notion}
  **Essence:** {essence summary from Phase 2}

  **Project Context:**
  - Monorepo with packages: api-server, mcp-server, shared
  - Reference branch: `refactor-server` (already has all implementations)
  - Use `git fetch origin refactor-server` then `git diff main...origin/refactor-server -- {relevant-paths}` to analyze reference
  - Run tests from the relevant package directory (e.g., `cd packages/api-server && npm test`)

  **Implementation Flow (STRICT ORDER):**

  1. **Analyze**: Read reference implementation from `refactor-server` and current state on `main`
  2. **Plan**: Create TodoWrite plan with subtasks
  3. **For each subtask, follow RGR strictly:**
     - Load `rgr-patterns` skill
     - RED: Write failing test(s) for the desired behavior
     - Run tests - verify they FAIL (if they already pass, the behavior exists - skip to next)
     - GREEN: Write the minimum code to make tests pass
     - Run ALL tests - verify they PASS
     - REFACTOR: Improve code quality while keeping tests green
     - Run ALL tests - verify they STILL PASS
  4. **After all subtasks**: Run full test suite from the package directory

  **RGR Enforcement:**
  - Do NOT write production code before a failing test exists for it
  - Do NOT skip the "verify test fails" step - this proves the test is meaningful
  - If a subtask is pure config/types with no runtime code, document why RGR was skipped

  **Specialist Routing:**
  - Agent/service tasks -> backend-principal
  - MCP connection tasks -> backend-principal
  - Shared types/architecture tasks -> architect-principal + backend-principal
  - Test infrastructure tasks -> backend-principal

  **Cross-Repo Observations:**
  During implementation, if you notice patterns that need fixing across the whole repo
  (e.g., inconsistent file naming, type duplication, convention violations, stale patterns),
  do NOT fix them as part of this task. Instead, collect them and include in your completion
  summary under "Cross-repo observations" with a short description of each.

  Report completion summary: tests added, RGR cycles completed, files modified, cross-repo observations (if any).
```

---

## Phase 5: Self-Review & Fix

### Step 0: Log cross-repo observations to Notion

If the mastermind reported any cross-repo observations in its completion summary:

1. Fetch the Notion TD page and read the "Follow up" section
2. For each observation, check if it's already mentioned in the follow-up list
3. If not already listed, append it using:

```
ToolSearch: select:mcp__notion__notion-update-page
```

```
mcp__notion__notion-update-page with:
  page_id: 302fd3ae77cd81e5b76bc65b00ced627
  command: append_after
  after_block_id: 311fd3ae77cd8099825bc45ebc004a24
  content: "- {observation description}"
```

If no cross-repo observations were reported, skip this step.

### Step 1: Self-review (before formal review)

Before invoking `/review`, perform a self-check:

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

Verify:
- Every changed file relates to the task (no unintended changes)
- No debug code, console.log, or TODO comments left behind
- Implementation matches the task description from the TD
- The essence from Phase 2 is reflected in the actual changes
- No regressions to existing functionality

Fix any issues found before proceeding.

### Step 2: Run formal review

Invoke the `/review` skill:

```
Skill: review
```

### Step 3: Fix ALL findings

Fix EVERY finding from the review report regardless of severity. After applying fixes:

1. Re-read the review report and verify each finding was addressed
2. Check off each finding mentally - no skipping, no deferring
3. If a finding was intentionally not fixed, document the reason
4. Re-run the `/review` skill to confirm zero remaining findings
5. Repeat until the review report is clean

---

## Phase 6: Verification

Invoke the `/quality-gate` skill:

```
Skill: quality-gate
```

If ANY check fails:
1. Fix the issue
2. Re-run quality gate
3. Repeat until everything passes

---

## Phase 7: Commit & Open MR

### Step 1: Commit changes

Invoke the `/commit-all` skill:

```
Skill: commit-all
```

### Step 2: Push branch

```bash
git push -u origin {branch-name}
```

### Step 3: Create MR

Use `feat:` for issues (A-N) and `refactor:` for R tasks.

First, output the MR description as a standalone copy-paste block for the user:

```markdown
## What
- {2-4 bullet points of actual changes made}

## Why
{1-2 sentences from the essence summary - what problem this solves and why it matters}
Jira: [{jira-ticket-key}](https://zencity.atlassian.net/browse/{jira-ticket-key}) | [TD](https://www.notion.so/zencity/MCP-Server-Refactoring-TD-302fd3ae77cd81e5b76bc65b00ced627)

## Regression testing
- [ ] {specific behavior proving the change works correctly}
- [ ] {specific existing behavior to check for regressions}
- [ ] {edge case or error scenario to verify}
```

Then create the PR using `gh`:

```bash
gh pr create --title "{type}: {task-name}" --body "{the description above}"
```

MR description rules:
- "What": factual list of changes, no fluff
- "Why": use the essence summary from Phase 2, keep to 1-2 sentences
- "Regression testing": actionable verification steps - no "verify in staging" prefix, just what to check
- Keep it concise and copy-paste ready

### Step 4: Update Notion status to "Done"

Use `mcp__notion__notion-update-page` to replace "In Progress" with "Done" for this task.

### Step 5: Report completion

```markdown
## Task {id} Complete: {task-name}

### Branch
`{branch-name}`

### MR
{MR URL}

### Summary
- Tests added: {count}
- RGR cycles: {count}
- Files modified: {count}
- All verification checks: PASS
- Review findings: ALL fixed

### Next Task
Run `/refactor-mcp-td` again to implement the next task.
```

---

## Workflow Reference

- Notion page ID: `302fd3ae77cd81e5b76bc65b00ced627`
- Jira epic: `PLT-3421` (MCP V2 & Refactoring)
- Reference branch: `refactor-server`
- Branch naming: `PLT-{jira-ticket-number}-{kebab-case-summary}` (from Jira ticket)
- Monorepo packages: `api-server`, `mcp-server`, `shared`
- Phases: Fetch TD + Jira -> Understand Essence -> Branch -> Implement (RGR) -> Self-Review & Review -> Verify -> Commit & MR
- Standards and methodology live in CLAUDE.md, agent definitions, and skills - not duplicated here
