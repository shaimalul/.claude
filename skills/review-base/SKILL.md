---
name: review-base
description: Shared code review framework with finding prefixes, agent routing, the two review axes, and the learning feedback loop. Use when performing code reviews, routing review findings to specialist agents, or formatting review comments.
user-invocable: false
---

# Code Review Framework

Shared patterns for the `/review` command (local branch and GitHub PR modes).

## Two Pillars: SSOT and Tests

Every code review MUST prioritize these two principles above all others:

### SSOT (Single Source of Truth)

SSOT violations are ALWAYS `[Blocker]` - not suggestions, not nice-to-haves.

- Every constant, type, enum, and piece of logic has ONE authoritative location
- Check: Can you change this in one place and have it propagate everywhere?
- If no: it is a BLOCKER

Examples to flag:
- Same enum/constant defined in multiple files
- Same validation logic copy-pasted across services
- Same type definition in frontend AND backend (instead of shared)
- Same business rule implemented in two places
- Same error messages hardcoded in multiple locations

### Test Coverage

Untested behavioral changes are ALWAYS `[Blocker]`.

- Every behavioral change needs a test that would fail without it
- Check: If someone reverts this change, will a test fail?
- If no: it is a BLOCKER

These are the foundation of maintainable code. Other issues (patterns, style, architecture) matter only after these are satisfied.

## Extending This Base

Every review skill inherits from this file. A consumer skill MUST NOT restate anything defined here - it declares only what it overrides.

Inherited by default (never copy into a consumer):

| What | Section here |
| --------------------------------- | -------------------------------- |
| Finding prefixes | Finding Prefixes |
| Comment style and tone | Comment Style Guidelines |
| Which agent reviews which file | Agent Routing Table |
| What each agent looks for | Review Focus Areas by Agent |
| Mode detection, fetching, posting | Shared Machinery ([MACHINERY.md](MACHINERY.md)) |
| What every agent returns | Agent Output Format |
| Pinning the fixed point | Fixed Point |
| The two review axes | Two Axes: Standards and Spec |
| Fowler smell baseline | Smell Baseline |
| Existing-discussion handling | Existing Discussion Awareness |
| Learning feedback loop | Learning Feedback Loop |

A consumer skill contains only:

1. Its frontmatter
2. An `Extends: review-base` declaration
3. An Overrides section listing every deviation - and nothing that merely agrees with the base
4. Its own report template, if the output shape genuinely differs

If a consumer needs to change a rule for everyone, change it here, not in the consumer.

### Prefix Modes

Consumers set `PREFIX_MODE` to control how findings are labelled:

| Mode | Behaviour | Used by |
| ------------ | -------------------------------------------------- | -------- |
| `prefixed` | Findings carry `[Blocker]`, `[Nice to have]`, etc. | review |
| `unprefixed` | Findings are bare sentences, no bracket tags | consumers that post outside a PR |

The machinery below honours `PREFIX_MODE`. In `unprefixed` mode the `prefix` field is omitted from findings and nothing is prepended when posting.

## Two Axes: Standards and Spec

Every review runs along two independent axes:

- STANDARDS: does the code follow this repo's documented standards, plus the smell baseline below?
- SPEC: does the code faithfully implement the originating issue, PRD, or phase document?

A change can pass one and fail the other:

- Follows every standard but implements the wrong thing: Standards pass, Spec fail
- Does exactly what the issue asked but breaks the project's conventions: Spec pass, Standards fail

Report the axes SEPARATELY and never merge or re-rank findings across them. One axis masking the other is exactly what the separation exists to prevent. The summary names the worst issue WITHIN each axis; it never picks a single winner across both.

If no spec can be found, the Spec axis is skipped and the report says so explicitly.

## Fixed Point

Every review is a diff between `HEAD` and a fixed point. Resolve it BEFORE spawning any agent, so a bad ref fails here instead of inside seven parallel sub-agents.

```bash
# 1. The fixed point: whatever the user supplied, or the merge-base with the base branch
FIXED_POINT="${1:-$(git merge-base HEAD origin/${BASE_BRANCH:-main})}"

# 2. It must resolve
git rev-parse --verify "$FIXED_POINT" >/dev/null 2>&1 || {
  echo "Fixed point does not resolve: $FIXED_POINT"; exit 1; }

# 3. Three-dot, so the comparison is against the merge-base
git diff "$FIXED_POINT"...HEAD --stat
git log "$FIXED_POINT"..HEAD --oneline

# 4. An empty diff is a hard stop, not an empty review
[ -z "$(git diff "$FIXED_POINT"...HEAD --name-only)" ] && {
  echo "No changes between $FIXED_POINT and HEAD"; exit 1; }
```

Use three-dot (`...`) everywhere. Two-dot compares against the tip of the fixed point, which reports changes that came from the base branch as if the author made them.

## Finding Prefixes

Use these standardized prefixes for all review findings:

| Prefix | Meaning | Action Required |
|--------|---------|-----------------|
| `[Blocker]` | PR will not be approved without fixing - breaks coding principals | MUST fix before merge |
| `[Nice to have]` | Not a blocker but better if changed | SHOULD fix |
| `[Suggestion]` | Opinionated preference (e.g., types vs enums) | Consider fixing |
| `[Need to check]` | Something looks weird, worth investigating | Verify/explain |
| `[Question]` | Needs clarification or explanation | Respond |

## Comment Style Guidelines

- Keep it short: max 2 sentences for simple findings, or one intro sentence + bullet list for multiple related points on the same file
- Sound natural and human, not robotic
- Jump straight to the concern - NO context about what changed ("Behavioral change:", "The old code...", "This code...")
- Skip the emojis
- DO NOT repeat what the code is doing - just give the feedback
- DO NOT post positive/complimentary comments - only actionable feedback
- DO NOT add AI attribution or signatures
- Code examples ONLY for complex fixes where words alone are unclear
- NO multi-section format (no "Why:", "Suggestion:" subsections)
- NO lint-style comments (file length, function length, naming, import style, formatting)
- Prefer inline over general - if a comment references a specific file, it MUST be inline on that file, never general. General is ONLY for observations that can't be pinned to any single file.

**Good:** `[Nice to have] Consider moving ServiceModule enum to a shared types file, those enums used across multiple domains.`
**Good:** `[Blocker] If getAgentChatConfig throws here, it crashes the entire Promise.all. Wrap in try/catch or fetch only after confirming it's needed.`
**Good:** `[Question] Is losing the original error type intentional here? Consider attaching the original as cause.`

**Bad (verbose intro):** `[Need to check] Behavioral change: the old agent flow returned operational fields (model, maxTurns, etc.) from {...baseConfig, ...agentConfig}. The new code always takes these from baseConfig only. If agents can override these fields, this is a silent regression.`
**Bad (multi-section):** Separate "Why:", "Suggestion:", code block subsections
**Bad (lint-style):** `[Suggestion] This file exceeds 150 lines, consider splitting.`
**Bad (unnecessary code):** Full code solution for simple suggestions (renaming, moving files)

## Agent Routing Table

Route files to specialist agents based on file patterns:

| Category | File Patterns | Agents to Spawn |
|----------|---------------|-----------------|
| **Frontend** | `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.module.scss` | frontend-agent, ux-agent |
| **Backend** | `*.ts` in `controllers/`, `services/`, `repositories/`, `middleware/` | backend-agent |
| **DevOps** | `*.tf`, `*.yaml`, `*.yml`, `Dockerfile*`, `docker-compose*` | devops-agent |
| **AI/ML** | Files with `openai`, `llm`, `prompt`, `embedding`, `ai` in path | ai-agent |
| **All Changes** | All files (always run) | security-agent, architect-agent, bug-finder-agent |

### Agent Skills

Each agent automatically loads the skills declared in its own `skills:` frontmatter. That frontmatter is the SINGLE SOURCE OF TRUTH. Do not list them here, in the README, or in `consult` - three copies drift, and a drifted list is exactly the SSOT violation this base calls a `[Blocker]`.

To see what an agent loads:

```bash
grep -Hn '^skills:' agents/*.md
```

## Smell Baseline

On top of whatever the repo documents, the STANDARDS axis always carries this baseline: a fixed set of Fowler code smells (Refactoring, ch. 3) that applies even when a repo documents nothing.

Two rules bind it:

- THE REPO OVERRIDES. A documented repo standard always wins. Where `CLAUDE.md`, `rules/`, or a repo standards doc endorses something the baseline would flag, suppress the smell
- ALWAYS A JUDGEMENT CALL. Every smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Map them to `[Nice to have]` or `[Suggestion]`, NEVER `[Blocker]`. Skip anything tooling already enforces

Each smell reads as what it is, then how to fix. Match it against the diff.

| Smell | What it is | Fix |
|-------|-----------|-----|
| Mysterious Name | A function, variable, or type whose name does not reveal what it does or holds | Rename it. If no honest name comes, the design is murky |
| Duplicated Code | The same logic shape appears in more than one hunk or file in the change | Extract the shared shape, call it from both |
| Feature Envy | A method that reaches into another object's data more than its own | Move the method onto the data it envies |
| Data Clumps | The same few fields or params keep travelling together, a type wanting to be born | Bundle them into one type, pass that |
| Primitive Obsession | A primitive or string standing in for a domain concept that deserves its own type | Give the concept its own small type |
| Repeated Switches | The same switch or if-cascade on the same type recurs across the change | Replace with polymorphism, or one map both sites share |
| Shotgun Surgery | One logical change forces scattered edits across many files in the diff | Gather what changes together into one module |
| Divergent Change | One file or module is edited for several unrelated reasons | Split so each module changes for one reason |
| Speculative Generality | Abstraction, parameters, or hooks added for needs the spec does not have | Remove it. Inline back until a real need shows |
| Message Chains | Long `a.b().c().d()` navigation the caller should not depend on | Hide the walk behind one method on the first object |
| Middle Man | A class or function that mostly just delegates onward | Cut it, call the real target directly |
| Refused Bequest | A subclass or implementer that ignores or overrides most of what it inherits | Drop the inheritance, use composition |

Sub-agents have no other access to this table. Any consumer that spawns them MUST paste it into each Standards-axis prompt in full.

## CLAUDE.md Compliance Checks (Review-Worthy Only)

Only flag items that require human judgment. Lint-detectable items are enforced by linters, not code review.

### Architecture (flag these)
- Single Source of Truth violations (duplicate constants, types, or logic across files)
- Three-layer architecture compliance (UI -> Logic -> Data)
- Never skip layers
- Proper separation of concerns

### Logic & Safety (flag these)
- No type casting with `as` (use type guards)
- No `any` or `unknown` without type guards
- No empty catch blocks (always log errors)
- No backward compatibility wrappers in new code

### NOT for review (enforced by linters)
- File/function/class length limits
- Named exports vs default exports
- Barrel file usage
- Import ordering
- Formatting and naming conventions

### NOT for review (requires online verification first)
- External service/package assertions: NEVER flag model names, API versions, SDK features, library names, package versions, or third-party identifiers as invalid without first verifying via WebSearch. Training data may be outdated.

## Review Focus Areas by Agent

### security-agent Focus
- OWASP Top 10 vulnerabilities
- Credential/secret exposure
- Input validation gaps
- SQL injection / XSS risks
- Authentication/authorization issues
- Insecure dependencies

### architect-agent Focus

PRIMARY (always `[Blocker]`):
- SSOT violations: same constant, type, enum, or logic in multiple places
- Missing tests for behavioral changes

SECONDARY:
- Three-layer architecture violations
- Shallow modules: a large interface hiding little implementation (see `codebase-design`)
- Tests written past the interface rather than at a seam
- Code duplication (repeated logic > 3 lines)
- Backward compatibility hacks
- Dead code (unreachable code, commented-out blocks)
- Over-engineering (unnecessary abstractions, premature optimization)
- Behavioral regressions (changed semantics, lost functionality)

NOTE: Do NOT flag lint-style items (file length, function length, export default, barrel files)

### bug-finder-agent Focus
- Logic errors and off-by-one mistakes
- Null and undefined dereference risks
- Unhandled edge cases and error paths
- Race conditions and async ordering
- Silent behavioral regressions

### frontend-agent Focus
- React patterns (hooks, state management)
- React anti-patterns (prop explosion, setState as props)
- TypeScript best practices (no type casting)
- Performance (unnecessary useMemo/useCallback)
- Testing considerations

### backend-agent Focus
- Three-layer architecture compliance
- API design patterns (RESTful conventions)
- Error handling (use http-status-codes, not raw numbers)
- Database query optimization (N+1 problems)
- Validation (Zod/class-validator patterns)

### ux-agent Focus
- WCAG 2.1 AA compliance
- Semantic HTML usage
- ARIA patterns
- Keyboard navigation
- Focus management
- Loading states and error handling UX

## Learning Feedback Loop

A review is automated and must not edit configuration, so the loop PROPOSES and the user applies. After the report is written:

1. Collect the `[Blocker]`, `[Nice to have]`, and `[Suggestion]` findings that express a REUSABLE rule rather than a one-off bug in this diff
2. Drop any already covered: search `CLAUDE.md`, `rules/`, and the owning skill (see Category Detection in `improve-claude`'s ROUTING.md) for the concept
3. Mark each survivor MECHANICAL (a check could catch it) or JUDGEMENT, per Step 2 of `extract-learning`
4. Append this block to the report, and nothing else:

```markdown
## Learning Feedback Loop

Candidates: [count]

| Finding | Kind | Proposed owner | Apply with |
|---|---|---|---|
| [rule in one line] | mechanical / judgement | [owning file] | `/improve-claude "[rule]"` |
```

If nothing survives, write: "No learnable patterns in this review."

## Agent Output Format

Every review agent returns findings in this shape. It is a prompt payload: a consumer pastes the whole block into each agent prompt, because sub-agents have no other access to it. Line numbers are resolved later from `code_pattern` by Step C of [MACHINERY.md](MACHINERY.md).

```text
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
- type: "inline" for comments on specific changed lines, "general" ONLY for cross-cutting patterns with no specific file to pin to
  - If a comment mentions a specific file path or code pattern, it MUST be "inline" with a code_pattern - NEVER put file-specific feedback in general
  - "general" is ONLY for observations that span the entire codebase and can't be pinned to any single file (e.g., "consider standardizing error handling across all services")
  - Test file comments (missing coverage, test improvements) MUST be inline on the test file, not general
- prefix: Use [Blocker], [Nice to have], [Suggestion], [Need to check], or [Question]
- code_pattern (inline only): Copy EXACT code from a PLUS LINE (+ prefix) in the diff (5-50 chars)
  - CRITICAL: ONLY from + lines (added/modified). NEVER from context/unchanged lines
  - Use a unique snippet that appears only once in the file
  - Omit code_pattern entirely for "general" type findings
- comment: Keep it short and direct:
  - Max 2 sentences for simple findings
  - For multiple related points on the same file: one short intro sentence + bullet list (one bullet per point)
  - NO introductory context about what changed (never "Behavioral change:", "The old code...", "This code...")
  - Jump straight to the concern or question
  - Code examples ONLY for complex fixes where words alone are unclear
  - NO code examples for simple changes (moving, renaming, extracting)
  - NO multi-section format (no "Why:", "Suggestion:" subsections)
- Write as if YOU are the reviewer - natural, human, professional tone
- DO NOT post positive/complimentary comments - only actionable feedback

FORBIDDEN COMMENT TYPES (do NOT flag these):
- Lint-style: file length, function length, naming conventions, missing semicolons, import ordering
- Style preferences: export default vs named exports, barrel files, formatting
- Obvious observations: restating what the diff shows without adding insight
- These are enforced by linters, not code review
- External service/package assertions: flagging model names, API versions, SDK features, library names, package versions, or third-party identifiers as invalid WITHOUT first verifying via WebSearch. Training data may be outdated.

TEST COVERAGE RULE:
- Flag critical paths (business logic, error handling, edge cases) that lack test coverage
- Not demanding 100% coverage - focus on core logic that could break silently
- Use an "inline" finding on the untested code, not a general comment

UNCHANGED CODE RULE:
- NEVER create inline findings for unchanged/context lines in the diff
- For architectural concerns about existing code spanning 3+ files, create ONE "general" type finding summarizing all observations
- Example: "Several services duplicate validation logic (UserService, OrderService). Consider extracting to shared validators/"

EXTERNAL FACT VERIFICATION RULE:
- NEVER assert that an external identifier (model name, API version, SDK method, pricing tier, library/package name, package version) is invalid based solely on training data
- Before flagging any external identifier as non-existent, incorrect, or deprecated, verify via WebSearch
- This includes: model names, npm/pip package names and versions, API endpoints, SDK features, pricing tiers
- If verification is not possible, use [Need to check] instead of [Blocker] and note that online verification is needed
```

## Existing Discussion Awareness (GitHub PR Mode)

When reviewing a remote GitHub PR, the review process MUST consider all existing discussions and comments on the PR to avoid redundancy.

### How It Works

1. **Fetch Phase**: All existing PR review comments and issue comments are fetched via the GitHub API and saved to `existing_discussions_summary.txt` and `existing_comments_index.json`
2. **Agent Context**: Each review agent receives the existing discussions summary and is instructed to skip topics already covered
3. **Deduplication**: After agents produce findings, a deduplication step filters out findings that overlap with existing comments (same file + 30%+ word overlap, or 50%+ keyword overlap across files)

### Rules for Agents

- DO NOT comment on topics already addressed by existing discussions (from bots, other reviewers, or the PR author)
- If an existing comment already raises the same concern, SKIP the finding entirely
- If your finding adds genuinely NEW insight beyond what's already discussed, include it
- Both open and resolved discussions count - resolved discussions mean the issue was already handled
- Bot comments (CI bots, linters, coverage bots) are real feedback - do not duplicate their findings

## Shared Machinery

Mode detection, change fetching, line resolution, deduplication, and posting the pending GitHub review live in [MACHINERY.md](MACHINERY.md), the ONLY copy. Consumers run its steps by name (Step A, Step B, Step C) and never inline them. Local mode needs only Steps A and B; GitHub mode needs all three.
