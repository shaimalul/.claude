---
name: quality-gate
description: Run comprehensive quality checks including security, performance, and architecture compliance
disable-model-invocation: true
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
  Review for: OWASP Top 10 compliance, secrets exposure, input validation,
  SQL injection / XSS vulnerabilities, authentication/authorization issues.
  Return a checklist with Pass/Fail for each item.
```

**Code Standards Check:**
```
subagent_type: frontend-principal (for React/TS) OR backend-principal (for Node.js)
prompt: |
  Run CLAUDE.md compliance checks.
  Verify: File length (150 lines max), function length (30 lines max),
  three-layer architecture, named exports, no barrel files, no type casting,
  no any/unknown, http-status-codes package usage.
  Return a checklist with Pass/Fail and specific violations.
```

**Architecture Check:**
```
subagent_type: architect-principal
prompt: |
  Run architecture quality gate checks.
  Review for: Layer separation, N+1 queries, caching, scalability patterns.
  Return a checklist with Pass/Fail and architectural concerns.
```

### Phase 3: Predictive Analysis

Spawn prediction agents for security risks, architecture risks, and performance risks.

### Phase 4: Generate Report

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

### Code Standards
| Check | Status | Notes |
|-------|--------|-------|

### Architecture
| Check | Status | Notes |
|-------|--------|-------|

### Predictive Analysis
| Area | Risk | Timeline | Impact | Mitigation |
|------|------|----------|--------|------------|

### Recommendations
1. [Critical fixes required]
2. [High priority improvements]
```
