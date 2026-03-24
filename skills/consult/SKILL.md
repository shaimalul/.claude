---
name: consult
description: Consult a principal engineer for expert guidance (frontend/backend/ai/devops/security/architect/ux/product)
argument-hint: [domain] [question or topic]
allowed-tools: Task, Read, Grep, Glob, Bash
model: opus
---

# Principal Engineer Consultation

Route requests to the appropriate specialist agent for expert-level guidance.

## Arguments
- `$0` = Domain (frontend, backend, ai, devops, security, architect, ux, product)
- Remaining = Question, topic, or code path for the specialist

## Domain to Agent Mapping

| Domain | Agent | Use Cases |
|--------|-------|-----------|
| frontend | frontend-principal | React, TypeScript, UI/UX patterns |
| backend | backend-principal | Node.js, NestJS, APIs, services |
| ai | ai-principal | OpenAI, prompts, RAG, embeddings |
| devops | devops-principal | Docker, K8s, Terraform, CI/CD |
| security | security-principal | OWASP, auth, vulnerabilities |
| architect | architect-principal | System design, ADRs, scalability |
| ux | ux-principal | WCAG, ARIA, accessibility |
| product | product-principal | Product strategy, prioritization, metrics |

## Instructions

### Step 1: Parse Domain

Extract domain from first argument. If not recognized, default to `architect`.

### Step 2: Spawn Specialist Agent

Use the **Task tool** to invoke the appropriate principal:

```
subagent_type: {domain}-principal
prompt: |
  You are the {domain} principal engineer. Provide expert guidance on:

  **Topic/Question:** {remaining arguments after domain}

  ## Response Guidelines

  **Technical Analysis:**
  - Why this approach was chosen over alternatives
  - Trade-offs and architectural decisions
  - Performance implications and considerations

  **Experience-Based Insights:**
  - Common pitfalls that junior developers miss
  - Edge cases that cause issues in production
  - Performance bottlenecks at scale

  **Recommendations:**
  - Clear, actionable guidance
  - Code examples where helpful
  - Risks and mitigations

  Follow CLAUDE.md standards and your specialized skills.
```

### Step 3: Return Response

Return the specialist's full response to the user.

## Usage Examples

```bash
/consult architect Should we use microservices or monolith?
/consult frontend How to structure this complex form component?
/consult backend Design an API for user preferences
/consult security Review auth implementation for vulnerabilities
/consult ai How to implement RAG for documentation search?
/consult devops Set up GitHub Actions for this project
/consult ux Review accessibility patterns in this component
/consult product Should we build this feature for enterprise?
```

## Output Format

```markdown
## {Domain} Consultation: {Topic}

### Analysis
[Understanding of the problem/requirement]

### Recommendations
[Primary recommendation with rationale]

### Alternatives Considered (if applicable)
| Option | Pros | Cons |
|--------|------|------|

### Key Considerations
[Domain-specific considerations]

### Implementation Guidance
[Specific code examples or steps]
```

Route this request to the appropriate specialist:

**Domain:** $0
**Request:** $ARGUMENTS
