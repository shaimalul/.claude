---
description: Predictive Code Analysis
allowed-tools: Task, Read, Grep, Glob, TodoWrite
---

# Predictive Code Analysis

Use specialist agents to predict potential problems before they impact your project.

## Instructions

Use the **Task tool** to spawn analysis agents in parallel:

**Security Risk Analysis:**
```
subagent_type: security-principal
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
  - Likelihood and impact
  - Timeline estimate for when this becomes a problem
  - Prevention recommendations
```

**Architecture Risk Analysis:**
```
subagent_type: architect-principal
prompt: |
  Predict architectural issues that will cause problems at scale.

  Look for:
  - Patterns that break at 10x, 100x scale
  - Tight coupling that will block refactoring
  - Single points of failure
  - Technical debt accumulation
  - Integration brittleness

  For each prediction:
  - Risk level (Critical/High/Medium/Low)
  - Scale threshold where this breaks
  - Impact on system reliability
  - Remediation recommendations
```

**Performance Risk Analysis:**
```
subagent_type: backend-principal (for backend) OR frontend-principal (for frontend)
prompt: |
  Predict performance issues that will degrade at scale.

  Look for:
  - O(n²) algorithms in critical paths
  - Memory leak patterns
  - N+1 database queries
  - Inefficient rendering (frontend)
  - Missing caching opportunities

  For each prediction:
  - Risk level (Critical/High/Medium/Low)
  - Current impact vs. impact at 10x load
  - Timeline for degradation
  - Optimization recommendations
```

## Output Format

```markdown
## Predictive Analysis Report

### Summary
- **Critical Risks**: X
- **High Risks**: X
- **Medium Risks**: X
- **Total Predictions**: X

### Critical Risks (Address Immediately)
| Area | Issue | Timeline | Impact |
|------|-------|----------|--------|
| Security | ... | ... | ... |
| Architecture | ... | ... | ... |

### High Risks (Address Soon)
| Area | Issue | Timeline | Impact |
|------|-------|----------|--------|
| ... | ... | ... | ... |

### Medium Risks (Plan for Future)
| Area | Issue | Timeline | Impact |
|------|-------|----------|--------|
| ... | ... | ... | ... |

### Prevention Recommendations
1. [Highest priority action]
2. [Second priority action]
3. [Third priority action]

### Timeline View
- **Now**: [Issues that need immediate attention]
- **1-3 months**: [Issues that will emerge soon]
- **3-6 months**: [Issues at growth scale]
```

**Important**:
- NEVER add AI attribution to output
- Focus on actionable, specific predictions with evidence
