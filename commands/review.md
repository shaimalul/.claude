---
description: Code Review - Review current branch changes with principal agents
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
skills: review-base
---

# Code Review

Comprehensive code review of **current branch changes** using all relevant principal agents in parallel.

**Uses:** `review-base` skill for finding prefixes, agent routing, severity tiers, and learning feedback loop.

## Instructions

### Step 1: Identify Current Branch Changes

Get the list of changed files in the current branch compared to the base branch:

```bash
# Fetch latest from origin to ensure accurate comparison
git fetch origin

# Get base branch (main or master)
BASE_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5 2>/dev/null || echo "main")

# Get list of changed files (comparing against origin's base branch)
git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD --name-only

# Get the actual diff content (this is what agents will review)
git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD

# Get diff stat summary
git diff $(git merge-base HEAD origin/$BASE_BRANCH)...HEAD --stat

# Get current branch name
git branch --show-current
```

### Step 2: Categorize Changed Files

Group files by type to determine which agents to spawn:

| Category | File Patterns | Agents |
|----------|---------------|--------|
| **Frontend** | `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.module.scss` | frontend-principal, ux-principal |
| **Backend** | `*.ts` in `controllers/`, `services/`, `repositories/`, `middleware/` | backend-principal |
| **DevOps** | `*.tf`, `*.yaml`, `*.yml`, `Dockerfile*`, `docker-compose*` | devops-principal |
| **AI/ML** | Files with `openai`, `llm`, `prompt`, `embedding`, `ai` in path | ai-principal |
| **All Changes** | All files | security-principal, architect-principal |

### Step 3: Spawn Principal Agents in Parallel

Use the **Task tool** to spawn multiple agents simultaneously based on changed files.

### Shared Agent Output Format

**IMPORTANT:** When constructing each agent prompt below, always append this full output format section to the prompt text sent to the agent.

```
OUTPUT FORMAT - Return findings as JSON array:
[
  {
    "prefix": "[Blocker]",
    "file_path": "src/path/to/file.ts",
    "code_pattern": "the exact code snippet you're commenting on (5-50 chars)",
    "comment": "Concise, paste-ready feedback. Jump straight to the issue.",
    "explanation": "Detailed explanation: why this is a problem, what could go wrong, and how to fix it with a code example. Include impact estimate for improvements."
  }
]

RULES:
- prefix: Use [Blocker], [Nice to have], [Suggestion], [Need to check], or [Question]
- code_pattern: Copy the EXACT code from the diff (5-50 chars) that you're commenting on
- comment: Keep concise and natural-sounding, ready to paste into a PR comment
- explanation: Provide extra context - why it matters, impact, remediation with code example
- DO NOT describe what the code does - jump straight to the feedback
- DO NOT post positive/complimentary comments - only actionable feedback
```

**ALWAYS spawn these agents:**

**Security Review (ALWAYS):**
```
subagent_type: security-principal
prompt: |
  Review ONLY the following diff for security issues. Do NOT review unchanged code.

  Branch: [current branch name]

  Diff (review ONLY these changes):
  [git diff output]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  - OWASP Top 10 vulnerabilities
  - Credential/secret exposure
  - Input validation gaps
  - SQL injection / XSS risks
  - Authentication/authorization issues
  - Insecure dependencies

  Include the Shared Agent Output Format in this prompt.
```

**Architecture & Code Quality Review (ALWAYS):**
```
subagent_type: architect-principal
prompt: |
  Review ONLY the following diff as a principal engineer would. Do NOT review unchanged code.

  Branch: [current branch name]

  Diff (review ONLY these changes):
  [git diff output]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  **CLAUDE.md Compliance:**
  - File length (max 150 lines)
  - Function length (max 30 lines)
  - Three-layer architecture violations
  - Export default usage (should use named exports)
  - Barrel file usage (should import directly)

  **Code Cleanup & Quality:**
  - Code duplication (repeated logic > 3 lines that should be extracted)
  - Backward compatibility hacks (unused re-exports, `_unusedVar`, deprecated aliases, `// removed` comments)
  - Dead code (unused imports, unreachable code, commented-out blocks)
  - Over-engineering (unnecessary abstractions, premature optimization, extra indirection)
  - File minimization (can large files be split? can small related files be consolidated?)
  - Better approaches (simpler patterns, more idiomatic solutions, modern alternatives)

  Include the Shared Agent Output Format in this prompt.
```

**Spawn these agents IF relevant files exist:**

**Frontend Review (if .tsx/.jsx/.css/.scss files):**
```
subagent_type: frontend-principal
prompt: |
  Review ONLY the following frontend diff as a principal engineer would. Do NOT review unchanged code.

  Diff (review ONLY these changes):
  [git diff output for frontend files]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  **React Patterns:**
  - React component patterns (hooks, state management)
  - React anti-patterns (prop explosion, setState as props)
  - TypeScript best practices (no type casting)
  - Performance (unnecessary useMemo/useCallback)

  **Code Quality:**
  - CLAUDE.md compliance (file/function length limits)
  - Dead code and unused components/imports
  - Simplification opportunities (can this be done with less code?)
  - Deprecated React patterns (class components, legacy lifecycle, old context API)
  - Duplication across components (extract to shared hooks/utils)
  - Modern alternatives (old lodash usage when native methods exist, etc.)

  **Testing:**
  - Testing considerations
  - Missing test coverage for critical paths

  Include the Shared Agent Output Format in this prompt.
```

**UX/Accessibility Review (if frontend files):**
```
subagent_type: ux-principal
prompt: |
  Review ONLY the following frontend diff for UX and accessibility. Do NOT review unchanged code.

  Diff (review ONLY these changes):
  [git diff output for frontend files]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  - WCAG 2.1 AA compliance
  - Semantic HTML usage
  - ARIA patterns
  - Keyboard navigation
  - Focus management
  - Loading states and error handling UX

  Include the Shared Agent Output Format in this prompt.
```

**Backend Review (if backend .ts files):**
```
subagent_type: backend-principal
prompt: |
  Review ONLY the following backend diff as a principal engineer would. Do NOT review unchanged code.

  Diff (review ONLY these changes):
  [git diff output for backend files]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  **Architecture:**
  - Three-layer architecture compliance
  - API design patterns (RESTful conventions)
  - CLAUDE.md compliance (file/function length limits)

  **Code Quality:**
  - Error handling (use http-status-codes, not raw numbers)
  - Database query optimization (N+1 problems)
  - Validation (Zod/class-validator patterns)
  - Code duplication across services (extract to shared utils)
  - Unnecessary backward compatibility (old aliases, deprecated endpoints)
  - Over-complicated abstractions (unnecessary layers, premature generalization)
  - Dead code (unused handlers, orphaned utilities)

  **Simplification:**
  - Can this be done with less code?
  - Are there simpler patterns available?
  - Modern alternatives to deprecated approaches?

  Include the Shared Agent Output Format in this prompt.
```

**DevOps Review (if .tf/.yaml/Dockerfile files):**
```
subagent_type: devops-principal
prompt: |
  Review ONLY the following infrastructure diff as a principal engineer would. Do NOT review unchanged code.

  Diff (review ONLY these changes):
  [git diff output for devops files]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  **Security:**
  - Container security (non-root user)
  - Secrets management (no hardcoded secrets)

  **Best Practices:**
  - Multi-stage Docker builds
  - Kubernetes resource limits
  - Terraform variable validation
  - CI/CD best practices

  **Code Quality:**
  - Duplication across Terraform modules
  - Unused resources or configurations
  - Simplification opportunities
  - Deprecated patterns or images

  Include the Shared Agent Output Format in this prompt.
```

**AI/ML Review (if AI-related files):**
```
subagent_type: ai-principal
prompt: |
  Review ONLY the following AI/ML diff as a principal engineer would. Do NOT review unchanged code.

  Diff (review ONLY these changes):
  [git diff output for AI-related files]

  IMPORTANT: Only review the lines shown in the diff (+ and - lines).
  Do NOT comment on existing code that wasn't changed in this branch.

  Focus on:
  **Security & Reliability:**
  - Prompt injection prevention
  - Error handling and retries
  - Rate limiting

  **Best Practices:**
  - OpenAI integration patterns
  - Token management
  - Streaming implementation
  - Cost optimization

  **Code Quality:**
  - Duplicated prompt logic (extract to templates)
  - Hardcoded model names (use config)
  - Simplification opportunities
  - Deprecated API usage

  Include the Shared Agent Output Format in this prompt.
```

### Step 4: Aggregate Results

Combine findings from all agents and group by prefix. Each finding should have:
- A concise **comment** (paste-ready for PR/MR)
- A detailed **explanation** (extra context, why it matters, how to fix)

Group findings by prefix in this order:
1. `[Blocker]` - MUST fix before merge
2. `[Nice to have]` - SHOULD fix
3. `[Suggestion]` - Consider fixing
4. `[Need to check]` - Verify/explain
5. `[Question]` - Needs clarification

### Step 5: Create Todo List

Use TodoWrite to track [Blocker] and [Nice to have] issues for resolution.

## Output Format

The output must use the same prefix format as `/gitlab-review`, but with extra explanation for each finding. Comments should be ready to copy-paste into a PR/MR.

```markdown
## Code Review Report

### Branch Info
- **Branch**: feature/xyz
- **Base**: main
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
- frontend-principal
- [list only agents that were spawned]

### Summary
- [Blocker]: X
- [Nice to have]: X
- [Suggestion]: X
- [Need to check]: X
- [Question]: X

---

### [Blocker] - Must fix before merge

---

**File**: `src/services/userService.ts`
**Code**: `return user as UserDTO`

**Comment (ready to paste):**
> [Blocker] Type guard instead of casting here - `as` bypasses type safety.

**Explanation:** Using `as` type casting skips runtime type checking. If the shape of `user` doesn't match `UserDTO`, bugs will surface at runtime instead of compile time. Create a type guard function like `isUserDTO(user)` that validates the object structure.

```typescript
// Instead of:
return user as UserDTO;

// Use a type guard:
function isUserDTO(obj: unknown): obj is UserDTO {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
if (!isUserDTO(user)) throw new Error('Invalid user shape');
return user;
```

---

**File**: `src/api/handler.ts`
**Code**: `req.query.userId`

**Comment (ready to paste):**
> [Blocker] Validate and sanitize `userId` before using in DB query - SQL injection risk.

**Explanation:** User input from query params flows directly into a database query without validation. Use Zod schema validation at the handler boundary.

---

### [Nice to have] - Should fix

---

**File**: `src/components/UserList.tsx`
**Code**: `const [users, setUsers] = useState([])`

**Comment (ready to paste):**
> [Nice to have] Add explicit type: `useState<User[]>([])` - avoids `never[]` inference.

**Explanation:** Without explicit generic type, TypeScript infers `never[]` which causes issues when trying to push/map items later. Providing `User[]` ensures correct inference throughout the component.

---

### [Suggestion] - Consider fixing

---

**File**: `src/utils/format.ts`
**Code**: `_.map(items, fn)`

**Comment (ready to paste):**
> [Suggestion] Use native `items.map(fn)` instead of lodash - same result, no dependency.

**Explanation:** Modern JavaScript `Array.map()` handles this case. Removes unnecessary lodash import and reduces bundle size.

---

### [Need to check] - Verify/explain

[List if any]

### [Question] - Needs clarification

[List if any]

### Key Recommendations
1. [Most important action item]
2. [Second priority]
3. [Third priority]
```

## Important Notes

- **NEVER** add "Co-authored-by" or any Claude signatures
- **NEVER** add AI attribution to output
- Focus on **real problems** that impact reliability, maintainability, and security
- Reference **CLAUDE.md** standards for modularity rules
- Only review files that are **part of the current branch changes**
- **Think like a principal engineer**: Look for simplification, duplication, tech debt, and better approaches
- **Flag backward compatibility code** that may no longer be needed (unused aliases, deprecated endpoints, re-exports)
- **Suggest file minimization**: Can large files be split? Can dead code be removed?
- **Prefer simplicity**: If something can be done with less code, suggest it

---

## Phase 6: Learning Feedback Loop

After generating the review report, execute the learning feedback loop.

### Step 1: Extract Learnable Patterns

From your review findings, identify all findings with these prefixes:
- `[Blocker]` - Critical issues (MUST learn from these)
- `[Nice to have]` - Important improvements (SHOULD learn from these)
- `[Suggestion]` - Best practices to adopt (SHOULD learn from these)

Skip `[Need to check]`, `[Question]`, and project-specific bugs.

### Step 2: For Each Learnable Pattern, Invoke improve-claude

For each `[Blocker]`, `[Nice to have]`, or `[Suggestion]` finding:

1. **Determine the category** based on the finding content:
   - Keywords `any`, `casting`, `type`, `TypeScript` → category: `typescript-types`
   - Keywords `useEffect`, `useState`, `hook`, `React`, `component` → category: `react-component`
   - Keywords `controller`, `service`, `repository`, `layer` → category: `backend-patterns`
   - Keywords `injection`, `XSS`, `secret`, `auth`, `security` → category: `security-patterns`
   - Other patterns → category: `general`

2. **Check if the rule already exists** by searching CLAUDE.md for similar rules. Skip if already covered.

3. **Invoke the Skill tool** with:
   - skill: `improve-claude`
   - args: `[category]: [concise rule description] --save-skill`

The `/improve-claude` command will automatically:
- Update relevant config files (CLAUDE.md, agents, skills)
- Integrate the pattern into the appropriate existing domain skill (styling-rtl, react-component, etc.)

### Step 3: Report Learning Results

Include in your final output to the user:

```
## Learning Feedback Loop

**Patterns Found:** [count]
**Rules Applied:** [list of rules added via improve-claude]
**Skills Updated:** [list of domain skills updated]
```

If no patterns were learned, report: "No learnable patterns identified in this review (no Blocker, Nice-to-have, or Suggestion findings)."

---

## Phase 7: Create Follow-up TODOs (Optional)

If critical or high-priority issues were found, create TODO items to track resolution.

### Step 1: Identify Actionable Items

From the review findings, identify:
- `[Blocker]` issues that need code changes
- `[Nice to have]` improvements worth tracking
- Technical debt items for future sprints

### Step 2: Create TODOs

Use TodoWrite to track each actionable item with:
- Clear description of the fix needed
- File and line reference
- Priority based on severity tier (in_progress for blockers, pending for others)

### Step 3: Report TODOs Created

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
