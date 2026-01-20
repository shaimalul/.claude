---
description: Directly consult a specific principal engineer (frontend/backend/ai/devops/security/architect)
argument-hint: [domain] [question]
allowed-tools: Task, Read, Grep, Glob
---

# Principal Engineer Consultation

Route the user's request to the appropriate specialist agent using the **Task tool**.

## Arguments
- `$1` = Domain (frontend, backend, ai, devops, security, architect)
- `$2+` = Question or task for the specialist

## Domain → Agent Mapping

| Domain | Agent | Skills Loaded |
|--------|-------|---------------|
| frontend | frontend-principal | react-component, styling-rtl, storybook-story, testing-patterns, typescript-types |
| backend | backend-principal | backend-patterns, api-design, database-patterns |
| ai | ai-principal | openai-integration, prompt-engineering |
| devops | devops-principal | docker-patterns, kubernetes-patterns, terraform-patterns, cicd-patterns |
| security | security-principal | security-patterns |
| architect | architect-principal | architect |

## Instructions

1. Parse the domain from `$1`
2. Use the **Task tool** to spawn the appropriate agent:

**Task tool invocation:**
```
subagent_type: {domain}-principal
prompt: |
  User is consulting you as the {domain} principal engineer.

  Question/Task: $ARGUMENTS

  Provide expert guidance following your specialized skills and CLAUDE.md standards.
```

3. Return the specialist's full response to the user

## Example Usage

```
/principal backend Design an API for user preferences
/principal ai How to implement RAG for documentation search?
/principal devops Set up GitHub Actions for this project
/principal security Review auth implementation for vulnerabilities
/principal frontend How to structure this complex form component?
/principal architect Should we use microservices or monolith?
```

Route this request to the appropriate specialist:

Domain: $1
Request: $ARGUMENTS
