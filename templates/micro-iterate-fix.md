# Fix Phase: Step — {{stepName}}

Validation failed. Fix the specific issue, then signal completion.

## Failure Reason
{{failureReason}}

---

## Fix Instructions

1. Read the failure reason carefully — fix ONLY that specific issue
2. Do not refactor, clean up, or change unrelated code
3. After applying the fix, do a quick sanity check:
   - Does the file compile? (`npx tsc --noEmit`)
   - Is the specific failure addressed?
4. Signal completion: `<micro-done/>`

The validation phase will run again automatically after you signal done.

---

Fix Attempt: **{{fixAttempt}}/{{maxFixAttempts}}**

If you cannot fix the issue after {{maxFixAttempts}} attempts, this step will be skipped with a warning and we'll move to the next one.
