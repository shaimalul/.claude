---
description: Plan a task by analyzing requirements and creating an implementation roadmap with the mastermind agent
argument-hint: [task-description]
allowed-tools: Task, Read, Grep, Glob
model: opus
---

# Task Planning

Use the **Task tool** to invoke the `mastermind` agent for comprehensive task planning.

## Task: $ARGUMENTS

## Instructions

Spawn the mastermind agent using the Task tool:

**Task tool invocation:**
```
subagent_type: mastermind
prompt: |
  Plan the implementation of this task: $ARGUMENTS

  As the mastermind principal engineer, you should:

  1. **Gather Requirements**
     - What problem does this solve?
     - Who is the user?
     - What are the acceptance criteria?
     - What are the constraints?

  2. **Domain Analysis**
     Identify which specialists are needed:
     - frontend-principal (React, TypeScript, UI/UX)
     - backend-principal (APIs, services, databases)
     - ai-principal (LLM features, prompts)
     - devops-principal (infrastructure, CI/CD)
     - security-principal (auth, vulnerabilities)
     - architect-principal (system design, patterns)

  3. **Task Breakdown**
     Create atomic tasks with:
     - Clear description
     - Expected output
     - Dependencies
     - Assigned specialist

  4. **Dependency Graph**
     Order tasks by phases:
     - Phase 1: No dependencies (can start immediately)
     - Phase 2: Depends on Phase 1
     - Phase 3: Depends on Phase 2

  5. **Output Format**
     Generate a structured plan in markdown format.
```

The mastermind agent has access to:
- **Tools**: Read, Grep, Glob, Bash, Edit, Write, Task
- **Specialists**: All principal engineers via Task tool delegation

## Output Format

The agent should return a plan in this format:

```markdown
## Task Plan: [Task Name]

### Overview
[Brief description of the task]

### User Story
As a [user type], I want to [action] so that [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Domain Involvement
| Domain | Involved | Complexity |
|--------|----------|------------|
| Frontend | Yes/No | Low/Medium/High |
| Backend | Yes/No | Low/Medium/High |
| AI | Yes/No | Low/Medium/High |
| DevOps | Yes/No | Low/Medium/High |
| Security | Yes/No | Low/Medium/High |

### Task Breakdown

#### Phase 1: Foundation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 1 | ... | ... | ... | None |

#### Phase 2: Core Implementation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 2 | ... | ... | ... | Task 1 |

### Risks & Considerations
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

### Quality Gates
- [ ] Unit tests for all new code
- [ ] Security review for sensitive features
- [ ] Performance testing if applicable
- [ ] Documentation updated
```

Return the mastermind's full plan to the user.
