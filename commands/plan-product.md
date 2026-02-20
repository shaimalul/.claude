---
description: Plan a product feature by analyzing market fit, user needs, and business value with the product-principal agent
argument-hint: [product-idea-or-feature]
allowed-tools: Task, Read, Grep, Glob
model: opus
---

# Product Planning

Use the **Task tool** to invoke the `product-principal` agent for comprehensive product analysis.

## Task: $ARGUMENTS

## Instructions

Spawn the product-principal agent using the Task tool:

**Task tool invocation:**
```
subagent_type: product-principal
prompt: |
  Analyze this product idea/feature: $ARGUMENTS

  As the product-principal, you should:

  1. **Problem Discovery**
     - What problem does this solve?
     - Who has this problem? (define persona)
     - How painful is this problem? (frequency, severity)
     - How are users solving it today?

  2. **Value Proposition**
     - What unique value does this provide?
     - Why would users switch from current solutions?
     - What is the enterprise angle?

  3. **Success Metrics**
     - What is the North Star Metric?
     - What are the leading indicators?
     - What does success look like at 30/60/90 days?

  4. **MVP Scope**
     - What is the minimum feature set?
     - What is explicitly out of scope?
     - What experiments validate the riskiest assumptions?

  5. **Feature Prioritization**
     - RICE score for each feature in scope
     - MoSCoW categorization
     - Dependencies between features

  6. **Risks and Mitigations**
     - Product risks (adoption, market fit)
     - Technical risks (feasibility, scalability)
     - Enterprise risks (compliance, integration)

  7. **Go-to-Market Considerations**
     - Target segment and launch strategy
     - Pricing considerations
     - Rollout plan (beta, GA, enterprise)

  8. **Output Format**
     Generate a structured product plan in markdown format.
```

The product-principal agent has access to:
- **Tools**: Read, Grep, Glob, Bash
- **Skill**: product-management (prioritization frameworks, metrics, PRD templates)

## Output Format

The agent should return a plan in this format:

```markdown
## Product Plan: [Feature/Product Name]

### Problem Statement
[Clear articulation of the problem and who has it]

### Target Users
| Persona | Role | Pain Point | Current Workaround |
|---------|------|------------|--------------------|
| ... | ... | ... | ... |

### Value Proposition
[Why this solution, why now, why us]

### Success Metrics
| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| North Star: ... | ... | ... | ... |
| Leading: ... | ... | ... | ... |

### MVP Scope

#### In Scope
| # | Feature | RICE Score | MoSCoW | Dependencies |
|---|---------|-----------|--------|--------------|
| 1 | ... | ... | Must | None |

#### Out of Scope (Deferred)
- [Feature] - Reason for deferral

### Risks and Mitigations
| Risk | Category | Likelihood | Impact | Mitigation |
|------|----------|-----------|--------|------------|
| ... | Product/Tech/Enterprise | ... | ... | ... |

### Go-to-Market
- Target Segment: [Who first]
- Launch Strategy: [Beta/GA/Enterprise rollout]
- Pricing: [Model considerations]

### Enterprise Considerations
- [ ] SSO/SAML requirements
- [ ] Compliance needs
- [ ] Multi-tenant implications
- [ ] SLA commitments

### Recommended Next Steps
- [Immediate action 1]
- [Immediate action 2]
```

Return the product-principal's full product plan to the user.
