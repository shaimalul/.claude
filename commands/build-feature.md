---
description: Execute the planned feature by delegating to specialist principal engineers
---

# Build Feature

Execute a previously planned feature by delegating tasks to specialist principal engineers.

## Prerequisites
- A feature plan should exist (created via `/plan-feature`)
- Or provide a feature description to plan and build in one go

## Execution Process

### 1. Load Plan
- Retrieve the current feature plan
- Verify all tasks are defined
- Confirm dependencies are clear

### 2. Execute by Phase
For each phase (in order):
1. Identify tasks with satisfied dependencies
2. Delegate to appropriate specialist agent
3. Review and integrate outputs
4. Mark tasks as complete

### 3. Quality Gates
After each phase:
- Run relevant quality checks
- Verify integration works
- Address any issues before proceeding

### 4. Final Integration
- Ensure all components work together
- Run full quality gate
- Generate completion summary

## Delegation Template

When delegating to a specialist:
```
## Task: [Task Name]

### Context
[Background from feature plan]

### Requirements
[Specific requirements for this task]

### Expected Output
[What the specialist should deliver]

### Dependencies
[Outputs from previous tasks this relies on]

### Standards
- Follow CLAUDE.md guidelines
- [Domain-specific standards]
```

## Output Format

```markdown
## Build Report: [Feature Name]

### Execution Summary
| Phase | Tasks | Status |
|-------|-------|--------|
| 1 | X | ✅ Complete |
| 2 | Y | ✅ Complete |
| 3 | Z | ✅ Complete |

### Tasks Completed

#### Phase 1
- [x] Task 1 - [Brief summary]
- [x] Task 2 - [Brief summary]

#### Phase 2
- [x] Task 3 - [Brief summary]

### Files Modified
- `path/to/file1.ts` - [Change summary]
- `path/to/file2.ts` - [Change summary]

### Quality Gate Results
- Code Standards: ✅
- Security: ✅
- Tests: ✅

### Next Steps
- [Any follow-up actions needed]
```

## Instructions

1. If a plan exists, load it and begin execution
2. If no plan exists, ask for the feature description or run `/plan-feature` first
3. Execute tasks in dependency order
4. Delegate each task to the appropriate specialist
5. Integrate outputs and run quality checks
6. Generate completion report

Begin building the planned feature.
