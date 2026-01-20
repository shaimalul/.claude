---
description: Get high-level architecture guidance and system design review
argument-hint: [topic]
allowed-tools: Task, Read, Grep, Glob, Bash
model: opus
---

# Architecture Consultation

Use the **Task tool** to invoke the `architect-principal` agent for system design guidance.

## Topic: $ARGUMENTS

## Instructions

Spawn the architect-principal agent using the Task tool with:

**Task tool invocation:**
```
subagent_type: architect-principal
prompt: |
  Provide architecture guidance for: $ARGUMENTS

  Analyze this architecture topic and provide:
  1. Requirements analysis (functional, non-functional, constraints)
  2. Recommended approach with clear rationale
  3. Alternative options with trade-offs table
  4. Relevant patterns from the architect skill
  5. Risks and mitigation strategies
  6. ADR draft if this is a significant decision
```

The architect-principal agent has access to:
- **Skills**: architect (ADRs, system design, scalability patterns, reliability patterns)
- **Tools**: Read, Grep, Glob, Bash

## Output Format

The agent should return a response in this format:

```markdown
## Architecture Analysis: [Topic]

### Context
[Understanding of the problem/requirement]

### Recommended Approach
[Primary recommendation with rationale]

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| ... | ... | ... |

### Key Considerations
- **Scalability**: [Notes]
- **Security**: [Notes]
- **Performance**: [Notes]
- **Maintainability**: [Notes]

### Implementation Notes
[Any specific guidance for implementation]

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| ... | ... |
```

Return the architect-principal's full response to the user.
