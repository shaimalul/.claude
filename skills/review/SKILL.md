---
name: review
description: Code Review - Review local branch changes or GitHub PR with specialist agents
argument-hint: [github-pr-url] [context]
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite, Write, WebFetch
---

# Code Review

Comprehensive code review using all relevant specialist agents in parallel.

**Modes:**
- `/review [context]` - Review current branch changes
- `/review <github-pr-url> [context]` - Review a GitHub PR and leave a pending review

Extends: `review-base` - prefixes, severity, agent routing, comment style, the fixed point, the two axes, the smell baseline, shared machinery, and the learning loop all live there. This file adds only spec-source discovery, the Spec sub-agent, the full prefixed report, and the follow-up TODO pass.

## FULLY AUTOMATED WORKFLOW

This command runs **without any user prompts**. It will:
1. Detect mode (local branch vs GitHub PR)
2. Fetch changes (git diff or GitHub API)
3. Analyze code using specialist agents in parallel
4. Post findings as draft comments on GitHub (GitHub mode only)
5. Generate a comprehensive review report
6. Display the final summary with links

**Do NOT ask user questions during execution.** Proceed directly through all phases.

## Instructions

### Phase 0: Mode Detection

Run Step A of `review-base`'s [MACHINERY.md](../review-base/MACHINERY.md). It sets `MODE`, `PR_URL`, and `CONTEXT`.

---

### Phase 1: Get Changes

Run **Fixed Point** from `review-base` FIRST. A ref that does not resolve, or an empty diff, stops the review here rather than inside seven parallel sub-agents.

Then run Step B of `review-base`'s [MACHINERY.md](../review-base/MACHINERY.md).

Local mode produces `CHANGED_FILES_LIST`, `DIFF_CONTENT`, and `ASSETS_DIR`. GitHub mode additionally produces per-file diffs, file contents at head, `FINDINGS_FILE`, and the existing-discussions summary that Phase 3 feeds to agents.

---

### Phase 1.5: Identify the Spec Source

The SPEC axis needs the originating requirement. Look for it in this order and stop at the first hit:

1. Issue references in the commit messages from `git log $FIXED_POINT..HEAD --oneline` (`#123`, `Closes #45`). Fetch with the `gh` CLI, never WebFetch
2. A path passed as an argument to this skill
3. An `ai_plans/{slug}/` folder whose slug matches the branch name or the feature. Prefer the specific phase document whose Files to Add / Files to Edit overlap the diff; fall back to the folder README
4. A PRD or spec file under `docs/` or `specs/` matching the branch name or feature
5. Ask the user where the spec is

Set `SPEC_SOURCE` to the fetched contents or path. If the user says there is no spec, set `SPEC_SOURCE=none`; the Spec sub-agent is skipped and the report says "no spec available".

This is what closes the loop with planning: `/plan-to-docs` writes the phase document, `/implement-phase` builds it, and this phase feeds that exact document back in as the thing the diff is judged against.

---

### Phase 2: Categorize Changed Files

Apply the **Agent Routing Table** from `review-base` to `CHANGED_FILES_LIST` to decide which agents to spawn.

---

### Phase 3: Spawn Specialist Agents in Parallel

Use the **Task tool** to spawn multiple agents simultaneously based on changed files.

### Agent Output Format

Append the Agent Output Format block from `review-base` to every agent prompt below, in full. Sub-agents have no other access to it.

### Comment Style

Defined in `review-base` under Comment Style Guidelines. Do not restate it in agent prompts - reference it.
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

**GITHUB mode:** Reference the assets directory with saved diffs:
```
Review this GitHub PR. Do NOT review unchanged code.

Assets: $ASSETS_DIR
Diffs: $DIFFS_DIR/*.diff
Full files: $FILES_DIR

IMPORTANT: Only review the lines shown in the diffs (+ and - lines).
Do NOT comment on existing code that wasn't changed in this PR.

PR DESCRIPTION:
Read $ASSETS_DIR/pr_description.txt for the author's own description of the change.
Treat this as load-bearing source material, NOT marketing copy. It often contains
root-cause analysis, "notes for reviewers" sections pre-empting false positives,
and codebase invariants the author is relying on.
- If the description explicitly addresses a concern you would raise (e.g. flags a
  choice as intentional and explains why), DO NOT raise that concern as a finding.
- If your finding contradicts a stated invariant, verify against the code before
  posting - the description may be correct and your finding may be a false positive.
- If the description is empty or missing, proceed normally.

EXISTING DISCUSSIONS:
Read $ASSETS_DIR/existing_discussions_summary.txt for all existing PR comments.
DO NOT comment on topics already covered by existing discussions (from bots, other reviewers, or the author).
If an existing comment already addresses a concern you would raise, SKIP it entirely.
If your finding adds NEW insight beyond what's already discussed, include it but acknowledge the existing discussion.
```

### Agents to Spawn

All agents below spawn in ONE message, in parallel. The specialists carry the STANDARDS axis; one additional agent carries the SPEC axis. See Two Axes in `review-base`.

#### Standards axis

Spawn per the **Agent Routing Table** in `review-base`. Each agent prompt is:

```
subagent_type: <agent from the routing table>
prompt: |
  [Mode-specific diff content from above, scoped to that agent's files]

  Focus on the "<agent> Focus" bullets from review-base.

  SMELL BASELINE:
  [Paste the full Smell Baseline table from review-base here. The sub-agent
  has no other access to it. Both binding rules travel with it: a documented
  repo standard overrides the baseline, and every smell is a judgement call
  mapped to [Nice to have] or [Suggestion], NEVER [Blocker].]

  [Append review-base Agent Output Format block]
```

Always spawn: security-agent, architect-agent, bug-finder-agent.
Conditionally: frontend-agent and ux-agent (`.tsx`/`.jsx`/`.css`/`.scss`), backend-agent (backend `.ts`), devops-agent (`.tf`/`.yaml`/`Dockerfile`), ai-agent (AI-related paths).

Two additions beyond the base focus lists:

- architect-agent: also flag missing test coverage on critical paths (error handling, edge cases)
- ai-agent: before flagging any model name, API version, package version, or SDK feature as invalid, verify via WebSearch

#### Spec axis

Skip entirely when `SPEC_SOURCE=none`.

```
subagent_type: general-purpose
prompt: |
  [Mode-specific diff content from above, unscoped - you see the whole change]

  Commits: [git log $FIXED_POINT..HEAD --oneline output]

  THE SPEC:
  [SPEC_SOURCE contents, or its path]

  Judge the diff against the spec ONLY. Do not review code quality, style,
  architecture, or security - other agents own that axis and merging the two
  is exactly what this separation prevents.

  Report three things, quoting the spec line for each finding:
  (a) Requirements the spec asked for that are MISSING or PARTIAL
  (b) Behaviour in the diff that the spec did NOT ask for (scope creep)
  (c) Requirements that look implemented but where the implementation
      looks WRONG against what the spec describes

  If the spec names domain terms, check the code uses those terms rather
  than synonyms.

  Under 400 words.

  [Append review-base Agent Output Format block]
```

---

### Phase 4: Aggregate Results

Collect findings from all spawned agents (from their Task outputs) and aggregate into a unified findings list.

**CRITICAL: Use Bash (echo/jq) for all findings.json file operations** - do NOT use Write/Read tools for intermediate data files (this avoids permission prompts). Only use Write for the final report in Phase 6.

```bash
# Merge all agent JSON outputs into findings.json using jq
# Example: jq -s 'add' <(echo "$SECURITY_FINDINGS") <(echo "$ARCHITECT_FINDINGS") > "$FINDINGS_FILE"
```

Keep the two axes in SEPARATE files. The Spec agent's output goes to `$ASSETS_DIR/spec-findings.json`, the specialists' merged output to `$FINDINGS_FILE`. Never merge or re-rank across them.

**Merge same-region findings** within the Standards axis before proceeding. If multiple specialists produced findings for the same `file_path` with overlapping `code_pattern`, combine them into a single finding with merged comments (separated by `\n\n---\n\n`). A Standards finding and a Spec finding on the same line stay separate even when they touch the same code.

Group findings by prefix in this order, WITHIN each axis:
1. `[Blocker]` - MUST fix before merge
2. `[Nice to have]` - SHOULD fix
3. `[Suggestion]` - Consider fixing
4. `[Need to check]` - Verify/explain
5. `[Question]` - Needs clarification

---

### Phase 5: Post to GitHub (GITHUB MODE ONLY)

Run Step C of `review-base`'s [MACHINERY.md](../review-base/MACHINERY.md) with `PREFIX_MODE=prefixed`.

It resolves line numbers from `code_pattern`, deduplicates same-line findings, filters against existing PR discussions, and creates a single pending review. Skip entirely if `MODE=local`.

---

### Phase 6: Generate Report

**MANDATORY**: Generate a comprehensive `review-report.md` file.

Save location:
- LOCAL mode: `$ASSETS_DIR/review-report.md`
- GITHUB mode: `$ASSETS_DIR/review-report.md`

Use the **Write** tool to create the report file.

This skill owns the review report: the only report template in the review family.

The report MUST use this format:

```markdown
# Code Review Report

## Review Details

| Field | Value |
|-------|-------|
| **Mode** | Local Branch / GitHub PR |
| **Branch** | [source] -> [target] |
| **Title** | [PR title - GitHub mode only] |
| **Author** | [PR author - GitHub mode only] |
| **State** | [PR state - GitHub mode only] |
| **URL** | [PR URL - GitHub mode only] |
| **Files Changed** | X |
| **Fixed Point** | [ref] ([short sha]) |
| **Spec Source** | [path/issue, or "none available"] |
| **Review Date** | YYYY-MM-DD |

[If CONTEXT provided:]

## Review Context

[context text]

---

## Summary

Standards axis:
- [Blocker]: X
- [Nice to have]: X
- [Suggestion]: X
- [Need to check]: X
- [Question]: X

Spec axis: X findings [or "skipped - no spec available"]

Worst issue in Standards: [one line]
Worst issue in Spec: [one line]

Do NOT pick a single worst issue across both axes. The separation exists to stop one axis masking the other.

### Files Reviewed

| Category | Count | Files |
|----------|-------|-------|
| Frontend | X | file1.tsx, file2.tsx |
| Backend | X | service.ts |
| DevOps | X | Dockerfile |

### Agents Used
- security-agent
- architect-agent
- bug-finder-agent
- [list only agents that were spawned]

---

## Verdict

[APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

**Rationale:** [Brief explanation. A Spec-axis failure alone is enough to REQUEST CHANGES even when Standards is clean.]

---

# Standards

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

# Spec

Spec source: [path or issue reference]

[If SPEC_SOURCE=none, this whole section reads: "No spec available - the Spec axis was skipped." and nothing else.]

## Missing or partial

- **`src/path/file.ts`** - [what the spec asked for that is not there]
  > Spec: "[quoted spec line]"

## Not asked for (scope creep)

- **`src/path/file.ts`** - [behaviour in the diff the spec never requested]

## Implemented but wrong

- **`src/path/file.ts`** - [how the implementation diverges from what the spec describes]
  > Spec: "[quoted spec line]"

---

## Key Recommendations

1. [Most important action item]
2. [Second priority]
3. [Third priority]

---

[GITHUB mode only:]

## Pending Review Created

Created 1 pending review with X inline comment(s) on GitHub
Review at: [PR URL]
Click "Submit review" in GitHub to publish all comments.
```

**IMPORTANT**: Always end by displaying:
1. A clickable markdown link to the report file
2. The full absolute path for easy access
3. Summary of findings and verdict

---

### Phase 7: Learning Feedback Loop

Run the Learning Feedback Loop from `review-base`. It proposes rules for you to apply with `/improve-claude`; the review itself edits no configuration.

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
- Status from the prefix: in_progress for `[Blocker]`, pending for the rest

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
- Only review files that are **part of the changes** (branch diff or PR diff)
- **Think like a principal engineer**: Look for simplification, duplication, tech debt, and better approaches
- **Flag backward compatibility code** that may no longer be needed
- **Suggest file minimization**: Can large files be split? Can dead code be removed?
- **Prefer simplicity**: If something can be done with less code, suggest it
