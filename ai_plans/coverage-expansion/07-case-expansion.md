# Phase 7: Case Expansion

## Goal

Author roughly 90 behavioural eval cases across all tiers, every one of them verified to FAIL under the question-only control before it counts as done.

## Why Now

Everything this phase needs now exists: the control gate that separates real cases from vacuous ones, the composition harness for combination cases, and the coverage reporter that says exactly which artifacts still need work.

## Dependencies

- Blocked by: 5, 6
- Receives: the composition harness and its budget rule from phase 5; the uncovered list and Tier C exemptions from phase 6
- Provides: the case volume that lets phase 8's blocking assertions pass under a ceiling of 20

## This Phase Does Not Fit One Context Window

Accepted deliberately. Work it in batches using the ledger below, which is the phase's own progress state.

Re-run `/implement-phase ai_plans/coverage-expansion/07-case-expansion.md` as many times as needed. On each run:

1. Read the ledger and find the first UNTICKED batch
2. Do only that batch
3. Tick it in this file, recording the case count and the observed control-run result
4. Stop and clear context

Do NOT attempt more than one batch per context. Do NOT start a batch before ticking the previous one, or resumption breaks.

## Batch Ledger

| # | Batch | Artifacts | Target cases | Status |
|---|-------|-----------|--------------|--------|
| B1 | Bases and primitives | review-base, plan-base, tdd, grilling, domain-modeling, codebase-design | ~18 (3 each) | [ ] not started |
| B2 | Process skills | plan-task, plan-to-docs, implement-phase, find-bug, plan-test, review-test, fix-review, review, quality-gate | ~18 (2 each) | [ ] not started |
| B3 | Prohibition skills | no-comments, remove-comments, testing-patterns, typescript-types, useeffect-patterns, styling-rtl, refactoring-patterns, refactor | ~16 (2 each) | [ ] not started |
| B4 | Workflow and routing | commit-all, split-changes, merge-branches, improve-claude, mastermind-agent, pr-resolver-agent, bug-finder-agent | ~14 (2 each) | [ ] not started |
| B5 | Tier A-narrow | security-agent, backend-agent, architect-agent, frontend-agent, devops-agent, ux-agent, ai-agent, product-agent, security-patterns, js-backend-patterns, api-design, accessibility-patterns, react-component, design-system-patterns | ~14 (1 each) | [ ] not started |
| B6 | Combination and refusal traps | agent plus skill pairs via the phase 5 harness | ~20, incl 5-6 traps | [ ] not started |

B1 is first because bases and primitives have the highest fan-out: every consumer inherits them, so a regression there is the most expensive one to miss.

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `evals/tests/*.yaml` | Existing from phase 4 | All new cases are data in this seam, carrying `metadata: { artifact, tier }` |
| `evals/lib/compose-prompt.js` | Existing from phase 5 | B6 exercises composition through the harness, never by hand-concatenating files |

No new seam. This phase adds volume at seams already agreed.

## Scope

In:
- Roughly 90 cases across the six batches
- Each verified against the control before it counts

Out:
- Any change to the harness, the config shape, or the coverage module. If a case cannot be expressed, fix the case, not the machinery
- Blocking coverage assertions. Phase 8

## Files to Add

- `evals/tests/bases.yaml`, `process.yaml`, `prohibitions.yaml`, `workflow.yaml`, `narrow.yaml` - one per batch, keeping each file reviewable
- `evals/tests/combination.yaml` - extended from the phase 5 pilots

## Files to Edit

- `evals/tests/combination.yaml` - B6 extends the pilot cases

## Implementation Steps

Per batch, repeat:

1. Pick the artifact's most contrarian rule
   - The tier test is NOT importance. It is: does this file contain at least one rule the base model would not produce unprompted
   - If nothing in the artifact meets that bar, it belongs in Tier C. Add an exemption via `/improve-claude` instead of a weak case, and note the reclassification in the ledger row

2. Design the question around the base model's confident wrong default
   - The discriminator is a question where the base model has a strong, different default
   - The strongest general pattern is the REFUSAL TRAP: ask for something the configuration forbids and check the artifact makes the agent refuse. Refusal is nearly impossible to produce by accident, so a passing refusal case carries very high signal
   - Trap material: `export default`, barrel `index.ts` files, `as Type` casting, raw HTTP status numbers, `console.log` in production, committing without `/commit-all`

3. Write the assertions
   - Pair each positive assertion with a `not-icontains` on the base model's known default. This carries the discrimination deterministically at zero extra inference cost
   - Express negatives as deterministic `not-icontains`. NEVER ask a model to certify an absence
   - One verifiable fact per rubric. Split anything containing "and" or "rather than" into an `assert-set`
   - Anchor on textual evidence: "the response states X" beats "the response commits to X"
   - Reserve `llm-rubric` for claims needing semantic reading such as ordering, refusal or protocol. If a rubric is really checking that a phrase is present, it is a grep and belongs in Layer 1
   - A case must survive rewording of the artifact's prose. If it would not, it is a prose snapshot

4. Run the control and confirm the case FAILS
   - This is the gate. A case that passes the control measures the base model and does not count
   - Recording "control failed as expected" in the ledger row is part of ticking the batch

5. Audit rubric stability for new rubrics
   - Run new model-graded rubrics with `--repeat 3`. Not 3 out of 3 means it is not stable enough to gate on
   - Never use `--repeat` in normal CI

6. Respect the composition budget in B6
   - At most one or two full-load cases per agent. `frontend-agent` declares 10 skills at roughly 3,400 lines, about $0.04 per full-load case
   - Use targeted single-skill loads for the rest
   - Label every combination case as CONTENT COMPATIBILITY. Never describe one as proving the agent "loads" a skill

7. Tick the ledger row and stop
   - Record actual case count and the control result
   - Re-run `npm run coverage:evals` to watch `uncovered` shrink. That is the progress meter

## Tests

The cases ARE the tests. Per batch:

- [ ] Every new case carries `metadata: { artifact, tier }` naming a real artifact
- [ ] Every new case FAILS under the question-only control
- [ ] Every new model-graded rubric passes `--repeat 3` at 3 out of 3
- [ ] No case asserts an absence via `llm-rubric` instead of `not-icontains`
- [ ] B6 only: no case description claims an agent "loads" a skill

## Verification

Per batch:

```bash
set -a; source .env; set +a
npm run eval -- --filter-pattern <batch>
npm run eval -- --filter-pattern <batch> --prompts evals/prompts/question-only.yaml
npm run eval -- --filter-pattern <batch> --repeat 3
npm run coverage:evals
```

The first must be green, the second MUST be red, the third must be 3 out of 3. Then `npm test` to confirm nothing static regressed.

## Done When

- [ ] All six ledger rows are ticked with recorded counts
- [ ] `npm run coverage:evals` shows `uncovered` at or below 20
- [ ] `orphaned` is empty
- [ ] The full suite passes normally and is substantially red under the control
- [ ] Full-run cost is recorded and is in the expected range
- [ ] `npm test` is green

## Protected Files

Any artifact reclassified to Tier C in step 1 needs a `behavioral-coverage` frontmatter edit, which MUST route through `/improve-claude`.

## Notes for Next Phase

Phase 8 turns the coverage reporter into blocking assertions with a ceiling of 20. That ceiling can only pass once `uncovered` is at or below it, so confirm the number from `npm run coverage:evals` before starting phase 8. If some artifacts remain genuinely uncoverable, exempt them here rather than raising the ceiling there; the ceiling is meant to be a ratchet, not a dial.
