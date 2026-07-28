# Phase 1: CI Foundation and Green Baseline

## Goal

Get `npm test` green, put the free static suite in CI on every push, and fix all four verified workflow defects so that later phases build on a foundation that actually reports failure.

## Why Now

This is prefactoring: make the change easy, then make the easy change. Every later phase adds a check, and a check added to an already-red suite teaches you to ignore the suite. The frozen cache key also gets actively worse as cases are added, so it must be fixed before phase 7 adds roughly 90 of them.

## Dependencies

- Blocked by: None. Can start immediately
- Receives: nothing
- Provides: a green suite, CI that enforces it on every push, and a correctly configured eval job for every later phase

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `scripts/tests/` and `scripts/hooks/tests/` | Existing | The existing suites are made to pass honestly, either fixed or marked `{ todo }` with a tracked reason |
| The workflow files themselves | Existing | Verified by running CI, not by a unit test. INT-17 in phase 2 adds the static guard |

No new test seam is introduced here. This phase repairs and enforces what exists.

## Scope

In:
- Resolve the 4 red items in `npm test`
- New `ci.yml` holding both jobs: `static` (blocking, every push, no paths filter) and `eval` (report-only, `needs: static`, paths-filtered)
- Fix the cache key, Node version drift, fork-PR safety, concurrency and timeout
- Remove `evals.yml`, now absorbed into `ci.yml`

Out:
- Any new assertion or validator. Phase 2 onward
- The nightly control sweep and eval summary script. Phase 8
- Changing any eval case content. Phase 4

## Files to Add

- `.github/workflows/ci.yml` - both jobs, with the hard `needs:` edge that stops a paid run when the free one is red

## Files to Edit

- `.github/workflows/evals.yml` - delete, absorbed into `ci.yml`
- `scripts/hooks/tests/test-git-guardrails.js` - fix or mark the failing HK-GG-33 case with a tracked reason
- `scripts/tests/validate-integrity.test.js` - resolve INT-01, INT-05, INT-10; INT-15 already carries a `{ todo }`
- `package.json` - add an `engines` field as a second signal alongside `.nvmrc`

## Implementation Steps

1. Establish what is actually red
   - Run `npm test` and separate genuine failures from `{ todo }` markers
   - INT-01 (hooks resolve), INT-05 (template registers every live hook) and INT-10 (slash commands resolve) are assertions about repo state, so decide per item whether the repo or the assertion is wrong
   - HK-GG-33 is a documented known false positive: a git verb inside a quoted string. Either narrow the detection or convert to `{ todo }` with the reason recorded

2. Fix or explicitly defer each red item
   - Prefer fixing the underlying drift over loosening the assertion
   - Where deferral is right, use `test(name, { todo: 'reason' }, fn)` so it stays visible rather than deleted
   - Do not delete an assertion to make the suite green

3. Create `ci.yml` with the static job
   - Triggers on `push` and `pull_request` with NO paths filter, because it catches broken hook scripts and settings-merge changes, not only skill edits
   - Steps: checkout, `actions/setup-node@v4` with `node-version-file: .nvmrc`, `npm ci`, `npm test`
   - This job IS blocking

4. Move the eval job into `ci.yml` and fix all four defects
   - `needs: static` so a red free suite never triggers a paid run
   - Cache key becomes `${{ runner.os }}-promptfoo-${{ hashFiles('evals/**') }}` with `restore-keys: ${{ runner.os }}-promptfoo-`
   - `node-version-file: .nvmrc`, never a floating `node-version:`
   - `concurrency` group keyed on the ref with `cancel-in-progress: true`
   - `timeout-minutes: 10`
   - Guard the eval step so it runs only when the secret is actually available, and write a clear skip note to `$GITHUB_STEP_SUMMARY` otherwise. Do NOT switch to `pull_request_target` to get secrets onto fork PRs; combined with checking out PR content that is the exfiltration pattern `cicd-patterns` warns against
   - Keep the job report-only, not a required status check

5. Delete `evals.yml`

## Tests

- [ ] `scripts/tests/`: the integrity suite passes with no un-tracked failures
- [ ] `scripts/hooks/tests/`: the guardrails suite passes or carries an explicit `{ todo }` with a reason
- [ ] CI itself: the static job runs on a push that touches no skill or agent file

## Verification

```bash
npm test
npm run validate
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(/node-version:\s*\d/.test(y)) throw new Error('floating node-version'); if(!/hashFiles\('evals/.test(y)) throw new Error('cache key not content-addressed'); console.log('workflow OK')"
```

## Done When

- [ ] `npm test` exits 0 with no unexplained failures
- [ ] `ci.yml` runs the static job on every push with no paths filter
- [ ] The eval job declares `needs: static` and is report-only
- [ ] The cache key varies with `hashFiles('evals/**')`
- [ ] Both jobs resolve Node from `.nvmrc`, not a floating major
- [ ] A fork PR touching `skills/**` skips the eval job with a visible note rather than failing red
- [ ] `evals.yml` no longer exists

## Notes for Next Phase

The suite is now green and enforced, so any assertion added from here on has a meaningful signal. Phase 2 adds the first new validators (INT-16 and INT-17) and can rely on a passing baseline. INT-17 asserts no workflow uses a floating `node-version:`, which is only true because this phase fixed it, so land them in that order.
