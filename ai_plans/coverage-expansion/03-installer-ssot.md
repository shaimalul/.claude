# Phase 3: Installer SSOT and Shell Coverage

## Goal

Collapse the two implementations of template rendering into one pure module, make the installer's only interesting logic testable without running shell, and cover the residual interactive branches.

## Why Now

Phase 1 made the suite trustworthy. This phase is independent of all eval work and can run alongside phase 2. It resolves a live SSOT violation, which this repo treats as a blocker rather than a suggestion.

## Dependencies

- Blocked by: 1
- Receives: a green suite and CI enforcement
- Provides: `settings-render.js` and the extracted INT-03 and INT-04 predicates. Nothing downstream depends on this phase, so it can also be deferred without blocking the frontier

## Seams Under Test

| Seam | New or Existing | What this phase covers at it |
|------|-----------------|------------------------------|
| `scripts/lib/settings-render.js` | New | `renderTemplate(templateText, homeDir)` is pure string to string, so the whole of generation is testable with no shell and no filesystem |
| `scripts/setup.sh` via spawn | Existing harness | The three interactive answers, asserted on file effects only |

The residual shell seam uses the existing `scripts/lib/sandbox.js` and `scripts/lib/hook-harness.js`, which already provide isolated-HOME and spawn-with-stdin primitives. No new harness is written.

## Scope

In:
- Extract `renderTemplate` into `scripts/lib/settings-render.js`
- `merge-settings.js` consumes it instead of its inline `.replace`
- Add an overwrite mode so `setup.sh` calls node in BOTH branches and contains zero `sed`
- `CLAUDE_DIR` override in `setup.sh` so tests never touch the real `$HOME`
- Extract the INT-03 and INT-04 rules into predicate functions reused across live settings, template, and render output
- Unit tests for render output, plus a spawn test for the three interactive branches

Out:
- Any change to what the template contains
- Any new hook or settings key

## Files to Add

- `scripts/lib/settings-render.js` - `renderTemplate(templateText, homeDir)`, pure
- `scripts/lib/tests/test-settings-render.js` - unit tests for render output
- `scripts/tests/` addition or `scripts/hooks/tests/` addition - the setup.sh branch test

## Files to Edit

- `scripts/merge-settings.js` - line 30 consumes `renderTemplate` instead of inlining `.replace`
- `scripts/setup.sh` - line 9 becomes `CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"`; lines 42 and 53 lose their `sed` in favour of a node call
- `scripts/tests/validate-integrity.test.js` - INT-03 and INT-04 call the extracted predicates rather than inlining their rules

## Implementation Steps

1. Extract `renderTemplate(templateText, homeDir)`
   - Body is the existing `templateRaw.replace(/__HOME__/g, homeDir)`
   - Pure: takes strings, returns a string, touches no filesystem and reads no environment
   - This single move resolves the SSOT violation, because the shell copy is deleted in step 3

2. Point `merge-settings.js` at it
   - Replace the inline `.replace` at line 30 with a call
   - Behaviour must be identical; this is a refactor with no functional change

3. Add an overwrite mode and delete both `sed` lines
   - `setup.sh` currently uses `sed` in two branches. Give `merge-settings.js` a mode that writes the rendered template directly, then call node from both branches
   - Generation logic then becomes zero lines of untested shell, which is the point of the phase

4. Make `setup.sh` testable
   - Line 9 becomes `CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"`
   - Without this the script always targets the real `$HOME` and cannot be tested safely. This is the single blocker for the spawn test

5. Extract the INT-03 and INT-04 predicates
   - INT-03 is "every configured hook event is a documented event name"; INT-04 is "both settings files declare the official schema"
   - Extract each into a predicate so the same rule applies to live settings, the template, AND render output. Otherwise a third copy of the schema rule appears when render output is validated

6. Test render output and the interactive branches
   - Render output: parses as JSON, contains no residual `__HOME__`, satisfies both predicates, every hook path absolute under the supplied home
   - Interactive: spawn bash with piped stdin for the three answers (`m`, `o`, `s`) against a temp skeleton via `sandbox.js`
   - Assert on file EFFECTS only, never on echoed stdout. Prose changes; effects do not

## Tests

- [ ] `settings-render.js`: output contains no residual `__HOME__` placeholder
- [ ] `settings-render.js`: output parses as JSON
- [ ] `settings-render.js`: output satisfies the extracted INT-03 hook-event predicate
- [ ] `settings-render.js`: output satisfies the extracted INT-04 schema predicate
- [ ] `settings-render.js`: every hook path in the output is absolute under the supplied home directory
- [ ] `setup.sh` via spawn: each of the three interactive answers produces the expected file effects in a sandboxed HOME

## Verification

```bash
npm run test:lib
npm test
grep -n "sed" scripts/setup.sh && echo "FAIL: sed still present" || echo "OK: zero sed"
grep -n "__HOME__" scripts/merge-settings.js scripts/setup.sh
```

The `grep` for `sed` must find nothing in the generation path. The `__HOME__` grep should show the placeholder only where the template defines it, never in two rendering implementations.

## Done When

- [ ] `renderTemplate` exists in one module and is the only implementation of the substitution
- [ ] `setup.sh` contains zero `sed` in the generation path
- [ ] `setup.sh` honours a `CLAUDE_DIR` override
- [ ] INT-03 and INT-04 are predicates applied to live settings, template and render output
- [ ] The spawn test covers all three interactive answers without touching the real `$HOME`
- [ ] `npm test` is green

## Notes for Next Phase

This phase establishes the pattern that the rest of the plan follows for expensive or awkward surfaces: find the pure function inside, extract it, test that for free, and leave as little untested imperative shell as possible. Phase 5 applies exactly the same move to prompt composition, extracting a pure renderer so the eval harness can be verified without paying for API calls.

Nothing downstream is blocked by this phase.
