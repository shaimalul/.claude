---
name: find-bug
description: Disciplined diagnosis loop for hard bugs and performance regressions. Reproduce, minimise, hypothesise, instrument, fix, regression-test. Use when something is broken, throwing, failing, flaky, or slow.
argument-hint: [error log, stack trace, file path, or bug description]
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write
model: opus
---

# Bug Finding

A discipline for hard bugs. Skip a phase only when you can justify skipping it out loud.

See [patterns.md](patterns.md) for common bug patterns and error analysis strategies.

Follow the `domain-modeling` consumer rules while exploring, so your mental model of the modules uses the project's own vocabulary, and check ADRs in the area you are touching.

## Bug Context: $ARGUMENTS

## Phase 1: Build a Feedback Loop

THIS IS THE SKILL. Everything else is mechanical.

With a TIGHT pass/fail signal that goes red on THIS bug, you will find the cause. Bisection, hypothesis testing, and instrumentation all just consume that signal. Without one, no amount of staring at code will save you.

Spend disproportionate effort here. Be aggressive. Be creative. Refuse to give up.

### Ways to construct one, roughly in this order

1. FAILING TEST at whatever seam reaches the bug: unit, integration, or e2e
2. CURL or HTTP script against a running dev server
3. CLI INVOCATION with a fixture input, diffing stdout against a known-good snapshot
4. HEADLESS BROWSER script (Playwright) that drives the UI and asserts on DOM, console, or network
5. REPLAY A CAPTURED TRACE. Save a real request, payload, or event log to disk and replay it through the code path in isolation
6. THROWAWAY HARNESS. A minimal subset of the system, one service with mocked deps, that exercises the bug path with a single function call
7. PROPERTY OR FUZZ LOOP. For "sometimes wrong output", run 1000 random inputs and look for the failure mode
8. BISECTION HARNESS. If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so `git bisect run` can drive it
9. DIFFERENTIAL LOOP. Run the same input through old versus new, or two configs, and diff the outputs
10. HUMAN-IN-THE-LOOP SCRIPT. Last resort. If a human must click, drive THEM with a scripted checklist so the loop stays structured, and feed the captured output back

### Tighten the loop

Treat the loop as a product. Once you have A loop, TIGHTEN it:

- Faster? Cache setup, skip unrelated init, narrow the test scope
- Sharper signal? Assert on the specific symptom, not "did not crash"
- More deterministic? Pin time, seed RNG, isolate the filesystem, freeze the network

A 30-second flaky loop is barely better than no loop. A 2-second deterministic one is a superpower.

### Non-deterministic bugs

The goal is not a clean repro, it is a HIGHER REPRODUCTION RATE. Loop the trigger 100 times, parallelise, add stress, narrow timing windows, inject sleeps. A 50 percent flake is debuggable. A 1 percent flake is not. Keep raising the rate until it is.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for one of:

- Access to an environment that reproduces it
- A captured artifact (HAR file, log dump, core dump, screen recording with timestamps)
- Permission to add temporary production instrumentation

Do NOT proceed to hypothesise without a loop.

### Completion criterion

Phase 1 is done when you can name ONE COMMAND, a script path, a test invocation, a curl, that you have ALREADY RUN AT LEAST ONCE. Paste the invocation and its output. It must be:

- [ ] RED-CAPABLE. It drives the actual bug code path and asserts the USER'S EXACT SYMPTOM, so it goes red on this bug and green once fixed. Not "runs without erroring"
- [ ] DETERMINISTIC. Same verdict every run. For flaky bugs, a pinned high reproduction rate
- [ ] FAST. Seconds, not minutes
- [ ] AGENT-RUNNABLE. You can run it unattended

If you catch yourself reading code to build a theory before this command exists, STOP. Jumping straight to a hypothesis is the exact failure this skill prevents. No red-capable command, no Phase 2.

## Phase 2: Reproduce and Minimise

Run the loop. Watch it go red.

Confirm:

- [ ] The loop produces the failure mode the USER described, not a different failure that happens to be nearby. Wrong bug means wrong fix
- [ ] The failure reproduces across multiple runs, or at a high enough rate to debug against
- [ ] You captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix addresses it

### Minimise

Shrink the repro to the SMALLEST scenario that still goes red. Cut inputs, callers, config, data, and steps ONE AT A TIME, re-running the loop after each cut. Keep only what is load-bearing.

A minimal repro shrinks the hypothesis space in Phase 3 and becomes the clean regression test in Phase 5.

Done when removing any remaining element makes the loop go green.

Do not proceed until you have reproduced AND minimised.

## Phase 3: Hypothesise

Generate 3 to 5 RANKED hypotheses before testing any of them. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be FALSIFIABLE. State the prediction it makes:

> If X is the cause, then changing Y will make the bug disappear, or changing Z will make it worse.

If you cannot state the prediction, the hypothesis is a vibe. Discard or sharpen it.

SHOW THE RANKED LIST TO THE USER before testing. They often re-rank it instantly ("we just deployed a change to #3") or know which ones they already ruled out. Cheap checkpoint, big time saver. Do not block on it; proceed with your ranking if the user is away.

## Phase 4: Instrument

Each probe maps to a specific prediction from Phase 3. CHANGE ONE VARIABLE AT A TIME.

Tool preference:

1. Debugger or REPL inspection if the environment supports it. One breakpoint beats ten logs
2. Targeted logs at the boundaries that distinguish hypotheses
3. Never "log everything and grep"

TAG EVERY DEBUG LOG with a unique prefix, for example `[DEBUG-a4f2]`. Cleanup becomes a single grep. Untagged logs survive by accident; tagged logs die on schedule.

Performance branch: for regressions, logs are usually wrong. Establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 5: Fix and Regression Test

Write the regression test BEFORE the fix, but only if there is a CORRECT SEAM for it.

A correct seam is one where the test exercises the REAL bug pattern as it occurs at the call site. If the only available seam is too shallow (a single-caller test when the bug needs multiple callers, a unit test that cannot replicate the chain that triggered it), a regression test there gives false confidence.

IF NO CORRECT SEAM EXISTS, THAT IS ITSELF THE FINDING. Report it. The architecture is preventing the bug from being locked down. Carry it into Phase 6.

If a correct seam exists, follow the `tdd` loop:

1. Turn the minimised repro into a failing test at that seam
2. Watch it fail
3. Apply the fix
4. Watch it pass
5. Re-run the Phase 1 loop against the ORIGINAL, un-minimised scenario

## Phase 6: Cleanup and Post-Mortem

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes, or the absence of a correct seam is documented
- [ ] All `[DEBUG-...]` instrumentation removed (grep the prefix)
- [ ] Throwaway harnesses removed, or moved to a clearly marked debug location
- [ ] The hypothesis that turned out correct is stated in the commit or PR message, so the next debugger learns

Then ask: WHAT WOULD HAVE PREVENTED THIS BUG?

If the answer is architectural (no good test seam, tangled callers, hidden coupling), hand off to `/refactor` or `/cleanup` with the specifics, and reference `codebase-design` for the seam vocabulary. Make that recommendation AFTER the fix is in, not before. You have more information now than when you started.

## Delegation

For a bug spanning unfamiliar code, spawn `bug-finder-agent` with the Task tool once Phase 1 is complete. Pass it the red-capable command and its output. An agent spawned before the loop exists will theorise, which is the failure this skill prevents.

```
subagent_type: bug-finder-agent
prompt: |
  Bug: $ARGUMENTS

  Red-capable loop (already run, already red):
  [command invocation]
  [its output]

  Minimised repro:
  [the smallest scenario that still goes red]

  Work Phases 3 through 5 of the find-bug skill: 3-5 ranked falsifiable
  hypotheses, then instrument one variable at a time with [DEBUG-xxxx] tagged
  logs, then fix with a regression test at a correct seam.
```

For security bugs, delegate to `security-agent`. For performance bugs in infrastructure, involve `devops-agent`.

## Output Format

```markdown
## Bug Analysis

### Feedback Loop
Command: `[the one command]`
Verdict: red on the reported symptom, [N]ms, deterministic

### Minimised Repro
[the smallest scenario that still goes red]

### Hypotheses Considered
| # | Hypothesis | Prediction | Verdict |
|---|-----------|------------|---------|
| 1 | ... | ... | Confirmed / Ruled out |

### Root Cause
[Why this happens. The confirmed hypothesis, stated plainly.]

### Location
- File: path/to/file.ts
- Line: 42
- Function: processUser

### Fix

```typescript
// Before (buggy)
const normalized = email.toLowerCase();

// After (fixed)
const normalized = email?.toLowerCase() ?? '';
```

### Regression Test
Seam: [where the test lives, and why that seam is correct]
[or: No correct seam exists. [Why.] This is a finding in its own right.]

### What Would Have Prevented This
[Architectural or process answer. Hand off to /refactor or /cleanup if architectural.]

### Related Patterns
- [Other places in the codebase that might have the same issue]
```

## Input Types Supported

Error logs, stack traces, file references, user reports, or a mix:

```
/find-bug TypeError: Cannot read property 'name' of undefined
    at UserProfile (src/components/UserProfile.tsx:15:23)
```

```
/find-bug When I click the submit button twice quickly, two orders are created
```

```
/find-bug The API returns 500 when email is empty:
POST /api/users { "name": "John", "email": "" }
Server log: TypeError: email.toLowerCase is not a function
```

Whatever the input shape, Phase 1 comes first. A stack trace is a clue, not a feedback loop.
