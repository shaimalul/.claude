---
description: Code Review with Project Rules
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
---

# Code Review with Project Rules

Review code for compliance with project-specific rules from `.cursor/rules`.

## Instructions

### Step 1: Discover Project Rules

```bash
find . -name ".cursor" -type d 2>/dev/null | head -5
find . -path "*/.cursor/rules*" -type f 2>/dev/null | head -10
```

Read discovered rules files to understand project conventions.

### Step 2: Identify Changes

```bash
git status
git diff --stat
```

### Step 3: Spawn Standard Agents with Rules Context

Use the **Task tool** to spawn principal agents with project rules context:

**Frontend Review (for React/TypeScript files):**
```
subagent_type: frontend-principal
prompt: |
  Review code changes for compliance with project rules and standards.

  **Project Rules (from .cursor/rules):**
  [Include content from discovered rules files]

  **Focus on:**
  - Compliance with project-specific conventions
  - CLAUDE.md standards
  - React patterns and hooks usage
  - TypeScript best practices
  - Component structure

  Highlight which findings relate to project rules vs. general standards.
```

**Backend Review (for Node.js/service files):**
```
subagent_type: backend-principal
prompt: |
  Review code changes for compliance with project rules and standards.

  **Project Rules (from .cursor/rules):**
  [Include content from discovered rules files]

  **Focus on:**
  - Compliance with project-specific conventions
  - Three-layer architecture
  - API design patterns
  - Error handling
  - Database patterns

  Highlight which findings relate to project rules vs. general standards.
```

**Security Review:**
```
subagent_type: security-principal
prompt: |
  Review code changes for security issues.

  Focus on:
  - OWASP Top 10 vulnerabilities
  - Credential exposure
  - Input validation
  - Authentication patterns
```

### Step 4: Aggregate Findings

Categorize findings by source:
- **Project Rules Violations** - Issues from .cursor/rules
- **General Standards Violations** - Issues from CLAUDE.md
- **Security Issues** - OWASP/security concerns

Prioritize by:
1. **Critical** - Security vulnerabilities
2. **High** - Project rules violations
3. **Medium** - General standards violations
4. **Low** - Style improvements

### Step 5: Create Todo List

Use TodoWrite to track issues for resolution.

## Output Format

```markdown
## Code Review Report (with Project Rules)

### Project Rules Loaded
- [Rule file 1]: [Brief description]
- [Rule file 2]: [Brief description]

### Summary
- Files reviewed: X
- Project rules violations: X
- General standards violations: X
- Security issues: X

### Project Rules Violations
| File | Line | Rule | Issue |
|------|------|------|-------|
| ... | ... | [rule name] | ... |

### General Standards Violations
| File | Line | Standard | Issue |
|------|------|----------|-------|
| ... | ... | CLAUDE.md | ... |

### Security Issues
| File | Line | Issue | Severity |
|------|------|-------|----------|
| ... | ... | ... | Critical/High/Medium |

### Recommendations
1. [Priority action for project rules]
2. [Priority action for standards]
3. [Priority action for security]
```

**Important**:
- NEVER add AI attribution or signatures
- NEVER modify git config or repository settings
- Focus on real problems that impact reliability
