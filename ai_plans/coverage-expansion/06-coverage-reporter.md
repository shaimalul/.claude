# Phase 6: Coverage Reporter and Tier C Exemptions

## Goal

Produce an accurate, free answer to the question "which skills and agents have no behavioural coverage", and record the Tier C exemptions. Reporting only. The blocking assertions land in phase 8.

## Why Now

Phase 4 turned cases into readable data, which is what makes this computable without running promptfoo. The reporter must exist BEFORE phase 7, because the uncovered list is what makes case authoring targeted instead of guesswork.

## Dependencies

- Blocked by: 4
- Receives: `evals/tests/*.yaml` carrying `metadata.artifact` on every case
- Provides: the uncovered list that drives phase 7, and the `eval-coverage.js` module that phase 8 turns into blocking assertions

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `scripts/lib/eval-coverage.js` | New | Joins the case data against the inventory and returns `{ covered, uncovered, exempt, orphaned }` |
| `evals/tests/*.yaml` | Existing from phase 4 | Read as data. The reader extracts `metadata.artifact` only and never asserts on rubric wording |

## Scope

In:
- `eval-coverage.js` computing the four sets
- `npm run coverage:evals` reporter printing the table
- `behavioral-coverage: exempt - <reason>` frontmatter key on the 16 Tier C artifacts
- Non-blocking: a red report does not fail `npm test` in this phase

Out:
- COV-01 through COV-05 as blocking assertions. Phase 8, per the locked ordering decision
- Writing any new case. Phase 7

## Files to Add

- `scripts/lib/eval-coverage.js` - the join, pure apart from reading the two directories
- `scripts/eval-coverage-report.js` - the printable reporter behind `npm run coverage:evals`

## Files to Edit

- `package.json` - add `coverage:evals`
- 16 Tier C `skills/*/SKILL.md` files - add the `behavioral-coverage` key, ONLY via `/improve-claude`

## Implementation Steps

1. Write `eval-coverage.js`
   - Read `evals/tests/*.yaml`, extract `metadata.artifact` from each case
   - Join against `listSkills()` and `listAgents()` from `config-inventory`
   - Return four sets: `covered`, `uncovered`, `exempt`, and `orphaned`
   - `orphaned` means an eval names an artifact that no longer exists. It is the eval-side mirror of INT-01 and catches a rename from the other direction
   - Denominators come from `config-inventory`, never hardcoded. This is exactly why INT-14 exists

2. Keep the dependency direction clean
   - `eval-coverage.js` may read `config-inventory`. `config-inventory` must NOT learn about eval results
   - Reversing this makes the free layer depend on promptfoo being installed, which would break the fork-PR case that Layer 1 exists to serve

3. Add the reporter
   - `npm run coverage:evals` prints covered, uncovered, exempt and orphaned with counts
   - The uncovered list is the working queue for phase 7, so make it easy to read and to copy

4. Record the Tier C exemptions
   - The 16 artifacts: `docker-patterns`, `terraform-patterns`, `cicd-patterns`, `aws-eks-patterns`, `database-patterns`, `migration-patterns`, `bash-patterns`, `npm-package-patterns`, `storybook-story`, `interaction-design`, `architect`, `pr-description`, `resolve-pr`, `extract-learning`, `build-feature`, `consult`
   - Format: `behavioral-coverage: exempt - <reason>` in the artifact's own frontmatter
   - The reason must be substantive. "Infra patterns match industry consensus; the ablation shows the base model reproduces them unprompted" is a reason. "Not needed" is not
   - Exemptions live ON the artifact, never in a central list. Deleting the skill deletes its exemption, renaming cannot orphan it, and the escape hatch shows up in the same diff that adds the skill

5. Do NOT use `user-invocable: false` as an exemption proxy
   - `tdd`, `review-base` and `grilling` are all non-invocable and are the three highest-value evals in the repo. The proxy would exempt exactly the wrong set

6. Run the reporter and record the baseline
   - Expect roughly 34 artifacts uncovered at this point. That number is the phase 7 backlog

## Tests

- [ ] `eval-coverage.js`: an artifact with a case appears in `covered`
- [ ] `eval-coverage.js`: an artifact with neither case nor exemption appears in `uncovered`
- [ ] `eval-coverage.js`: an artifact carrying the frontmatter key appears in `exempt`
- [ ] `eval-coverage.js`: a case naming a nonexistent artifact appears in `orphaned`
- [ ] `eval-coverage.js`: totals reconcile against `config-inventory` counts rather than a hardcoded number

## Verification

```bash
npm run test:lib
npm run coverage:evals
npm test
```

`npm test` must stay green. This phase adds NO blocking assertion, so a large uncovered count is expected and correct here.

## Done When

- [ ] `eval-coverage.js` returns all four sets and is unit tested
- [ ] `npm run coverage:evals` prints a readable table
- [ ] All 16 Tier C artifacts carry a substantive `behavioral-coverage` reason
- [ ] `config-inventory` still has no knowledge of eval results
- [ ] The uncovered baseline is recorded for phase 7
- [ ] `npm test` is green, with no coverage assertion blocking yet

## Protected Files

All 16 exemption edits touch `skills/*/SKILL.md` frontmatter and MUST route through `/improve-claude`.

## Coverage Theatre

Worth stating plainly in the phase output: nothing prevents one trivial case per artifact from satisfying the counter. No mechanical mitigation exists. COV is a FLOOR, not a quality signal. It answers "is anything at all pointed at this" and nothing more. The quality signal comes from the control gate in phase 4, not from this number.

## Notes for Next Phase

Phase 7 works directly off `npm run coverage:evals`. Re-run it after each batch to watch `uncovered` shrink; that is the phase's progress meter. Phase 8 promotes this module's output into blocking assertions once the count is low enough for the ceiling of 20 to pass.
