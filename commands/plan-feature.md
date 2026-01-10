---
description: Plan a new feature by analyzing requirements and creating an implementation roadmap with the mastermind agent
argument-hint: [feature-description]
---

# Feature Planning

You are the mastermind principal engineer. Plan the implementation of a new feature by breaking it down into domain-specific tasks.

## Feature Request: $ARGUMENTS

## Planning Process

### 1. Requirement Analysis
- What problem does this solve?
- Who is the user?
- What are the acceptance criteria?
- What are the constraints?

### 2. Domain Breakdown
Identify which domains are involved:
- [ ] **Frontend**: UI components, user interactions
- [ ] **Backend**: APIs, services, data models
- [ ] **AI**: LLM features, prompts, embeddings
- [ ] **DevOps**: Infrastructure, deployment, monitoring
- [ ] **Security**: Auth, validation, vulnerabilities

### 3. Task Definition
For each domain, create specific tasks with:
- Clear description
- Expected output
- Dependencies
- Estimated complexity

### 4. Dependency Graph
Order tasks by dependencies:
- Phase 1: No dependencies (can start immediately)
- Phase 2: Depends on Phase 1
- Phase 3: Depends on Phase 2
- etc.

## Output Format

```markdown
## Feature Plan: [Feature Name]

### Overview
[Brief description of the feature]

### User Story
As a [user type], I want to [action] so that [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Domain Involvement
| Domain | Involved | Complexity |
|--------|----------|------------|
| Frontend | ✅/❌ | Low/Medium/High |
| Backend | ✅/❌ | Low/Medium/High |
| AI | ✅/❌ | Low/Medium/High |
| DevOps | ✅/❌ | Low/Medium/High |
| Security | ✅/❌ | Low/Medium/High |

### Task Breakdown

#### Phase 1: Foundation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 1 | ... | ... | ... | None |

#### Phase 2: Core Implementation
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 2 | ... | ... | ... | Task 1 |

#### Phase 3: Integration
| # | Domain | Task | Complexity | Dependencies |
|---|--------|------|------------|--------------|
| 3 | ... | ... | ... | Tasks 1, 2 |

### Risks & Considerations
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

### Quality Gates
- [ ] Unit tests for all new code
- [ ] Security review for sensitive features
- [ ] Performance testing if applicable
- [ ] Documentation updated
```

Now analyze and plan the feature: $ARGUMENTS
