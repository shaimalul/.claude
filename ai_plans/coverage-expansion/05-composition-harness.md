# Phase 5: Composition Harness

## Goal

Build the one pure module that renders an agent together with the skills it declares, prove it with free unit tests, and expose it to promptfoo through a thin adapter so the eval suite and the free tests provably share a code path.

## Why Now

Phase 2 provided `agentSkills()` and phase 4 provided the case data seam. Both are prerequisites: composition needs to resolve a declared skill list, and the resulting cases need somewhere to live. This is the last piece of machinery before volume.

## Dependencies

- Blocked by: 2, 4
- Receives: `agentSkills()` and `readListField` from phase 2; the `evals/tests/*.yaml` data seam, control prompt and pinned grader from phase 4
- Provides: the composition renderer that phase 7's roughly 20 combination cases are written against

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `evals/lib/compose-prompt.js` | New | The highest seam reaching composition, and pure, so it is unit-testable in Layer 1 with zero API calls |

One seam only. The adapter is deliberately too thin to be worth testing separately, which is the point of putting all logic in the pure module.

## Scope

In:
- `evals/lib/compose-prompt.js`: resolves an agent's declared skills BY NAME through `config-inventory`, returns the promptfoo message array, throws on a missing skill
- `evals/prompts/agent-loader.js`: a roughly three-line adapter calling it
- Free unit tests for the renderer
- Two or three pilot combination cases proving the harness end to end

Out:
- The bulk of the combination cases. Phase 7
- The Layer 3 fidelity canary using `claude -p`. Out of scope for the whole plan as a gate; it stays a manual check
- Coverage accounting. Phase 6

## Files to Add

- `evals/lib/compose-prompt.js` - all composition logic, pure
- `evals/prompts/agent-loader.js` - promptfoo adapter
- `scripts/lib/tests/test-compose-prompt.js` - free unit tests
- `evals/tests/combination.yaml` - pilot cases only

## Files to Edit

- `evals/promptfooconfig.yaml` - register the `agent-loader.js` prompt alongside the existing one

## Implementation Steps

1. Write `compose-prompt.js` as a pure function
   - Signature roughly `composePrompt(agentName, question) -> messages[]`
   - Resolve the agent by NAME through `config-inventory`, read its `skills:` via `agentSkills()`, resolve each skill by name
   - THROW on a missing skill. Failing loud is the locked decision, and this doubles as a second wiring check alongside INT-16
   - Addressing by name rather than by relative `file://` path is the ADR'd decision: with relative paths a rename silently yields an empty system prompt and the eval passes vacuously

2. Preserve the authority gradient
   - Inline each skill in declared load order into a USER turn, not the system block
   - In production the harness injects skills progressively and the skill arrives subordinate to the agent's authority. Flattening that into one system block makes the eval pass in configurations where the real thing would fail

3. Write the adapter
   - `agent-loader.js` exports a function taking `{ vars }` and returning `composePrompt(vars.agent, vars.question)`
   - It contains no logic. If it grows any, that logic belongs in the pure module

4. Unit test the renderer for free
   - No API calls. These run inside `npm test` and cost nothing
   - Cover: an agent with several skills renders them in declared order; an agent with no `skills:` renders the agent alone; a missing skill throws with a message naming the agent and the skill

5. Add two or three pilot combination cases
   - Enough to prove the harness works end to end, not the full set
   - Each must fail under the question-only control before it counts
   - Label them honestly as CONTENT COMPATIBILITY. Never describe a case as proving "the agent loads X"

6. Watch the cost of full-load cases
   - `frontend-agent` declares 10 skills, roughly 3,400 lines, so one full-load case costs about $0.04
   - Limit full-load cases to one or two per agent and use targeted single-skill loads for the rest. Phase 7 inherits this budget rule

## Tests

- [ ] `compose-prompt.js`: an agent with multiple declared skills renders them in declared order
- [ ] `compose-prompt.js`: an agent with no `skills:` field renders the agent content alone without error
- [ ] `compose-prompt.js`: a declared skill that does not exist throws, naming both agent and skill
- [ ] `compose-prompt.js`: skills are placed in a user turn, not merged into the system block
- [ ] `evals/tests/combination.yaml`: each pilot case fails under the question-only control

## Verification

```bash
npm run test:lib
set -a; source .env; set +a
npm run eval -- --filter-pattern combination
npm run eval -- --filter-pattern combination --prompts evals/prompts/question-only.yaml
```

The unit tests must pass with zero API calls. The filtered eval must be green; the same cases under the control must be red.

## Done When

- [ ] `compose-prompt.js` holds all composition logic and is pure
- [ ] `agent-loader.js` is an adapter with no logic of its own
- [ ] Unit tests pass inside `npm test` with no API calls
- [ ] A missing declared skill throws rather than silently rendering an empty prompt
- [ ] Pilot combination cases pass normally and fail under the control
- [ ] No case description claims the agent "loads" a skill

## Fidelity Caveat

Record this in the phase output so it is not forgotten. Pre-concatenating an agent with its skills DELETES the retrieval step, and retrieval is where the realistic failure lives. The strongest honest claim these cases support is: with both documents in context, the guidance honours the skill's rule and does not contradict the agent's. They cannot show that the skill WOULD be loaded. INT-16 covers the wiring; only a `claude -p` canary covers retrieval, and that is deliberately not a gate.

## Notes for Next Phase

Phase 7 writes the bulk of the cases against this harness. The budget rule from step 6 carries forward: at most one or two full-load cases per agent. Phase 6 can be taken first or in parallel, since it depends only on phase 4.
