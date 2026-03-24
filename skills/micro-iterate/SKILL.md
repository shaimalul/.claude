---
name: micro-iterate
description: Implement a feature in validated micro-steps with domain-aware skill loading and quality checks after each step
argument-hint: [feature-description] [--max-steps N] [--resume]
disable-model-invocation: true
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write, TodoWrite
model: opus
---

# Micro-Iterate

Implement a feature in validated micro-steps. After each step, probes and principal agents validate it before moving on.

**Arguments:** `$ARGUMENTS`
- Feature description (required)
- `--max-steps N` - limit to N steps (default: 10)
- `--resume` - resume from an existing state file

## Philosophy

**Small steps, immediate validation.** Each micro-step implements one layer or concern with the right skill loaded for its domain, then validates before the next step begins.

## Instructions

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- `feature`: the full feature description (required)
- `maxSteps`: number after `--max-steps` (default: 10)
- `resume`: boolean, true if `--resume` is present

### Step 2: Decompose via Mastermind

Use the Task tool to invoke the mastermind agent:

```
subagent_type: mastermind
prompt: |
  Decompose this feature into ordered micro-steps.

  Feature: [feature]
  Max steps: [maxSteps]

  For each step provide:
  - name: short action title
  - description: what to implement
  - codeType: model|schema|repository|service|controller|component|hook|utility|wiring|config
  - domain: frontend|backend|security|devops|ai
  - targetFiles: estimated file paths (1-3 files max)
  - acceptanceCriteria: 2-4 testable criteria
  - skills: skill files to load before implementing

  Layer ordering: model/schema first, then repository, service, controller, component, hook, wiring.
  Each step must be independently compilable and touch at most 2-3 files.
  Return a JSON array of steps.
```

### Step 3: Present Step List for Approval

Display the step list and use `AskUserQuestion` to get approval.

### Step 4: Create State File

Once approved, create `~/.claude/state/micro-iterate/${CLAUDE_SESSION_ID}.json`.

### Step 5: Implement Each Step

For each step, before writing any code:

1. **Load the skill(s)** for the codeType domain
2. **Read existing patterns** in the project
3. **Implement ONLY this step** following skill patterns exactly
4. When done: output `<micro-done/>`

### Step 6: Validation Phase

Follow the validation template. Signal: `<micro-validated result="pass"/>` or `<micro-validated result="fail" reason="..."/>`

### Step 7: Complete - Run Quality Gate

When all steps are done:
1. Run `/quality-gate`
2. Fix any CRITICAL issues
3. Signal completion: `<micro-complete/>`

## Signals Reference

| Signal | When to Use |
|--------|------------|
| `<micro-done/>` | Finished implementing or fixing a step |
| `<micro-validated result="pass"/>` | All validation checks passed |
| `<micro-validated result="fail" reason="..."/>` | A check failed |
| `<micro-complete/>` | All steps done + quality gate passed |
| `<micro-skip/>` | Skip this step (use sparingly) |
