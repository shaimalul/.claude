---
name: grilling
description: The relentless, round-by-round decision-tree interview that stress-tests a plan, design, or decision before work starts. Use when a plan has soft spots, when a skill needs to reach shared understanding with the user, or when implicit assumptions need forcing into the open.
user-invocable: false
---

# Grilling

The interview primitive. Every skill that needs to reach shared understanding with the user uses this one, and never writes its own.

Grilling stress-tests a plan or design before code is written. It walks the decision tree round by round, settling each decision before the ones that depend on it, until you and the user share the same understanding.

## The Decision Tree

Every plan branches into decisions, and decisions depend on each other. The FRONTIER is every decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you have not heard yet.

Work the tree in ROUNDS. Each round asks the whole frontier, then waits. The answers push the frontier outward and unblock the questions that hung on them. A question whose answer depends on another question still open in this round belongs to a LATER round.

## Protocol

- One AskUserQuestion call per round, holding the frontier as separate questions. It takes up to 4, so a wider frontier sends the 4 where a wrong assumption is most expensive and carries the rest to the next round
- Every question leads with your recommended answer as its first option. The user reacts to a proposal, never to a blank prompt
- The first question of every round also offers "I'm good with the plan - stop asking questions"
- Finding FACTS is your job, never the user's. When a frontier question needs a fact from the codebase or environment, dispatch an Explore subagent for it and ask the rest of the frontier meanwhile. Only the questions downstream of that fact wait for it
- DECISIONS are the user's. Put each one to them and wait

If the user selects the stop option, end the interview immediately and produce the output from the answers collected so far.

The interview is done when the frontier is empty: every branch visited, nothing left silently assumed. Do not start enacting the plan until the user confirms shared understanding.

## What to Grill On

The point is not to reach agreement quickly. It is to make every implicit call explicit, so nothing important is left silently assumed. Prioritise branches where a wrong assumption would be expensive to unwind.

Consuming skills declare their own question categories. This file owns only the technique.

## Consumers

| Skill | Adds |
| ---------------- | ------------------------------------------------------------ |
| `plan-base` | Domain docs, seams under test, and phase decisions |
| `plan-test` | Contract, boundary, edge case, failure mode, library swap |
| `domain-modeling` | Terminology challenges and ADR candidates |
| `wayfinder` | The destination, a breadth-first frontier grill, and `grilling` tickets |

A consumer references this section by name. It MUST NOT restate the protocol.
