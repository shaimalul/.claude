# Micro-Iterate

Implement a feature in validated micro-steps. After each step, probes and principal agents validate it before moving on.

**Arguments:** `$ARGUMENTS` — Feature description (required). Options:
- `--max-steps N` — limit to N steps (default: 10)
- `--resume` — resume from an existing state file in this session

## Philosophy

**Small steps, immediate validation.** Each micro-step implements one layer or concern — with the right skill loaded for its domain — then validates with probes, CLAUDE.md compliance, and quality checks before the next step begins.

## What This Command Does

1. Uses mastermind to decompose the feature into domain-aware micro-steps
2. Shows you the step list (with skills and specialists) for approval
3. Loads the right skill file before implementing each step
4. Validates each step: static checks + probes + CLAUDE.md compliance
5. Fixes failures before moving on (up to 3 attempts)
6. Runs `/quality-gate` after all steps pass

---

## Instructions

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- `feature`: the full feature description (required)
- `maxSteps`: number after `--max-steps` (default: 10)
- `resume`: boolean, true if `--resume` is present

If no feature description provided, show usage help and stop.

### Step 2: Decompose via Mastermind

Use the Task tool to invoke the mastermind agent:

```
subagent_type: mastermind
prompt: |
  Decompose this feature into ordered micro-steps for the micro-iterate command.

  Feature: [feature]
  Project directory: [current working directory]
  Max steps: [maxSteps]

  For each step provide:
  - name: short action title
  - description: what to implement
  - codeType: one of model|schema|repository|service|controller|component|hook|utility|wiring|config
  - domain: frontend|backend|security|devops|ai
  - targetFiles: estimated file paths (1-3 files max)
  - acceptanceCriteria: 2-4 testable criteria
  - skills: skill files to load before implementing (from skill routing table)

  Layer ordering: model/schema first, then repository, service, controller, component, hook, wiring.
  Each step must be independently compilable and touch at most 2-3 files.
  Return a JSON array of steps.
```

Take mastermind's output. If `acceptanceCriteria` or `targetFiles` are missing for any step, fill them in based on the description.

### Step 3: Present Step List for Approval

Display the step list and use `AskUserQuestion` to get approval:

```
## Proposed Micro-Steps for: [Feature Name]

| # | Step | codeType | Domain | Skills | Files |
|---|------|----------|--------|--------|-------|
| 1 | Create User type | model | backend | typescript-types | src/types/user.ts |
| 2 | Add Zod schema | schema | backend | typescript-types | src/schemas/user-schema.ts |
| ... | ... | ... | ... | ... | ... |
```

Wait for approval. If the user requests changes, revise and re-present before proceeding.

### Step 4: Create State File

Once approved, create `~/.claude/state/micro-iterate/{CLAUDE_SESSION_ID}.json`:

```json
{
  "version": 1,
  "featureDescription": "[feature]",
  "projectDir": "[cwd]",
  "createdAt": "[ISO timestamp]",
  "currentStepIndex": 0,
  "currentPhase": "implement",
  "fixAttempts": 0,
  "totalIterations": 0,
  "maxSteps": 10,
  "iterationTimes": [],
  "steps": [
    {
      "id": "step-1",
      "name": "[name]",
      "description": "[description]",
      "codeType": "[type]",
      "domain": "[domain]",
      "skills": ["skill-name"],
      "targetFiles": ["src/path/file.ts"],
      "acceptanceCriteria": ["Criterion 1"],
      "status": "pending"
    }
  ]
}
```

Use `CLAUDE_SESSION_ID` env var. If unavailable, use `Date.now().toString(36)`.

### Step 5: Implement Each Step

For each step, before writing any code:

1. **Load the skill(s)** — use the Read tool to read the relevant skill file(s):

   | codeType | Skills to read |
   |----------|---------------|
   | `component`, `hook` | `~/.claude/skills/react-component.md`, `~/.claude/skills/typescript-types.md` |
   | `component` with UI/forms | + `~/.claude/skills/interaction-design.md`, `~/.claude/skills/accessibility-patterns.md` |
   | `service`, `repository` | `~/.claude/skills/backend-patterns.md`, `~/.claude/skills/database-patterns.md` |
   | `controller` | `~/.claude/skills/backend-patterns.md`, `~/.claude/skills/api-design.md` |
   | `schema` | `~/.claude/skills/typescript-types.md` |
   | `utility` | `~/.claude/skills/typescript-types.md`, `~/.claude/skills/no-comments.md` |
   | `config` or auth-related | `~/.claude/skills/security-patterns.md` |

2. **Read existing patterns** in the project before writing (search `src/` for similar files)

3. **Implement ONLY this step** — follow the skill patterns exactly:
   - Named exports only (no `export default`)
   - No barrel `index.ts` imports
   - No `as Type` casting — use type guards
   - No `any` / `unknown` without type guards
   - Booleans: `isX` / `hasX`
   - No `console.log` in production code
   - Functions ≤ 30 lines, files ≤ 150 lines

4. When done: output `<micro-done/>`

The stop hook injects the validation prompt automatically.

### Step 6: Validation Phase (auto-injected by stop hook)

Follow the validation template exactly. See `~/.claude/templates/micro-iterate-validate.md`.

Signal: `<micro-validated result="pass"/>` or `<micro-validated result="fail" reason="..."/>`

### Step 7: Complete — Run Quality Gate

When the stop hook signals all steps are done, before outputting `<micro-complete/>`:

1. Run `/quality-gate` — spawns security-principal, frontend/backend-principal, and architect-principal in parallel
2. Review the quality gate report
3. Fix any CRITICAL issues found
4. Signal completion: `<micro-complete/>`

---

## Signals Reference

| Signal | When to Use |
|--------|------------|
| `<micro-done/>` | Finished implementing or fixing a step |
| `<micro-validated result="pass"/>` | All validation checks passed |
| `<micro-validated result="fail" reason="..."/>` | A check failed |
| `<micro-complete/>` | All steps done + quality gate passed |
| `<micro-skip/>` | Skip this step (use sparingly) |
