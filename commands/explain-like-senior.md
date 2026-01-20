---
description: Senior Developer Explanation
argument-hint: [code-path-or-topic]
allowed-tools: Task, Read, Grep, Glob
---

# Senior Developer Explanation

Use the **Task tool** to invoke the `architect-principal` agent for senior-level code explanation.

## Topic: $ARGUMENTS

## Instructions

Spawn the architect-principal agent:

**Task tool invocation:**
```
subagent_type: architect-principal
prompt: |
  Explain this code/topic as a senior developer would: $ARGUMENTS

  Provide:

  **Technical Context:**
  - Why this approach was chosen over alternatives
  - Trade-offs and architectural decisions made
  - Performance implications and considerations
  - Maintenance and scalability factors

  **Business Context:**
  - How this fits into the larger system architecture
  - Impact on user experience and business goals
  - Cost implications and resource considerations

  **Senior-Level Insights:**
  - "This pattern works now but will need refactoring at 10x scale"
  - "The complexity here is justified because of [specific requirement]"
  - "This is a common anti-pattern, but acceptable given [constraints]"

  **Experience-Based Guidance:**
  - Common pitfalls junior developers miss
  - Edge cases that cause issues in production
  - Integration points that often fail
  - Performance bottlenecks at scale

  **Mentoring Approach:**
  - Explain not just WHAT the code does but WHY it exists
  - Point out subtle details affecting long-term maintenance
  - Share lessons learned from similar implementations
  - Provide actionable next steps for improvement

  **Code Evolution Perspective:**
  - How this code will likely change as requirements evolve
  - Technical debt considerations and when to address them
  - Refactoring opportunities and priority levels
```

The architect-principal agent has access to:
- **Skills**: architect (system design, patterns, ADRs)
- **Tools**: Read, Grep, Glob, Bash

## Output Format

The agent should provide contextual, experience-driven explanation:

```markdown
## Senior Explanation: [Topic]

### What This Code Does
[Brief functional description]

### Why It Was Built This Way
[Architectural decisions and trade-offs]

### What a Senior Would Notice
- [Insight 1]
- [Insight 2]
- [Insight 3]

### Potential Issues at Scale
- [Issue 1 and when it becomes a problem]
- [Issue 2 and mitigation]

### Improvement Opportunities
- [Opportunity 1 with priority]
- [Opportunity 2 with priority]

### Key Takeaways for Growth
- [Lesson 1]
- [Lesson 2]
```

**Important**: NEVER add AI attribution or signatures.
