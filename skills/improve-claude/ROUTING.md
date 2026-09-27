# Rule Routing

Where an instruction lands. Phases 1 to 4 of [SKILL.md](SKILL.md) consult this file. It maps a TOPIC to its owning files; it deliberately does not list section names or file counts, which are read from the files themselves (`grep '^#' <file>`, `ls`) so they cannot go stale here.

## Category Detection

Match the instruction's keywords to a category. If two categories match, the rule lives in the more specific owner and the broader file points to it. If none match, it is General.

| Category | Keywords | Owning files |
|---|---|---|
| TypeScript | type, interface, enum, any, unknown, casting, generic | `CLAUDE.md` Code Style, `typescript-types`, `rules/coding-style.md` |
| Frontend | react, component, hook, useState, jsx, tsx, prop | `CLAUDE.md`, `frontend-agent`, `react-component` |
| Backend | express, nestjs, controller, service, repository, api, http | `CLAUDE.md`, `backend-agent`, `js-backend-patterns` |
| Security | auth, jwt, password, injection, xss, csrf, owasp | `CLAUDE.md`, `security-agent`, `rules/security.md`, `security-patterns` |
| DevOps | docker, kubernetes, terraform, ci, cd, pipeline | `devops-agent`, the matching `*-patterns` skill |
| Architecture | architecture, design, pattern, ADR, scalability, module, seam | `architect-agent`, `architect`, `codebase-design` |
| AI | llm, prompt, embedding, rag, openai, anthropic | `ai-agent`, `llm-integration`, `prompt-engineering` |
| Testing | test, jest, vitest, mock, spec, coverage | `CLAUDE.md`, `rules/testing.md`, `testing-patterns`, `tdd` |
| Styling | css, scss, style, rtl, color, token | `CLAUDE.md` Styling Standards, `styling-rtl`, `design-system-patterns` |
| Git | git, commit, branch, merge, pr | `rules/git-workflow.md`, `commit-all`, `pr-description` |
| Performance | context, cost, compaction, token budget | `rules/performance.md` |
| Models | model, opus, sonnet, haiku, tier, effort | `rules/models.md`, then agent and skill frontmatter |
| Agents | agent, subagent, consult, orchestration, delegate, memory | `rules/agents.md`, the affected `agents/*.md` |
| Writing | skill authoring, description, pointer, prune, steering file | `writing-for-agents` |
| Scripts | hook, lifecycle, session, automation, startup | `scripts/hooks/`, `scripts/lib/` (describe the behaviour change; code goes through TDD) |
| General | none of the above | `CLAUDE.md`, plus every agent the rule affects |

A `--category=<name>` flag in the arguments overrides detection.

## Rules Files

| Rule topic | File |
|---|---|
| Immutability, naming, exports, file organization | `rules/coding-style.md` |
| Test coverage, TDD, mocking, verification | `rules/testing.md` |
| Auth, secrets, OWASP, validation | `rules/security.md` |
| Commits, branches, PRs | `rules/git-workflow.md` |
| Context window, compaction | `rules/performance.md` |
| Model tiers and per-agent or per-skill assignment | `rules/models.md` |
| Agent memory, external fact verification | `rules/agents.md` |
| Python tooling and style | `rules/python.md` |

## Propagation Targets

After the owning file changes, these consumers may carry a checklist or example of the same rule. Update them to POINT at the owner, never to restate it:

| Rule kind | Also check |
|---|---|
| Code style | `quality-gate` Code Standards section |
| Security | `quality-gate` Security section |
| Testing | `review-test`, `testing-patterns` |
| Review-worthy judgement call | `review-base` CLAUDE.md Compliance Checks |
| New skill, agent, hook, or rule file | `README.md` (catalog tables and counts) and `rules/models.md` if it declares a tier |
