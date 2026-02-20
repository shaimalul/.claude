---
description: Consult a principal engineer for expert guidance (frontend/backend/ai/devops/security/architect/ux)
argument-hint: [domain] [question or topic]
allowed-tools: Task, Read, Grep, Glob, Bash
model: opus
---

# Principal Engineer Consultation

Route requests to the appropriate specialist agent for expert-level guidance.

## Arguments
- `$1` = Domain (frontend, backend, ai, devops, security, architect, ux)
- `$2+` = Question, topic, or code path for the specialist

## Domain to Agent Mapping

| Domain | Agent | Skills Loaded | Use Cases |
|--------|-------|---------------|-----------|
| frontend | frontend-principal | react-component, styling-rtl, storybook-story, testing-patterns, typescript-types | React, TypeScript, UI/UX patterns |
| backend | backend-principal | backend-patterns, api-design, database-patterns | Node.js, NestJS, APIs, services |
| ai | ai-principal | openai-integration, prompt-engineering | OpenAI, prompts, RAG, embeddings |
| devops | devops-principal | docker-patterns, kubernetes-patterns, terraform-patterns, cicd-patterns | Docker, K8s, Terraform, CI/CD |
| security | security-principal | security-patterns | OWASP, auth, vulnerabilities |
| architect | architect-principal | architect | System design, ADRs, scalability |
| ux | ux-principal | accessibility-patterns, interaction-design | WCAG, ARIA, accessibility |
| product | product-principal | product-management | Product strategy, prioritization, metrics, enterprise PM |

## Instructions

### Step 1: Parse Domain

Extract domain from first argument. If not recognized, default to `architect`.

Recognized domains: `frontend`, `backend`, `ai`, `devops`, `security`, `architect`, `ux`, `product`

### Step 2: Spawn Specialist Agent

Use the **Task tool** to invoke the appropriate principal:

**Task tool invocation:**
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
  - Maintenance and scalability factors

  **Experience-Based Insights:**
  - Common pitfalls that junior developers miss
  - Edge cases that cause issues in production
  - Performance bottlenecks at scale
  - "This works now but will need refactoring at 10x scale"

  **Recommendations:**
  - Clear, actionable guidance
  - Code examples where helpful
  - Risks and mitigations

  **For Architecture Topics (architect domain):**
  - ADR draft if significant decision
  - NFR analysis (non-functional requirements) if applicable
  - Alternative options with trade-offs table

  **For Product Topics (product domain):**
  - PRD draft if feature planning is needed
  - Prioritization analysis with RICE scoring
  - Success metrics with measurement plan
  - Enterprise readiness assessment if B2B context

  Follow CLAUDE.md standards and your specialized skills.
```

### Step 3: Return Response

Return the specialist's full response to the user.

## Usage Examples

```bash
# Architecture guidance
/consult architect Should we use microservices or monolith?
/consult architect Design data model for user preferences
/consult architect Explain this codebase architecture

# Frontend patterns
/consult frontend How to structure this complex form component?
/consult frontend Explain this useEffect pattern
/consult frontend Review this React component for anti-patterns

# Backend design
/consult backend Design an API for user preferences
/consult backend Review this service layer architecture
/consult backend How to handle transactions in this flow?

# Security review
/consult security Review auth implementation for vulnerabilities
/consult security How to prevent SQL injection in this query?
/consult security Analyze this JWT implementation

# AI/ML integration
/consult ai How to implement RAG for documentation search?
/consult ai Review this prompt engineering approach
/consult ai Best practices for streaming OpenAI responses

# DevOps guidance
/consult devops Set up GitHub Actions for this project
/consult devops Review this Dockerfile for best practices
/consult devops Design Kubernetes deployment strategy

# UX/Accessibility
/consult ux Review accessibility patterns in this component
/consult ux How to implement keyboard navigation for this modal?
/consult ux Analyze form UX and suggest improvements

# Product strategy
/consult product Should we build this feature for enterprise customers?
/consult product How should we prioritize our Q2 roadmap?
/consult product Write a PRD for user onboarding improvements
/consult product What metrics should we track for this feature?
/consult product Evaluate product-market fit for this idea

# Senior-level explanations (replaces /explain-like-senior)
/consult architect Explain why this pattern was chosen
/consult frontend Explain this React architecture decision
/consult backend Walk me through this service layer design
```

## Output Format

The response should follow this structure:

```markdown
## {Domain} Consultation: {Topic}

### Analysis
[Understanding of the problem/requirement]

### Recommendations
[Primary recommendation with rationale]

### Alternatives Considered (if applicable)
| Option | Pros | Cons |
|--------|------|------|
| ... | ... | ... |

### Key Considerations
[Domain-specific considerations: security, performance, scalability, etc.]

### Implementation Guidance
[Specific code examples or steps]

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| ... | ... |
```

## Important Notes

- NEVER add AI attribution or signatures
- Focus on actionable, specific guidance
- Provide code examples where helpful
- Consider CLAUDE.md standards in all recommendations
- For architecture topics, consider providing an ADR draft if the decision is significant

Route this request to the appropriate specialist:

**Domain:** $1
**Request:** $ARGUMENTS
