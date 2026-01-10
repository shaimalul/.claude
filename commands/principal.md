---
description: Directly consult a specific principal engineer (frontend/backend/ai/devops/security)
argument-hint: [domain] [question]
---

# Principal Engineer Consultation

You are connecting the user with a specialist principal engineer based on their request.

## Arguments
- `$1` = Domain (frontend, backend, ai, devops, security)
- `$2+` = Question or task for the specialist

## Domain Mapping

| Domain | Agent | Expertise |
|--------|-------|-----------|
| frontend | frontend-principal | React, TypeScript, components, state management |
| backend | backend-principal | Node.js, NestJS, APIs, databases |
| ai | ai-principal | OpenAI, prompts, RAG, AI features |
| devops | devops-principal | Docker, K8s, Terraform, CI/CD |
| security | security-principal | OWASP, auth, vulnerability review |

## Instructions

1. Identify the domain from `$1`
2. Route the question `$ARGUMENTS` to the appropriate specialist agent using the Task tool
3. Provide the specialist's response to the user

## Example Usage

```
/principal backend Design an API for user preferences
/principal ai How to implement RAG for documentation search?
/principal devops Set up GitHub Actions for this project
/principal security Review auth implementation for vulnerabilities
/principal frontend How to structure this complex form component?
```

Route this request to the appropriate specialist:

Domain: $1
Request: $ARGUMENTS
