---
name: grilling
description: The relentless one-question-at-a-time interview that stress-tests a plan, design, or decision before work starts. Use when a plan has soft spots, when a skill needs to reach shared understanding with the user, or when implicit assumptions need forcing into the open.
user-invocable: false
---

# Grilling

The interview primitive. Every skill that needs to reach shared understanding with the user uses this one, and never writes its own.

Grilling stress-tests a plan or design before code is written. It walks the decision tree branch by branch, resolving the dependencies between decisions one at a time, until you and the user share the same understanding.

## The Decision Tree

Every plan branches into decisions, and decisions depend on each other. Descend that tree one node at a time: settle a parent decision before the choices that hang off it.

An early answer reshapes which questions come next. That is why questions arrive singly and in dependency order. A firehose of parallel questions loses the structure that makes the interview converge.

## Protocol

- Use AskUserQuestion for EACH question
- Ask ONE question at a time, wait for the answer, then move to the next branch
- Do NOT batch multiple questions. A bulk list is bewildering and destroys the dependency order
- If a question can be answered by exploring the codebase, explore the codebase instead of asking
- For each question, provide your recommended answer as context. The user reacts to a proposal, never to a blank prompt
- ALWAYS include a final option: "I'm good with the plan - stop asking questions"

If the user selects the stop option, end the interview immediately and produce the output from the answers collected so far.

Do not start enacting the plan until shared understanding is confirmed.

## What to Grill On

The point is not to reach agreement quickly. It is to make every implicit call explicit, so nothing important is left silently assumed. Prioritise branches where a wrong assumption would be expensive to unwind.

Consuming skills declare their own question categories. This file owns only the technique.

## Consumers

| Skill | Adds |
| ---------------- | ------------------------------------------------------------ |
| `plan-base` | Domain docs, seams under test, and phase decisions |
| `plan-test` | Contract, boundary, edge case, failure mode, library swap |
| `domain-modeling` | Terminology challenges and ADR candidates |

A consumer references this section by name. It MUST NOT restate the protocol.
