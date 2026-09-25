---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when pinning down domain terminology or a ubiquitous language, when recording an architectural decision as an ADR, or when another skill needs to read or maintain the domain model.
user-invocable: false
---

# Domain Modeling

Owns the project's domain documentation: the `CONTEXT.md` glossary and the ADRs in `docs/adr/`. Every skill that reads or writes those files references this one.

Two modes:

- Consuming: read the glossary and ADRs before exploring or producing output. Any skill can do this.
- Maintaining: challenge terms, stress-test with scenarios, and write the glossary and decisions down the moment they crystallise. This is the active discipline below.

## Consumer Rules

Before exploring a codebase, read:

- `CONTEXT.md` at the repo root, or `CONTEXT-MAP.md` if it exists, which points at one `CONTEXT.md` per context. Read each one relevant to the topic
- `docs/adr/` for ADRs touching the area you are about to work in. In multi-context repos also check `src/<context>/docs/adr/`

If these files do not exist, proceed SILENTLY. Do not flag their absence, do not suggest creating them upfront. They are created lazily when a term or decision actually resolves.

When your output names a domain concept (an issue title, a test name, a type name, a hypothesis), use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary lists under Avoid. If the concept you need is not in the glossary, that is a signal: either you are inventing language the project does not use, or there is a real gap worth resolving.

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> Contradicts ADR-0007 (event-sourced orders), but worth reopening because...

## File Structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

A `CONTEXT-MAP.md` at the root means the repo has multiple contexts, and the map points at where each lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          <- system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                 <- context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

Create files LAZILY, only when you have something to write. No `CONTEXT.md` yet? Create one when the first term resolves. No `docs/adr/`? Create it when the first ADR is needed. There is no setup step.

## The Active Discipline

### Challenge against the glossary

When a term conflicts with the existing language in `CONTEXT.md`, call it out immediately.

> Your glossary defines "cancellation" as X, but you seem to mean Y. Which is it?

### Sharpen fuzzy language

When a term is vague or overloaded, propose a precise canonical term.

> You are saying "account". Do you mean the Customer or the User? Those are different things.

### Discuss concrete scenarios

When domain relationships are on the table, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force precision about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. Surface contradictions.

> Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?

### Update CONTEXT.md inline

When a term resolves, update `CONTEXT.md` right there. Do NOT batch these up. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` is a glossary and nothing else. It must be totally devoid of implementation details. It is not a spec, not a scratch pad, and not a repository for implementation decisions.

### Offer ADRs sparingly

Offer an ADR only when ALL THREE are true:

1. Hard to reverse: the cost of changing your mind later is meaningful
2. Surprising without context: a future reader will wonder "why did they do it this way?"
3. The result of a real trade-off: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

## Interview Technique

When maintaining the model interactively, use the `grilling` protocol. Do not restate it here.

## Consumers

| Skill | Uses |
| --------------- | --------------------------------------------------- |
| `plan-base` | Consumer rules before planning, active discipline during the grill |
| `tdd` | Consumer rules, so test names match the domain language |
| `review-base` | Consumer rules, so findings cite the project's terms |
| `find-bug` | Consumer rules, to build an accurate mental model |
| `wayfinder` | Active discipline while naming the destination and resolving `grilling` tickets |
