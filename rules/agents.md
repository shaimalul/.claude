# Agent Orchestration

## Available Principal Engineers

Located in `~/.claude/agents/`:

| Agent | Purpose | Command |
|-------|---------|---------|
| mastermind | Orchestrator, multi-domain tasks | `/plan-task`, `/build-feature` |
| frontend-principal | React, TypeScript, UI/UX | `/consult frontend` |
| backend-principal | Node.js, NestJS, APIs | `/consult backend` |
| ai-principal | OpenAI, prompts, RAG | `/consult ai` |
| devops-principal | Docker, K8s, Terraform | `/consult devops` |
| security-principal | OWASP, auth, vulnerabilities | `/consult security` |
| architect-principal | System design, ADRs | `/consult architect` |
| ux-principal | Accessibility, WCAG, ARIA | `/consult ux` |
| product-principal | Product strategy, enterprise PM, prioritization | `/consult product`, `/plan-product` |
| bug-finder | Root cause analysis | `/find-bug` |

## Immediate Agent Usage

No user prompt needed - use proactively:
1. Complex feature requests → Use **mastermind** via `/plan-task`
2. Code just written/modified → Use `/review` command
3. Expert guidance needed → Use `/consult [domain]` command
4. Bug investigation → Use `/find-bug` command

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis
2. Agent 2: Performance review
3. Agent 3: Type checking

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## MCP-First Tool Routing

Before using generic tools, check if an MCP server handles the task:

| Task | Use MCP | Not |
|------|---------|-----|
| Library docs lookup | Context7 `query-docs` | WebSearch/WebFetch |
| Notion pages | Notion MCP | WebFetch |
| Jira/Confluence | Jira MCP `search`, `getJiraIssue` | WebFetch, `gh` |
| General web info | WebSearch/WebFetch | (fallback) |

This applies to all agents - when a principal engineer needs docs, route through Context7 first.

## Multi-Perspective Analysis

For complex problems, the mastermind routes to appropriate specialists:
- frontend-principal for React/UI
- backend-principal for APIs/services
- security-principal for security reviews
- architect-principal for system design
- product-principal for product strategy/prioritization
