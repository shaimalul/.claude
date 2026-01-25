---
description: Code Review - Review current branch changes with principal agents
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
---

# Code Review

Comprehensive code review of **current branch changes** using all relevant principal agents in parallel.

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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the vulnerability
  - Remediation steps with code example
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the issue
  - Recommended fix with code example

  For improvement opportunities, also estimate impact (e.g., "-30 lines", "simpler logic", "removes tech debt")
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description with "Do/Don't" example
  - Impact estimate for improvements (e.g., "-20 lines", "simpler")
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the issue
  - Accessible implementation example
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description with code example
  - Impact estimate for improvements
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description with secure example
  - Impact estimate for improvements
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

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description with recommended pattern
  - Impact estimate for improvements
```

### Step 4: Aggregate Results

Combine findings from all agents into a prioritized report:

1. **Critical** - Security vulnerabilities, data exposure (BLOCKING - must fix)
2. **High** - Architecture violations, major bugs (should fix before merge)
3. **Medium** - Code quality issues, patterns (recommended to fix)
4. **Low** - Style, minor improvements (nice to have)
5. **Improvement Opportunities** - Non-blocking suggestions (cleanup, simplification, better approaches)

### Step 5: Create Todo List

Use TodoWrite to track issues found for resolution.

## Output Format

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
- ux-principal
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
| component.tsx | Class component | Convert to functional with hooks | Modern pattern |
| api.ts:100 | Backward-compat endpoint `/v1/old` | Remove (deprecated 6+ months) | Cleanup |

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

## Phase 6: Learning Feedback Loop (Automated)

After generating the review report, **automatically** analyze findings to improve Claude configuration.

### Step 1: Extract Learnable Patterns

Filter findings for learning:
- **Include:** All actionable findings:
  - `[Blocker]` - Critical issues that must be fixed
  - `[Nice to have]` - Improvements worth learning
  - `[Suggestion]` - Best practices to adopt
- **Exclude:** `[Need to check]`, `[Question]`, project-specific bugs

### Step 2: Categorize and Generate Instructions

Map findings to `/improve-claude` categories and generate instructions:

| Keywords | Category | Example Instruction |
|----------|----------|---------------------|
| any, casting, type | TypeScript | "Never use 'any' - use proper types" |
| useEffect, hook, useState | Frontend | "Include all deps in useEffect array" |
| controller, service, layer | Backend | "Never skip architecture layers" |
| injection, XSS, secret | Security | "Never hardcode secrets" |

### Step 3: Invoke /improve-claude

For each learnable pattern:

```
Use Skill tool:
  skill: "improve-claude"
  args: "[Category]: [Rule] - found in [file:line]"
```

**Skip if:** Rule already exists in CLAUDE.md (search first).

### Step 4: Update Learning History

Append entry to `~/.claude/learning-history.md`:

```markdown
## [DATE] - Review: [branch]

**Source:** /review
**Patterns Learned:** [count]

| Pattern | Category | Rule |
|---------|----------|------|
| ... | ... | ... |
```

### Step 5: Report Results

Add to review output:

```markdown
## 🔄 Learning Feedback Loop

**Patterns Analyzed:** [count]
**Rules Applied:** [count]

| Pattern | Action | Target |
|---------|--------|--------|
| [desc] | Added/Skipped | [file] |
```
