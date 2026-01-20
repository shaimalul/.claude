# Code Review

Perform comprehensive code review using specialist agents in parallel.

## Instructions

Use the **Task tool** to spawn multiple specialist agents for parallel review.

### Step 1: Identify Files to Review

Use Grep/Glob to identify changed files or target files in the current context.

### Step 2: Spawn Specialist Reviews in Parallel

Launch these agents simultaneously using the Task tool:

**Security Review:**
```
subagent_type: security-principal
prompt: |
  Review the code for security issues.

  Focus on:
  - OWASP Top 10 vulnerabilities
  - Credential exposure
  - Input validation
  - SQL injection / XSS
  - Authentication/authorization issues

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the vulnerability
  - Remediation steps
```

**Code Quality Review (for frontend files .tsx/.jsx/.ts):**
```
subagent_type: frontend-principal
prompt: |
  Review the React/TypeScript code for quality issues.

  Focus on:
  - Component patterns (hooks, state management)
  - CLAUDE.md compliance (file length, modularity)
  - React anti-patterns
  - TypeScript best practices
  - Testing considerations

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the issue
  - Recommended fix
```

**Architecture Review (for backend files):**
```
subagent_type: backend-principal
prompt: |
  Review the backend code for architecture issues.

  Focus on:
  - Three-layer architecture compliance
  - API design patterns
  - Error handling
  - Database query optimization (N+1)
  - CLAUDE.md compliance

  For each issue found, provide:
  - Exact file and line number
  - Severity (Critical/High/Medium/Low)
  - Description of the issue
  - Recommended fix
```

### Step 3: Aggregate Results

Combine findings from all specialists into a prioritized report:

1. **Critical** - Security vulnerabilities, data exposure (blocking)
2. **High** - Architecture violations, major bugs (should fix)
3. **Medium** - Code quality issues, patterns (recommended)
4. **Low** - Style, minor improvements (nice to have)

### Step 4: Create Todo List

Use TodoWrite to track issues found for resolution.

## Output Format

```markdown
## Code Review Report

### Summary
- Files reviewed: X
- Critical issues: X
- High priority: X
- Medium priority: X
- Low priority: X

### Critical Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | security-principal |

### High Priority Issues
| File | Line | Issue | Agent |
|------|------|-------|-------|
| ... | ... | ... | ... |

### Medium Priority Issues
[...]

### Recommendations
- [Key recommendation 1]
- [Key recommendation 2]
```

**Important**:
- NEVER add "Co-authored-by" or any Claude signatures
- NEVER add AI attribution to output
- Focus on real problems that impact reliability and maintainability
