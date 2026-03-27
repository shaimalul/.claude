---
name: review-base
description: Shared code review framework with finding prefixes, agent routing, severity tiers, and learning feedback loop. Use when performing code reviews, routing review findings to specialist agents, or formatting review comments.
---

# Code Review Framework

Shared patterns for the `/review` command (local branch and GitHub PR modes).

## Finding Prefixes

Use these standardized prefixes for all review findings:

| Prefix | Meaning | Action Required |
|--------|---------|-----------------|
| `[Blocker]` | MR will not be approved without fixing - breaks coding principals | MUST fix before merge |
| `[Nice to have]` | Not a blocker but better if changed | SHOULD fix |
| `[Suggestion]` | Opinionated preference (e.g., types vs enums) | Consider fixing |
| `[Need to check]` | Something looks weird, worth investigating | Verify/explain |
| `[Question]` | Needs clarification or explanation | Respond |

## Comment Style Guidelines

- Sound natural and human, not robotic
- Keep it concise - single paragraph strongly preferred
- Relaxed grammar is fine if it improves flow
- Skip the emojis
- DO NOT repeat what the code is doing - jump straight to the feedback
- DO NOT post positive/complimentary comments - only actionable feedback
- DO NOT add AI attribution or signatures
- Code examples ONLY for complex fixes (high-level guidance, not complete solution)
- NO multi-section format (no separate "Why:", "Suggestion:", "Question:" subsections)

**Good:** `[Nice to have] Consider moving ServiceModule enum to a shared types file, those enums used across multiple domains.`
**Good:** `[Question] Is losing the original error type intentional here? Consider attaching the original as cause.`

**Bad (multi-section):** Separate "Why:", "Suggestion:", code block subsections
**Bad (redundant intro):** Restating what the code does before giving feedback
**Bad (unnecessary code):** Full code solution for simple suggestions (renaming, moving files)

## Agent Routing Table

Route files to specialist agents based on file patterns:

| Category | File Patterns | Agents to Spawn |
|----------|---------------|-----------------|
| **Frontend** | `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.module.scss` | frontend-principal, ux-principal |
| **Backend** | `*.ts` in `controllers/`, `services/`, `repositories/`, `middleware/` | backend-principal |
| **DevOps** | `*.tf`, `*.yaml`, `*.yml`, `Dockerfile*`, `docker-compose*` | devops-principal |
| **AI/ML** | Files with `openai`, `llm`, `prompt`, `embedding`, `ai` in path | ai-principal |
| **All Changes** | All files (always run) | security-principal, architect-principal |

### Agent Skills

Each agent automatically loads relevant skills:

| Agent | Skills Loaded |
|-------|---------------|
| frontend-principal | react-component, typescript-types, refactoring-patterns, testing-patterns |
| backend-principal | backend-patterns, api-design, database-patterns |
| security-principal | security-patterns |
| architect-principal | architect |
| devops-principal | docker-patterns, kubernetes-patterns, cicd-patterns, terraform-patterns |
| ai-principal | openai-integration, prompt-engineering |
| ux-principal | accessibility-patterns, interaction-design |

## Severity Tiers

Aggregate findings into these priority levels:

1. **Critical/Blocker** - Security vulnerabilities, data exposure (MUST fix - blocks merge)
2. **High** - Architecture violations, major bugs (SHOULD fix before merge)
3. **Medium** - Code quality issues, patterns (recommended to fix)
4. **Low** - Style, minor improvements (nice to have)
5. **Improvement Opportunities** - Non-blocking suggestions (cleanup, simplification)

## Report Template

```markdown
## Code Review Report

### Branch/MR Info
- **Branch/MR**: [name/url]
- **Base**: [main/master]
- **Files changed**: X

### Files Reviewed
| Category | Count | Files |
|----------|-------|-------|
| Frontend | X | file1.tsx, file2.tsx |
| Backend | X | service.ts |
| DevOps | X | Dockerfile |

### Agents Used
- security-principal
- architect-principal
- [list only agents that were spawned]

### Summary
- Critical issues: X
- High priority: X
- Medium priority: X
- Low priority: X

### Critical Issues (BLOCKING)
| File | Line | Issue | Agent | Fix |
|------|------|-------|-------|-----|
| ... | ... | ... | security-principal | ... |

### High Priority Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | ... |

### Medium Priority Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | ... |

### Low Priority Issues
[List if any]

### Improvement Opportunities (Non-Blocking)
Suggestions for cleaner code, reduced duplication, and better approaches:

| File | Current State | Suggestion | Impact |
|------|---------------|------------|--------|
| service.ts:45-60 | Duplicate validation logic | Extract to `validators/shared.ts` | -30 lines |
| utils.ts:12 | Legacy alias `oldFunctionName` | Remove (no usages found) | Cleanup |

### Key Recommendations
1. [Most important action item]
2. [Second priority]
3. [Third priority]
```

## CLAUDE.md Compliance Checks

Always verify these standards from CLAUDE.md:

### Modularity Rules
- File length (max 150 lines)
- Function length (max 30 lines)
- Class length (max 200 lines)

### Code Style
- Named exports only (no `export default`)
- No barrel files (import directly from source)
- No type casting with `as`
- No `any` or `unknown` without type guards
- Optional params use `?` not `| undefined`
- Enums used instead of string literals for status comparisons
- No empty catch blocks (always log errors)
- Use `void` for ignored promises (not eslint-disable)
- No backward compatibility wrappers in new code

### Architecture
- Three-layer architecture compliance (UI → Logic → Data)
- Never skip layers
- Proper separation of concerns

## Review Focus Areas by Agent

### security-principal Focus
- OWASP Top 10 vulnerabilities
- Credential/secret exposure
- Input validation gaps
- SQL injection / XSS risks
- Authentication/authorization issues
- Insecure dependencies

### architect-principal Focus
- CLAUDE.md compliance (file/function length limits)
- Three-layer architecture violations
- Export default usage (should use named exports)
- Barrel file usage (should import directly)
- Code duplication (repeated logic > 3 lines)
- Backward compatibility hacks
- Dead code
- Over-engineering

### frontend-principal Focus
- React patterns (hooks, state management)
- React anti-patterns (prop explosion, setState as props)
- TypeScript best practices (no type casting)
- Performance (unnecessary useMemo/useCallback)
- Testing considerations

### backend-principal Focus
- Three-layer architecture compliance
- API design patterns (RESTful conventions)
- Error handling (use http-status-codes, not raw numbers)
- Database query optimization (N+1 problems)
- Validation (Zod/class-validator patterns)

### ux-principal Focus
- WCAG 2.1 AA compliance
- Semantic HTML usage
- ARIA patterns
- Keyboard navigation
- Focus management
- Loading states and error handling UX

## Learning Feedback Loop

After generating findings, execute this loop for patterns with `[Blocker]`, `[Nice to have]`, or `[Suggestion]` prefixes.

### Step 1: Determine Category

| Keywords in Finding | Category |
|---------------------|----------|
| `any`, `casting`, `type`, `TypeScript` | `typescript-types` |
| `useEffect`, `useState`, `hook`, `React`, `component` | `react-component` |
| `controller`, `service`, `repository`, `layer` | `backend-patterns` |
| `injection`, `XSS`, `secret`, `auth`, `security` | `security-patterns` |
| Other patterns | `general` |

### Step 2: Check for Duplicates

Search CLAUDE.md for similar rules. Skip if already covered.

### Step 3: Invoke improve-claude

```
skill: improve-claude
args: [category]: [concise rule description] --save-skill
```

### Step 4: Report Results

```markdown
## Learning Feedback Loop

**Patterns Found:** [count]
**Rules Applied:** [list of rules added via improve-claude]
**Skills Saved:** [list of skills saved to ~/.claude/skills/learned/]
```

If no patterns were learned, report: "No learnable patterns identified in this review (no Blocker, Nice-to-have, or Suggestion findings)."

## JSON Findings Format (for GitHub mode)

When posting findings to GitHub, use one of these JSON structures:

**Inline finding** (on a specific changed line):
```json
{
  "type": "inline",
  "prefix": "[Suggestion]",
  "file_path": "src/foo.ts",
  "code_pattern": "exact code snippet 5-50 chars from a + line",
  "comment": "Your feedback here."
}
```

**General finding** (file-level, cross-cutting, or issue in unchanged code):
```json
{
  "type": "general",
  "prefix": "[Blocker]",
  "file_path": "src/foo.ts",
  "comment": "Your feedback here."
}
```

**type rules:**
- `"inline"`: Comment on a specific added/modified line. Requires `code_pattern` from a `+` line in the diff.
- `"general"`: File-level concern, cross-cutting pattern, or architectural observation about existing code. Does NOT require `code_pattern`.

**code_pattern rules (inline only):**
- Copy the EXACT code snippet from a `+` (added/modified) line in the diff (5-50 chars)
- CRITICAL: ONLY copy code from + lines (added/modified). NEVER from context/unchanged lines
- Use a unique snippet that appears only once in the file
- If code appears multiple times, include more context to make it unique
- Line numbers will be calculated automatically from code_pattern

**Architectural concerns about existing/unchanged code:**
- For observations about existing code patterns, create ONE "general" type finding
- Summarize all architectural observations in a single general comment
- Do NOT create separate inline findings for unchanged code
- Example: "Several services duplicate validation logic (UserService, OrderService). Consider extracting to shared validators/"

**Cross-cutting rules:**
- If the same issue appears in multiple files, produce ONE general finding listing all file paths in the comment
- Do NOT produce separate findings for each occurrence of the same pattern
