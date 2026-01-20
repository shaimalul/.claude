---
description: Code Review with Project Agents
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
---

# Code Review with Project Agents

Review code changes using project-specific agents from `.claude/agents` and standard principal agents.

## Instructions

### Step 1: Discover Project Agents

```bash
find . -path "*/.claude/agents/*.md" -type f 2>/dev/null | head -20
ls -la .claude/agents/ 2>/dev/null || echo "No .claude/agents directory found"
```

### Step 2: Check Project Standards

```bash
find . -path "*/.cursor/rules*" -type f 2>/dev/null | head -10
```

### Step 3: Identify Changes

```bash
git status
git diff --stat
```

### Step 4: Spawn Project Agents via Task Tool

For each discovered project agent, use the **Task tool**:

**For custom agents in .claude/agents/:**
```
subagent_type: {agent-name-from-file}
prompt: |
  Review the code changes according to your expertise.

  Changes to review:
  [Include git diff output or file list]

  Provide findings with:
  - Exact file and line numbers
  - Issue description
  - Recommended fix
```

### Step 5: Spawn Standard Agents as Fallback/Complement

Use the **Task tool** to spawn standard principal agents in parallel:

**Security Review:**
```
subagent_type: security-principal
prompt: |
  Review code changes for security issues.

  Focus on:
  - OWASP Top 10 vulnerabilities
  - Credential exposure
  - Input validation
  - Authentication/authorization
```

**Code Quality Review:**
```
subagent_type: frontend-principal (for .tsx/.jsx files)
OR
subagent_type: backend-principal (for .ts/.js service/controller files)
prompt: |
  Review code changes for quality issues.

  Focus on:
  - CLAUDE.md compliance
  - Component patterns (frontend)
  - Three-layer architecture (backend)
  - Testing considerations
```

### Step 6: Aggregate Findings

Combine findings from:
- Project-specific agents (custom agents found in .claude/agents/)
- Standard principal agents (security, frontend, backend)

Prioritize by:
1. **Critical** - Security vulnerabilities (blocking)
2. **High** - Architecture violations (should fix)
3. **Medium** - Code quality issues (recommended)
4. **Low** - Style improvements (nice to have)

### Step 7: Create Todo List

Use TodoWrite to track issues for resolution.

## Output Format

```markdown
## Code Review Report (with Project Agents)

### Agents Used
- [Custom Agent 1 from .claude/agents/]
- [Custom Agent 2 from .claude/agents/]
- security-principal (standard)
- frontend-principal / backend-principal (standard)

### Summary
- Files reviewed: X
- Critical issues: X
- High priority: X
- Total findings: X

### Findings by Agent

#### [Custom Agent Name]
| File | Line | Issue | Severity |
|------|------|-------|----------|
| ... | ... | ... | ... |

#### security-principal
| File | Line | Issue | Severity |
|------|------|-------|----------|
| ... | ... | ... | ... |

### Recommendations
1. [Priority action 1]
2. [Priority action 2]
```

**Important**:
- NEVER add AI attribution or signatures
- NEVER modify git config or repository settings
- Focus on real problems that impact reliability
