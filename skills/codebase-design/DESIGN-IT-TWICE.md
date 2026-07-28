# Design It Twice

When exploring alternative interfaces for a module, use this parallel sub-agent pattern. Based on "Design It Twice" (Ousterhout): your first idea is unlikely to be the best.

Uses the vocabulary in [SKILL.md](./SKILL.md): module, interface, seam, adapter, leverage.

## Process

### 1. Frame the problem space

Before spawning sub-agents, write a user-facing explanation of the problem space:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see [DEEPENING.md](./DEEPENING.md))
- A rough illustrative code sketch to ground the constraints. Not a proposal, just a way to make the constraints concrete

Show this to the user, then immediately proceed to step 2. The user reads and thinks while the sub-agents work in parallel.

### 2. Spawn sub-agents

Spawn three or more sub-agents in parallel with the Task tool. Each must produce a RADICALLY different interface for the module.

Prompt each with a separate technical brief: file paths, coupling details, dependency category, what sits behind the seam. The brief is independent of the user-facing explanation in step 1. Give each agent a different design constraint:

- Agent 1: minimise the interface. Aim for one to three entry points. Maximise leverage per entry point
- Agent 2: maximise flexibility. Support many use cases and extension
- Agent 3: optimise for the most common caller. Make the default case trivial
- Agent 4 (if applicable): design around ports and adapters for cross-seam dependencies

Include both the [SKILL.md](./SKILL.md) vocabulary and the project's `CONTEXT.md` vocabulary in every brief, so each sub-agent names things consistently with both the architecture language and the domain language.

Each sub-agent outputs:

1. Interface: types, methods, params, plus invariants, ordering, error modes
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters
5. Trade-offs: where leverage is high, where it is thin

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast by DEPTH (leverage at the interface), LOCALITY (where change concentrates), and SEAM PLACEMENT.

After comparing, give your own recommendation: which design is strongest and why. If elements from different designs would combine well, propose a hybrid. Be opinionated. The user wants a strong read, not a menu.
