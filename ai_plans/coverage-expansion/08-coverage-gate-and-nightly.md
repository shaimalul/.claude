# Phase 8: Coverage Gate, Nightly Sweep and Changed-Only Selection

## Goal

Ratchet coverage shut with blocking assertions, add the scheduled control sweep that is the only thing capable of catching model drift, and give the inner loop a changed-only selector.

## Why Now

Last, by design. The blocking assertions can only pass once phase 7 brought `uncovered` at or below the ceiling. Landing them earlier would have required roughly 34 exemptions against a ceiling of 20, turning the suite red and teaching everyone to ignore it.

## Dependencies

- Blocked by: 7
- Receives: roughly 90 control-verified cases and an uncovered count at or below 20
- Provides: nothing downstream. This is the final phase

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `scripts/lib/eval-coverage.js` | Existing from phase 6 | Its output becomes blocking assertions in a new COV family |
| `evals/results.json` | Existing output | Read by the summary script. Already produced, so nothing new is generated to support reporting |

## Scope

In:
- COV-01 through COV-05 as blocking assertions in `scripts/tests/validate-coverage.test.js`
- `eval-nightly.yml`: full suite plus control column plus `--repeat 3`, on a schedule
- `scripts/eval-summary.js` writing to `$GITHUB_STEP_SUMMARY`
- `npm run eval:changed` for the inner loop

Out:
- Making the eval job a required status check. It stays report-only per the locked decision
- `claude -p` fidelity canary as CI. It remains a manual check

## Files to Add

- `scripts/tests/validate-coverage.test.js` - the COV family
- `.github/workflows/eval-nightly.yml` - scheduled sweep
- `scripts/eval-summary.js` - reads `evals/results.json`, writes a summary
- `scripts/eval-changed.js` - reverse-dependency closure

## Files to Edit

- `.github/workflows/ci.yml` - wire the summary step into the eval job
- `package.json` - add `eval:changed`

## Implementation Steps

1. Add the COV family as blocking assertions
   - COV-01 every agent is covered or exempt
   - COV-02 every skill is covered or exempt
   - COV-03 no exemption refers to a nonexistent artifact
   - COV-04 no eval case refers to a nonexistent artifact, the `orphaned` set
   - COV-05 the exempt count does not exceed the declared ceiling of 20
   - Each failure must name exactly one mechanical fix: which artifact, and whether it needs a case or an exemption
   - COV-05 is the ratchet. Adding an exemption requires visibly raising a number in the diff, which is the only mitigation against exemption becoming the default path
   - Assert that each exemption reason is non-empty and above a minimum length, so "n/a" does not pass

2. Add the nightly sweep
   - `schedule` plus `workflow_dispatch`, NO paths filter
   - Runs the full suite, the control column, and `--repeat 3`
   - This is the ONLY mechanism that catches artifact-independent decay. The three vacuous cases found at the start of this plan would have sat green forever, because no diff would ever have scheduled them
   - Treat a case that starts passing under the control as a REGRESSION: the base model caught up and the case no longer measures this repo

3. Add the summary script
   - Read the `evals/results.json` the eval job already produces and write a compact table to `$GITHUB_STEP_SUMMARY`
   - Build this rather than depending on an official promptfoo Action whose summary and PR-comment support is unverified
   - Keep the eval job report-only. Probabilistic graders on a nondeterministic call should not block a merge, because a blocking flaky check trains re-running until green

4. Add `eval:changed` for the inner loop
   - The mapping is NOT a direct lookup. It is a reverse-dependency closure over three edge types:
     - `Extends:` edges. `review-base` at 1,173 lines has the highest fan-out in the repo
     - Agent `skills:` edges, via `agentSkills()`. Changing `tdd` must run `backend-agent`, `bug-finder-agent` and `frontend-agent`
     - Global files. A change to `CLAUDE.md` or any `rules/*.md` runs everything
   - Emit `--filter-metadata` or `--filter-pattern` flags
   - Use `--filter-metadata`, never `--filter-description`, which is deprecated and silently ignored
   - This is for LOCAL use only. CI keeps running the full suite: at about $1.25 and roughly 2 minutes with promptfoo's disk cache, changed-only selection buys almost nothing and costs correctness

## Tests

- [ ] `scripts/tests/`: COV-01 fails when an agent has neither a case nor an exemption
- [ ] `scripts/tests/`: COV-02 fails when a skill has neither
- [ ] `scripts/tests/`: COV-03 fails on an exemption naming a nonexistent artifact
- [ ] `scripts/tests/`: COV-04 fails on a case naming a nonexistent artifact
- [ ] `scripts/tests/`: COV-05 fails when the exempt count exceeds 20
- [ ] `scripts/tests/`: an exemption with an empty or trivial reason fails
- [ ] `scripts/lib/tests/`: the closure includes agents that declare a changed skill
- [ ] `scripts/lib/tests/`: the closure includes consumers of a changed base via `Extends:`
- [ ] `scripts/lib/tests/`: a change to a global file selects everything

## Verification

```bash
npm test
npm run coverage:evals
node scripts/eval-changed.js skills/tdd/SKILL.md
set -a; source .env; set +a
npm run eval
```

Prove COV-05 bites: add a throwaway exemption that pushes the count past 20, confirm the suite goes red naming the ceiling, then remove it.

## Done When

- [ ] COV-01 through COV-05 pass as blocking assertions on the real repo
- [ ] COV-05 demonstrably fails when the ceiling is exceeded
- [ ] `eval-nightly.yml` runs the full suite with the control column and `--repeat 3`
- [ ] The eval job writes a readable summary to `$GITHUB_STEP_SUMMARY`
- [ ] The eval job is still report-only, not a required check
- [ ] `eval:changed` produces a correct closure over all three edge types
- [ ] `npm test` is green

## Notes on Living With This

Once this lands, the repo has three layers with different jobs. Layer 1 is free, deterministic, blocking, and works without an API key so it runs on fork PRs. Layer 2 is paid, probabilistic, report-only, and answers whether the artifacts still change model behaviour. Layer 3 is the manual `claude -p` canary, the only thing that checks the `skills:` retrieval mechanism itself.

The maintenance rule that matters most: when the nightly control sweep reports a case that now PASSES without its artifact, that is a real regression even though nothing in the repo changed. The base model improved and the case stopped measuring anything. Rewrite it against a sharper contrarian rule, or reclassify the artifact to Tier C.
