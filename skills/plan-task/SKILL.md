---
name: plan-task
description: Plan a task by analyzing requirements and creating an implementation roadmap with the mastermind-agent, grounded in the project's domain docs.
argument-hint: [task-description]
allowed-tools: Task, Read, Grep, Glob, Bash, Write, Edit, AskUserQuestion
model: opus
disable-model-invocation: true
---

# Task Planning

Plan a task and produce an implementation roadmap.

Extends: `plan-base`

## Task: $ARGUMENTS

## Workflow

1. Domain Discovery
2. Mastermind Invocation
3. Plan Output Format
4. Grill Interview, including the mandatory seams branch

All four are defined in `plan-base`.

## Overrides

### Scope

This is the plain planning flow. Use it for a task big enough to need research, specialist agents, and an interview, but small enough that the resulting plan can be executed in one session.

What this skill does NOT do:

- No phase documents. The plan is returned in the conversation and nothing is written to `ai_plans/`. Use `/plan-to-docs` when the work is too big for one session
- No implementation. The plan stops at the roadmap

### Why Write and Edit are allowed

The grill updates `CONTEXT.md` and creates ADRs inline as decisions land, per `plan-base`. Those are the ONLY files this skill writes. It never touches source code.
