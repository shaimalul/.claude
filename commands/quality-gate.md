---
description: Run comprehensive quality checks including security, performance, and architecture compliance
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
---

# Quality Gate

Run comprehensive quality checks using specialist agents and automated tools.

## Instructions

### Phase 1: Automated Checks

Run these bash commands in parallel:
```bash
npm test          # Run tests
npx tsc --noEmit  # TypeScript check
npm run lint      # Linting
npm run build     # Build verification
```

### Phase 2: Agent-Based Analysis

Use the **Task tool** to spawn specialist agents in parallel:

**Security Check:**
```
subagent_type: security-principal
prompt: |
  Run security quality gate checks.

  Review for:
  - OWASP Top 10 compliance
  - Secrets exposure (hardcoded tokens, passwords)
  - Input validation on all endpoints
  - SQL injection / XSS vulnerabilities
  - Authentication/authorization issues
  - Security headers configuration

  Return a checklist with Pass/Fail for each item and notes on any issues.
```

**Code Standards Check:**
```
subagent_type: frontend-principal (for React/TS) OR backend-principal (for Node.js)
prompt: |
  Run CLAUDE.md compliance checks.

  Verify:
  - File length limits (150 lines max)
  - Function length limits (30 lines max)
  - Three-layer architecture followed
  - Named exports (no default exports)
  - No barrel files (index.ts)
  - http-status-codes package used (no magic numbers)
  - No type casting with `as`
  - No `any` or `unknown` casting
  - Optional params use `?` not `| undefined`
  - Enums used instead of string literals for status comparisons
  - No empty catch blocks (always log errors)
  - Use `void` for ignored promises (not eslint-disable)
  - No backward compatibility wrappers in new code

  Return a checklist with Pass/Fail for each item and specific violations found.
```

**Architecture Check:**
```
subagent_type: architect-principal
prompt: |
  Run architecture quality gate checks.

  Review for:
  - Proper layer separation
  - No N+1 database queries
  - Appropriate caching
  - Scalability patterns
  - Integration point robustness

  Return a checklist with Pass/Fail for each item and architectural concerns.
```

### Phase 3: Generate Report

Aggregate all findings into a unified quality gate report.

## Output Format

```markdown
## Quality Gate Report

### Summary
- **Status**: PASS / FAIL / WARNINGS
- **Automated Checks**: X/4 passed
- **Security Issues**: X
- **Code Standards Issues**: X
- **Architecture Issues**: X

### Automated Checks
| Check | Status | Notes |
|-------|--------|-------|
| Tests | Pass/Fail | ... |
| TypeScript | Pass/Fail | ... |
| Lint | Pass/Fail | ... |
| Build | Pass/Fail | ... |

### Security (security-principal)
| Check | Status | Notes |
|-------|--------|-------|
| OWASP Top 10 | Pass/Fail | ... |
| Secrets exposure | Pass/Fail | ... |
| Input validation | Pass/Fail | ... |

### Code Standards (frontend/backend-principal)
| Check | Status | Notes |
|-------|--------|-------|
| File length | Pass/Fail | ... |
| Three-layer arch | Pass/Fail | ... |
| Export patterns | Pass/Fail | ... |
| Optional param syntax | Pass/Fail | ... |
| Enums vs strings | Pass/Fail | ... |
| Empty catch blocks | Pass/Fail | ... |
| Floating promises | Pass/Fail | ... |

### Architecture (architect-principal)
| Check | Status | Notes |
|-------|--------|-------|
| Layer separation | Pass/Fail | ... |
| Query optimization | Pass/Fail | ... |

### Recommendations
1. [Critical fixes required]
2. [High priority improvements]
3. [Nice to have enhancements]
```
