---
description: Run comprehensive quality checks including security, performance, and architecture compliance
---

# Quality Gate

Run comprehensive quality checks on the current codebase or recent changes.

## Checks to Perform

### 1. Code Standards (CLAUDE.md Compliance)
- [ ] Three-layer architecture followed
- [ ] File length limits respected (150 lines)
- [ ] Function length limits respected (30 lines)
- [ ] Named exports used (no default exports)
- [ ] http-status-codes package used (no magic numbers)
- [ ] No type casting with `as`

### 2. Security Review
- [ ] Input validation on all endpoints
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Secrets not hardcoded
- [ ] Authentication/authorization proper
- [ ] Security headers configured

### 3. Performance Check
- [ ] No N+1 database queries
- [ ] Proper indexing on queried fields
- [ ] Caching where appropriate
- [ ] Bundle size reasonable (frontend)
- [ ] No memory leaks

### 4. Test Coverage
- [ ] Unit tests for business logic
- [ ] Integration tests for APIs
- [ ] Critical paths tested
- [ ] Edge cases covered

### 5. Documentation
- [ ] API endpoints documented
- [ ] Complex logic commented
- [ ] README updated if needed

## Instructions

1. Review recent changes or specified files
2. Run through each check category
3. Identify any violations or concerns
4. Provide actionable recommendations

## Output Format

```markdown
## Quality Gate Report

### Summary
- **Status**: PASS / FAIL / WARNINGS
- **Issues Found**: X
- **Warnings**: Y

### Code Standards
| Check | Status | Notes |
|-------|--------|-------|
| ... | ✅/❌ | ... |

### Security
| Check | Status | Notes |
|-------|--------|-------|
| ... | ✅/❌ | ... |

### Performance
| Check | Status | Notes |
|-------|--------|-------|
| ... | ✅/❌ | ... |

### Test Coverage
| Check | Status | Notes |
|-------|--------|-------|
| ... | ✅/❌ | ... |

### Recommendations
1. [High priority fixes]
2. [Medium priority improvements]
3. [Nice to have enhancements]
```

Run the quality gate on recent changes or the specified scope.
