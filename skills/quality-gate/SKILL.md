---
name: quality-gate
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
subagent_type: security-agent
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
subagent_type: frontend-agent (for React/TS) OR backend-agent (for Node.js)
prompt: |
  Run CLAUDE.md compliance checks.

  Verify:
  - File length limits (150 lines max)
  - Function length limits (30 lines max)
  - Three-layer architecture followed
  - Named exports (no default exports)
  - No barrel files (index.ts)
  - All imports at file top (no dynamic import() or require() inside functions/blocks)
  - http-status-codes package used (no magic numbers)
  - No type casting with `as`
  - No `any` or `unknown` casting
  - Optional params use `?` not `| undefined`
  - Enums used instead of string literals for status comparisons
  - No duplicate types (use indexed access patterns like `Type["property"]`)
  - Type inheritance from source types (Pick, Omit, Partial)
  
  Single Source of Truth (SSOT):
  - No duplicate constants (same value defined in multiple files)
  - No duplicate logic (same calculation in multiple functions)
  - No copied types (use indexed access Type["property"] or Pick/Omit)
  - All enums defined once and imported, not string literals
  - Configuration values in one location, not hardcoded
  - No empty catch blocks (always log errors)
  - Use `void` for ignored promises (not eslint-disable)
  - No backward compatibility wrappers in new code

  Boundary testing compliance:
  - No vi.mock() of HTTP client libraries (axios, fetch, got, ky)
  - No vi.mock() of internal services or repositories
  - No vi.spyOn() on library methods (axios.get, prisma.user.findMany)
  - HTTP mocking uses MSW (frontend) or nock (backend) at network boundary
  - Tests pass the Library Swap Test (swap axios for fetch, tests still pass)

  Design system detection:
  - If a design system is in package.json, verify its components preferred over native HTML equivalents
  - Component props match the library's documented API (not guessed)

  For SCSS/CSS files:
  - Spacing uses shared variables (not px) for margin, padding, width, height, gap, sizing
  - No hardcoded px values for spacing/sizing properties - use design system variables
  - Custom spacing values defined as SCSS variables
  - Colors use design system palettes: UI tokens for UI, a separate categorical palette for charts
  - When no exact palette color exists, closest matching color selected from palette
  - NEVER use token names that don't exist in the package - all tokens verified against the design system source
  - Typography prefers the design system scale; custom values only when no matching scale
  - Logical CSS properties used (padding-inline-start, margin-inline-end, text-align: start) for RTL

  Return a checklist with Pass/Fail for each item and specific violations found.
```

**Architecture Check:**
```
subagent_type: architect-agent
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

### Phase 3: Predictive Analysis

Use the **Task tool** to spawn prediction agents in parallel to identify potential future issues:

**Security Risk Prediction:**
```
subagent_type: security-agent
prompt: |
  Predict potential security issues in the codebase.

  Look for:
  - Input validation gaps that will be exploited
  - Authentication weaknesses
  - Exposed secrets or credentials
  - Authorization bypass opportunities
  - Security patterns that won't scale

  For each prediction:
  - Risk level (Critical/High/Medium/Low)
  - Likelihood and timeline
  - Prevention recommendations
```

**Architecture Risk Prediction:**
```
subagent_type: architect-agent
prompt: |
  Predict architectural issues that will cause problems at scale.

  Look for:
  - Patterns that break at 10x, 100x scale
  - Tight coupling blocking refactoring
  - Single points of failure
  - Technical debt accumulation

  For each prediction:
  - Risk level (Critical/High/Medium/Low)
  - Scale threshold where this breaks
  - Remediation recommendations
```

**Performance Risk Prediction:**
```
subagent_type: backend-agent (for backend) OR frontend-agent (for frontend)
prompt: |
  Predict performance issues that will degrade at scale.

  Look for:
  - O(n^2) algorithms in critical paths
  - Memory leak patterns
  - N+1 database queries
  - Missing caching opportunities

  For each prediction:
  - Risk level and timeline
  - Current vs 10x load impact
  - Optimization recommendations
```

### Phase 4: Generate Report

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

### Security (security-agent)
| Check | Status | Notes |
|-------|--------|-------|
| OWASP Top 10 | Pass/Fail | ... |
| Secrets exposure | Pass/Fail | ... |
| Input validation | Pass/Fail | ... |

### Code Standards (frontend/backend-agent)
| Check | Status | Notes |
|-------|--------|-------|
| File length | Pass/Fail | ... |
| Three-layer arch | Pass/Fail | ... |
| Export patterns | Pass/Fail | ... |
| Optional param syntax | Pass/Fail | ... |
| Enums vs strings | Pass/Fail | ... |
| Empty catch blocks | Pass/Fail | ... |
| Floating promises | Pass/Fail | ... |

### Architecture (architect-agent)
| Check | Status | Notes |
|-------|--------|-------|
| Layer separation | Pass/Fail | ... |
| Query optimization | Pass/Fail | ... |

### Predictive Analysis

| Area | Risk | Timeline | Impact | Mitigation |
|------|------|----------|--------|------------|
| Security | ... | ... | ... | ... |
| Architecture | ... | ... | ... | ... |
| Performance | ... | ... | ... | ... |

**Timeline View:**
- **Now**: [Issues needing immediate attention]
- **1-3 months**: [Issues emerging soon]
- **3-6 months**: [Issues at growth scale]

### Recommendations
1. [Critical fixes required]
2. [High priority improvements]
3. [Nice to have enhancements]
```
