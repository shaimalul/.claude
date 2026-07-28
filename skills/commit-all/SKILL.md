---
name: commit-all
description: Review all changes and create grouped commits following Conventional Commits
argument-hint: [--dry-run]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Commit All Changes

Intelligently review all uncommitted changes, group them by domain/type, and commit each group following Conventional Commits specification.

**Arguments:**
- `--dry-run`: Preview the commit plan without actually committing

## Phase 0: Branch Safety Check

Before doing anything else, get the current branch:

```bash
git branch --show-current
```

Then use AskUserQuestion to ask:

Question: "You're on branch `<branch-name>`. Where should these commits go?"
Header: "Branch"
Options:
- "Commit on `<branch-name>`" — proceed to Phase 1 on the current branch
- "Create new branch" — ask for a branch name (suggest one based on the changes, e.g. `feat/add-auth` or `fix/db-timeout`), run `git checkout -b <name>`, then proceed to Phase 1

If the user picks "Create new branch", ask:

Question: "New branch name? (suggested: `<suggested-name>`)"
Header: "Branch name"

Then run:
```bash
git checkout -b <chosen-name>
```

Then proceed to Phase 0.5.

## Phase 0.5: Reset Staged State

Before analyzing changes, ensure a clean slate by checking and resetting any pre-staged files:

```bash
git diff --cached --name-only
```

If this returns ANY files (anything is staged), unstage everything:

```bash
git reset
```

This ensures all changes are analyzed together and grouped properly according to the commit plan. Proceed to Phase 1.

## Phase 1: Analyze All Changes

Run these commands to understand the current state:

1. **Get all changed files:**
   ```bash
   git status --porcelain
   ```

2. **Get staged changes:**
   ```bash
   git diff --cached --stat
   ```

3. **Get unstaged changes:**
   ```bash
   git diff --stat
   ```

4. **Get detailed diff for understanding changes:**
   ```bash
   git diff
   git diff --cached
   ```

## Phase 2: Group Changes by Domain

Analyze each changed file and group them based on:

### Conventional Commits Prefix Rules

| File/Change Pattern | Prefix | Description |
|---------------------|--------|-------------|
| New functionality, new features | `feat:` | A new feature |
| Bug fixes, error corrections | `fix:` | A bug fix |
| `*.md`, `*.txt`, JSDoc changes | `docs:` | Documentation only |
| Config files, deps, build scripts | `chore:` | Maintenance tasks |
| Code restructuring, no behavior change | `refactor:` | Code change that neither fixes nor adds |
| `*.spec.ts`, `*.test.ts`, `__tests__/` | `test:` | Adding/correcting tests |
| Performance improvements | `perf:` | Performance improvement |
| `.github/workflows/*`, CI configs | `ci:` | CI/CD changes |
| Formatting, whitespace only | `style:` | Formatting, missing semicolons |

### Grouping Strategy

1. **Group by feature/domain first** - Files that work together should be committed together
   - Example: A new component + its hook + its service = one `feat:` commit

2. **Separate tests from implementation** - Test files get their own `test:` commit

3. **Separate docs from code** - Documentation changes get their own `docs:` commit

4. **Group config changes together** - All config/chore changes in one `chore:` commit

## Phase 3: Generate Commit Plan

Present the commit plan to the user in this format:

```
## Commit Plan

Analyzing changes...

Found [N] changed files across [M] groups:

---

### Commit 1: [prefix]: [message under 60 chars]
Files:
  - path/to/file1.ts (new|modified|deleted)
  - path/to/file2.ts (new|modified|deleted)

---

### Commit 2: [prefix]: [message under 60 chars]
Files:
  - path/to/file3.ts (modified)

---

[Continue for all groups...]
```

## Phase 4: User Confirmation

After showing the plan, use the `AskUserQuestion` tool to confirm:

**Question:** "Ready to create [N] commits. How would you like to proceed?"
**Header:** "Confirm"
**Options:**
1. **Yes** - "Proceed with creating all commits as planned"
2. **Improve** - "Suggest changes to the commit grouping or messages"

If `--dry-run` was specified, skip this step and show:
```
Dry run complete. No commits were created.
```

Based on response:
- **Yes**: Continue to Phase 4.5 (AI Doc Sync) or Phase 5 (Execute Commits)
- **Improve**: Ask user for specific changes, update plan, then ask again
- **Other**: Handle user's custom input accordingly

## Phase 4.5: AI Doc Sync (optional)

Skip this phase entirely if:
- `scripts/agent-compass.mjs` does not exist in the repo root, OR
- The commit group type is `docs:` (it is already a doc change)

Otherwise, for each commit group — before staging its files — run the following steps:

### Step 1: Read the diff

Run `git diff HEAD -- <files-in-group>` to understand what actually changed. For untracked new files use `cat` to read them directly.

### Step 2: Walk the CLAUDE.md chain

For each file in the group, walk up the directory tree and collect every `CLAUDE.md` that governs it (stop at repo root). Read each one.

### Step 3: Identify cross-cutting docs

Based on file paths, identify relevant `docs/` files to read:

| File Path Pattern | Doc to Read |
|-------------------|-------------|
| `packages/server/` or `packages/client/` | `docs/ARCHITECTURE.md` |
| `*.test.*` or `*.spec.*` | `docs/TESTING.md` |
| `packages/server/src/agents/` | `docs/AGENTS.md` |
| `packages/server/src/workflows/` | `docs/WORKFLOWS.md` |
| `k8s/` or `Dockerfile` or `.github/workflows/` | `docs/DEPLOYMENT.md` |
| `packages/client/src/` | `docs/FRONTEND_COMPONENTS.md` |

### Step 3.5: Check CONTEXT.md (glossary)

If `CONTEXT.md` exists at repo root, read it. Then evaluate:

- Does this change introduce a **new domain term** not in the glossary?
- Does this change **modify the behavior** of an existing documented term?
- Does the code use **terminology that conflicts** with the glossary?

**Domain-critical paths** (more likely to affect glossary):

| Path Pattern | Likely Terms Affected |
|--------------|----------------------|
| `**/agents/` | Agent, Agent prompt, Agent runtime |
| `**/workflows/` | Workflow, Step, Workflow run |
| `**/connectors/` | MCP Connector, Tool, Connector output |
| `**/skills/` | Skill, Prompt fragment |
| `**/types/` | Any domain type definitions |
| `content/` | Agent prompt, Skill, Guardrails |

If a glossary update is needed, add it to the docs to update in Step 5.

### Step 3.6: Check for ADR-worthy decisions

Evaluate if this change represents an **architectural decision** that warrants an ADR:

**Architecture-critical paths:**

| Path Pattern | Potential ADR Topic |
|--------------|---------------------|
| `packages/shared/src/external/` | Third-party integration choices |
| `packages/client/src/design-system/` | UI library decisions |
| New package in `packages/` | Package structure decisions |
| Major refactor of domain folder | Domain boundary changes |
| New `**/types/` files | Type system decisions |

**ADR criteria** (all three must be true):
1. Hard to reverse — the cost of changing later is meaningful
2. Surprising without context — a future reader will wonder why
3. Result of a real trade-off — there were genuine alternatives

If an ADR is warranted:
- Check `docs/adr/` for the highest existing number
- Suggest creating `docs/adr/NNNN-<slug>.md` with the decision and rationale
- Add to the docs to update in Step 5

### Step 4: Reason and decide

Using the diff and existing docs (including CONTEXT.md and ADR assessment), decide for each governing doc:

- Does this change introduce a new pattern, rule, or convention not yet captured?
- Does an existing rule need updating because the code now works differently?
- Was a new domain folder created that has no `CLAUDE.md` yet?
- Do any `scripts/` need updating to reflect new file patterns?
- Does CONTEXT.md need new or updated terms? (from Step 3.5)
- Does this warrant a new ADR? (from Step 3.6)

If all answers are "no" — skip to Phase 5 immediately.

### Step 5: Write/update docs

- Use `Edit` to surgically update existing files — only the sections affected by this change
- Use `Write` to create a new `CLAUDE.md` for a new domain (follow the structure of existing domain `CLAUDE.md` files; it must link to its parent `CLAUDE.md`)
- Keep changes minimal — do not rewrite unrelated sections

### Step 6: Stage doc changes

```bash
git add <updated-doc-files>
```

These files become part of the same commit group.

### Rules

- Only update docs when the change genuinely requires it — not every commit warrants a doc change
- Never invent rules not supported by the actual diff
- New domain `CLAUDE.md` must link to parent (required by agent-compass)

## Phase 5: Execute Commits

For each commit group, execute:

```bash
git add <file1> <file2> ...
git commit -m "<prefix>: <message>"
```

**CRITICAL RULES:**
1. **NO Claude signature** - Do NOT add any `Co-Authored-By` line
2. **Use simple `-m` flag** - No HEREDOC needed for simple messages
3. **Under 60 characters** - Total message must be under 60 chars
4. **Imperative mood** - "add X" not "added X", "fix Y" not "fixed Y"
5. **Lowercase prefix** - Always `feat:` not `Feat:`

## Phase 6: Offer to Push or Create PR

After all commits are created, use the `AskUserQuestion` tool with:

**Question:** "Commits created. What would you like to do next?"
**Header:** "Publish"
**Options:**
1. **Push directly** - "Run git push to publish commits to remote"
2. **Create PR** - "Push and open a Pull Request on GitHub"
3. **No** - "Leave commits local only"

### If "Push directly":
```bash
git push
```
If push fails due to no upstream:
```bash
git push --set-upstream origin <current-branch>
```

### If "Create PR":

First push the branch:
```bash
git push --set-upstream origin <current-branch>
```

Then create the PR on GitHub:
- Auto-generate title from the most significant commit (usually the first `feat:` or `fix:` commit)
- Auto-generate description listing all commits created in Phase 5
- Detect default branch:
  ```bash
  git remote show origin | grep 'HEAD branch'
  ```
- Run:
  ```bash
  gh pr create \
    --title "<auto-generated title>" \
    --body-file "$BODY_FILE" \
    --base <main-or-master>
  ```

> **Tip:** Wrap `gh pr create` in a script under `scripts/` and list it in `allowed-tools` in the skill frontmatter — Claude can then run it without a permission prompt on every invocation.

**PR body format:**
```
## Summary
- <bullet per commit: hash + message>

## Test plan
- [ ] Verify changes work as expected
```

## Phase 7: Report Summary

After all commits are created, show:

```
## Commit Summary

Created [N] commits:

| # | Hash | Message |
|---|------|---------|
| 1 | abc1234 | feat: add user auth flow |
| 2 | def5678 | test: add auth service tests |
| 3 | ghi9012 | docs: update readme |

All changes committed successfully.
```

If any files were skipped, show them separately.

## Commit Message Examples

**Good messages:**
- `feat: add user authentication endpoint`
- `fix: resolve null pointer in user service`
- `docs: update api documentation`
- `chore: update eslint configuration`
- `refactor: extract validation logic`
- `test: add unit tests for auth service`
- `perf: optimize database queries`
- `ci: add build stage to release workflow`
- `style: format with prettier`

**Bad messages (avoid):**
- `feat: Added new feature` (past tense)
- `FEAT: Add feature` (uppercase prefix)
- `feat: add user authentication endpoint with proper validation and error handling` (too long)
- `feat: stuff` (not descriptive)

## Phase 7: Push Suggestion

After the commit summary, check whether the current branch is a protected branch per `rules/git-workflow.md`:

- **If on a protected branch** (and user confirmed committing there in Phase 0): explicitly tell the user "Skipping push offer — you're on a protected branch. Push manually if intended."
- **If on a feature branch**: offer to push:
  ```
  Push changes to remote? Run: git push origin <branch-name>
  ```

NEVER push automatically — always ask. The user must explicitly authorize the push.

## Error Handling

- If no changes to commit: "No changes detected. Nothing to commit."
- If git fails: Show error and stop
- If user declines: "Commit cancelled. No changes were made."
