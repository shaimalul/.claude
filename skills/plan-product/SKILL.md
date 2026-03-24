---
name: plan-product
description: Plan a product feature by analyzing market fit, user needs, and business value with the product-principal agent
argument-hint: [product-idea-or-feature]
disable-model-invocation: true
allowed-tools: Task, Read, Grep, Glob
model: opus
---

# Product Planning

Use the **Task tool** to invoke the `product-principal` agent for comprehensive product analysis.

## Task: $ARGUMENTS

## Instructions

Spawn the product-principal agent using the Task tool:

```
subagent_type: product-principal
prompt: |
  Analyze this product idea/feature: $ARGUMENTS

  As the product-principal, you should:

  1. **Problem Discovery**
     - What problem does this solve?
     - Who has this problem? (define persona)
     - How painful is this problem?
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
```

## Output Format

```markdown
## Product Plan: [Feature/Product Name]

### Problem Statement
[Clear articulation of the problem]

### Target Users
| Persona | Role | Pain Point | Current Workaround |
|---------|------|------------|--------------------|

### Success Metrics
| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|

### MVP Scope
| # | Feature | RICE Score | MoSCoW | Dependencies |
|---|---------|-----------|--------|--------------|

### Risks and Mitigations
| Risk | Category | Likelihood | Impact | Mitigation |
|------|----------|-----------|--------|------------|

### Recommended Next Steps
- [Immediate action 1]
- [Immediate action 2]
```

Return the product-principal's full product plan to the user.
