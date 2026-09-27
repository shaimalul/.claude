# Model Selection (SINGLE SOURCE OF TRUTH)

This file is the authoritative reference for which model tier every agent and skill runs on. Change a tier here first, then update the matching `model:` frontmatter.

## Never Hardcode a Model Version

Always reference a model by its tier alias. NEVER write a version number or a pinned model id anywhere in this configuration.

```yaml
# WRONG - pins a generation that will be stale next release
model: claude-sonnet-4-6
model: claude-opus-4-5-20250101
```

```yaml
# CORRECT - alias resolves to the current generation automatically
model: sonnet
model: opus
model: haiku
```

The same rule applies to prose. Write "Sonnet handles main development work", never "Sonnet 4.6 handles main development work". Tier names are stable; version numbers are not.

Applies to: agent frontmatter, skill frontmatter, `settings.template.json`, rule files, README, and any documentation in this repo.

Exception: third-party model ids that are not Claude (for example `gpt-4o` or `text-embedding-3-small` in code examples) are external API contracts and keep their explicit names.

## Tier Definitions

| Tier   | Use For                                                                       | Trade-off                                    |
| ------ | ----------------------------------------------------------------------------- | -------------------------------------------- |
| opus   | Deep reasoning, architecture decisions, planning, research, multi-step review | Highest capability, highest cost and latency |
| sonnet | Main development work, orchestration of well-scoped tasks, routine coding     | Balanced default                             |
| haiku  | Lightweight high-frequency agents, worker agents in multi-agent systems       | Fastest and cheapest, lower depth            |

Default when nothing is specified: the session model from `settings.template.json`.

## Agent Assignments

| Agent             | Tier   | Effort | Rationale                                              |
| ----------------- | ------ | ------ | ------------------------------------------------------ |
| mastermind-agent  | opus   | high   | Decomposes multi-domain work and routes to specialists |
| architect-agent   | opus   | high   | System design, ADRs, long-horizon trade-offs           |
| bug-finder-agent  | opus   | high   | Root cause analysis across unfamiliar code             |
| ai-agent          | opus   | -      | Prompt and RAG design require deep reasoning           |
| frontend-agent    | opus   | -      | Review-heavy, judges pattern quality                   |
| ux-agent          | opus   | -      | Accessibility auditing across large surfaces           |
| product-agent     | opus   | -      | Strategy, prioritization, open-ended analysis          |
| backend-agent     | sonnet | -      | Well-scoped API and service implementation             |
| devops-agent      | sonnet | -      | Config and manifest generation from known patterns     |
| security-agent    | sonnet | -      | Checklist-driven review against OWASP patterns         |
| pr-resolver-agent | sonnet | -      | Mechanical thread triage and reply drafting            |

`effort` overrides the session reasoning level for that agent only; `-` means it inherits the session's effort. Only agents doing deep, ambiguous, multi-step reasoning declare `high` - it costs latency, so it is not the default even for opus-tier agents.

## Skill Assignments

Skills without a `model:` field inherit the session model. Only skills that need a specific tier declare one.

| Skill             | Tier   | Rationale                                       |
| ----------------- | ------ | ----------------------------------------------- |
| plan-task         | opus   | Feature decomposition, domain grounding, and the grill |
| plan-to-docs      | opus   | Vertical slice decomposition across many sessions |
| wayfinder         | opus   | Destination, fog, and frontier decisions across many sessions |
| implement-phase   | opus   | Cascading changes across future phases          |
| plan-test         | opus   | Edge case and failure mode design               |
| review-test       | opus   | Test quality auditing                           |
| find-bug          | opus   | Feedback loop construction and root cause analysis |
| consult           | opus   | Routes to specialist agents for expert guidance |
| split-changes     | opus   | Domain boundary analysis across a branch        |
| build-feature     | sonnet | Executes an already-approved plan               |

Bases and primitives (`plan-base`, `review-base`, `grilling`, `domain-modeling`, `codebase-design`, `tdd`) declare no `model:`. They are loaded into whichever skill or agent cites them and run at that caller's tier.

All other skills: no `model:` field, inherit session model.

## Changing an Assignment

1. Edit the tier in the table above
2. Update the `model:` frontmatter in the matching `agents/*.md` or `skills/*/SKILL.md`
3. Verify nothing drifted:

```bash
for f in agents/*.md skills/*/SKILL.md; do
  m=$(awk '/^---$/{n++;next} n==1 && /^model:/{print $2;exit}' "$f")
  [ -n "$m" ] && echo "$f -> $m"
done
```

4. Confirm no version numbers were introduced:

```bash
grep -rniE 'claude-(opus|sonnet|haiku)-[0-9]|(opus|sonnet|haiku) [0-9]' \
  --include='*.md' --include='*.json' . \
  | grep -v node_modules | grep -vE 'rules/models\.md|CLAUDE\.md|improve-claude'
```

Both commands run from the repo root. The second should return nothing - the excluded files are the ones that quote versioned ids as counter-examples.
