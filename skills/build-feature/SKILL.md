---
name: build-feature
description: Execute the planned feature by delegating to specialist agents
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write, MultiEdit
model: sonnet
disable-model-invocation: true
---

# Build Feature

Use the **Task tool** to invoke the `mastermind-agent` agent for feature execution.

## Prerequisites
- A feature plan should exist (created via `plan-task` skill)
- Or provide a feature description to plan and build in one go

## Instructions

Spawn the mastermind-agent agent using the Task tool:

**Task tool invocation:**
```
subagent_type: mastermind-agent
prompt: |
  Execute the planned feature.

  As the mastermind agent, you should:

  1. **Load Plan**
     - Check conversation history for existing feature plan
     - Verify all tasks are defined with dependencies
     - If no plan exists, ask user to run plan-task skill first

  2. **Execute by Phase**
     For each phase (in dependency order):
     - Identify tasks with satisfied dependencies
     - Delegate to appropriate specialist via Task tool:

     Task tool invocation for specialists:
     ```
     subagent_type: {specialist}-agent
     prompt: |
       ## Task: [Task Name]

       ### Context
       [Background from feature plan]

       ### Requirements
       [Specific requirements for this task]

       ### Expected Output
       [What you should deliver]

       ### Standards
       - Follow CLAUDE.md guidelines
       - [Domain-specific standards]
     ```

     - Collect and review outputs
     - Mark tasks as complete

  3. **Quality Gates**
     After each phase:
     - Run relevant tests
     - Verify integration works
     - Address any issues before proceeding

  4. **Final Integration**
     - Ensure all components work together
     - Run full quality gate: tests → TypeScript → lint → build
     - Generate completion summary
```

The mastermind-agent agent has access to:
- **Tools**: Read, Grep, Glob, Bash, Edit, Write, Task
- **Specialists**: All specialist agents via Task tool delegation:
  - frontend-agent (React, components, hooks)
  - backend-agent (APIs, services, databases)
  - ai-agent (LLM features, prompts)
  - devops-agent (infrastructure, CI/CD)
  - security-agent (auth, security review)
  - architect-agent (design decisions)

## Output Format

The agent should return a build report:

```markdown
## Build Report: [Feature Name]

### Execution Summary
| Phase | Tasks | Status |
|-------|-------|--------|
| 1 | X | Complete |
| 2 | Y | Complete |
| 3 | Z | Complete |

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
- Code Standards: Pass/Fail
- Security: Pass/Fail
- Tests: Pass/Fail
- Build: Pass/Fail

### Next Steps
- [Any follow-up actions needed]
```

Return the mastermind-agent's full build report to the user.
