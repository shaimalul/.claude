# Agent Rules

## External Fact Verification

NEVER assert that an external identifier is invalid based solely on training data. This includes model names, API versions, SDK methods, endpoints, library/package names, package versions, pricing tiers, and feature availability.

Before making claims about external services or packages:
- Use WebSearch to verify current status
- If verification is not possible, use [Need to check] prefix instead of [Blocker]

## Memory Protocol

Every agent in `agents/*.md` declares `memory: project`, which auto-grants Read, Write, and Edit on `.claude/agent-memory/<agent-name>/` regardless of the agent's own `tools:` list. Declaring `memory` without instructing the agent to use it leaves the directory empty forever - the field alone does nothing.

Every agent body MUST carry this canonical protocol, either verbatim or by reference to this section:

```markdown
## Memory Protocol

Before starting, read your memory directory. Prefer what you recorded there
about this codebase over general assumptions.

After finishing, record what a future run of you would want to know: codepaths
and where they live, conventions this project actually follows, recurring
findings, and decisions with their rationale. Write concise notes. Do not
record task state, diffs, or anything `git log` already answers.
```

Verified empirically (2.1.101): `disallowedTools: Write, Edit` removes Write and Edit from the tool schema entirely, including the Write/Edit that `memory:` would otherwise auto-grant. An agent with both `disallowedTools: Write, Edit` and `memory: project` - architect, product, security - can read its memory directory but can never write to it. Its Memory Protocol section can only ever execute the "read" half; the "after finishing, record" half is dead instruction. This is a known limitation of these three agents, not a bug to route around: do not drop `disallowedTools` to unblock memory writes, since staying unable to touch source code is the point of those three being advisory-only.
