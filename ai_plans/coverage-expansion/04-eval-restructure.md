# Phase 4: Eval Restructure and the Control Gate

## Goal

Remove the eval cases that measure the base model rather than this repo, restructure the remaining cases as data, pin the grader, and install the question-only control prompt that makes "does this case actually test anything" a checkable property.

## Why Now

This is the phase the whole plan turns on. Roughly 90 new cases are authored in phase 7, and without the control gate there is no way to tell a real case from a vacuous one. Building the gate before the volume is what prevents repeating the existing defect at fifteen times the scale.

## Dependencies

- Blocked by: 1
- Receives: a corrected eval job with a working cache and a pinned Node version
- Provides: the `evals/tests/*.yaml` data seam to phases 6 and 7, and the control prompt that every later case must pass through

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `evals/tests/*.yaml` | Exists but empty, now used | Cases become DATA, readable by a free Layer 1 test. This is what makes phase 6's coverage reporter possible without running promptfoo |
| `evals/prompts/question-only.yaml` | New | The control: the same question with NO artifact loaded |

The reader of the data seam must extract only `vars` and case metadata. The moment it asserts on rubric wording it becomes a prose snapshot, which is explicitly rejected.

## Scope

In:
- Delete or rewrite the three vacuous cases
- Move all cases from `promptfooconfig.yaml` into `evals/tests/*.yaml`, loaded by glob
- Add `metadata: { artifact, tier }` to every case
- Pin `defaultTest.options.provider` explicitly
- Lower `max_tokens` from 1024 to 700
- Add the question-only control prompt and document the authoring gate
- Write the three ADRs

Out:
- New cases beyond repairing the existing six. Phase 7
- The composition harness. Phase 5
- Coverage accounting or gating. Phases 6 and 8

## Files to Add

- `evals/tests/skills.yaml` - the retained skill cases
- `evals/tests/agents.yaml` - the retained and rewritten agent cases
- `evals/prompts/question-only.yaml` - the control prompt, question with no system artifact
- `docs/adr/` - three ADRs (see step 6)

## Files to Edit

- `evals/promptfooconfig.yaml` - keeps providers, `defaultTest`, prompts and a `tests:` glob; individual cases move out
- `skills/domain-modeling/SKILL.md` - only if the rewritten case requires it, and ONLY via `/improve-claude`

## Implementation Steps

1. Confirm the ablation before deleting anything
   - Run each of the six questions through the control prompt with no system artifact
   - Expect: `tdd`, `review-base` and `grilling` FAIL; `backend-agent`, `security-agent` and `architect-agent` PASS
   - A case that passes the control is measuring the base model and does not belong in the suite as written

2. Remove or rewrite the three vacuous cases
   - `architect-agent` asserting `icontains: ADR` is the clearest: the base model volunteers "Architecture Decision Record" unprompted. Rewrite it against the `domain-modeling` 3-of-3 ADR gate, which is a repo-specific rule the base model has no reason to know
   - `backend-agent` and `security-agent` are rewritten in phase 7 as Tier A-narrow cases testing only the repo-specific delta. Here they are removed rather than left in place asserting consensus
   - Deleting a passing test is correct when the test cannot fail for the right reason

3. Move cases into `evals/tests/*.yaml`
   - `promptfooconfig.yaml` keeps providers, `defaultTest`, prompts, and a glob under `tests:`
   - Every case carries `metadata: { artifact: <name>, tier: <A|A-narrow> }`. Phase 6 reads `artifact` to compute coverage, and phase 8 uses `tier` for filtering with `--filter-metadata`

4. Pin the grader
   - `OPENROUTER_API_KEY` does not appear in promptfoo's grader credential list, and the defaults are pricier than the model under test. Observed grading consumed more tokens than the evals themselves
   - Set `defaultTest.options.provider` explicitly to an OpenRouter model, on a stronger tier than the model under test, because a weak grader is poor at judging absence in a long structured answer
   - An unpinned grader is itself a flakiness source, independent of cost

5. Add the control prompt and document the gate
   - `question-only.yaml` supplies `{{question}}` with no system artifact
   - Document the rule where a case author will read it: a case may not merge until its author has SEEN it fail under the control
   - Reduce `max_tokens` to 700. Output is five times the price of input and observed responses ran about 600 tokens

6. Write the three ADRs
   - Artifacts addressed BY NAME rather than by relative `file://` path
   - Composition tested as content compatibility, with retrieval fidelity as a non-gating canary
   - Behavioural-coverage exemptions in artifact frontmatter rather than a central list
   - Each clears all three gates: hard to reverse, surprising without context, the result of a real trade-off

## Tests

- [ ] `evals/tests/*.yaml`: every retained case FAILS when run against the question-only control prompt
- [ ] `evals/tests/*.yaml`: every case carries `metadata.artifact` naming a real skill or agent
- [ ] `evals/promptfooconfig.yaml`: `defaultTest.options.provider` is set explicitly, not inferred
- [ ] The full suite still passes when run normally with artifacts loaded

## Verification

```bash
set -a; source .env; set +a
npm run eval
npm run eval -- --prompts evals/prompts/question-only.yaml
```

The first command must be green. The second is the control and MUST be substantially red. A case that passes both runs is vacuous and must be rewritten or removed before this phase is done.

## Done When

- [ ] No retained case passes the question-only control
- [ ] All cases live in `evals/tests/*.yaml`; `promptfooconfig.yaml` holds no individual case
- [ ] Every case carries `metadata: { artifact, tier }`
- [ ] The grader provider is pinned explicitly
- [ ] `max_tokens` is 700
- [ ] The control prompt exists and the authoring gate is documented
- [ ] Three ADRs are written
- [ ] `npm run eval` is green

## Protected Files

Any edit to `skills/*/SKILL.md` or `agents/*.md` in this phase, including the `domain-modeling` rewrite in step 2, MUST route through `/improve-claude`. Direct edits risk breaking sync between related files.

## Notes for Next Phase

The data seam and the control gate are now the two things every later case depends on. Phase 6 reads `metadata.artifact` from these files to compute coverage, so the field must be populated consistently from here on. Phase 7 authors roughly 90 cases and each one passes through the control before it counts.

Record the observed cost of a full run once the grader is pinned. The README's estimate of about $1.25 per 150 cases assumes a pinned grader, and this is the first phase where that number can be measured rather than projected.
