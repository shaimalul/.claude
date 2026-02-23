# Validation Phase: Step {{stepIndex}}/{{totalSteps}} — {{stepName}}

You just finished implementing this micro-step. Now validate it thoroughly before we proceed.

## What Was Implemented
{{stepDescription}}

## Target Files
{{targetFiles}}

## Acceptance Criteria
- {{acceptanceCriteria}}

---

## Validation Checklist (run ALL checks in order)

### 1. Static Checks (CLAUDE.md post-implementation order)

Run each command — all must pass before proceeding:

```bash
npm test           # Must not break any existing tests
npx tsc --noEmit   # Zero TypeScript errors
npm run lint       # Zero lint errors
npm run build      # Build must succeed
```

Skip a check only if the script doesn't exist (`npm run lint` → no lint script → SKIP).

### 2. CLAUDE.md Compliance Check

Review every file written in this step:

- [ ] File ≤ 150 lines (if over, this step must be split in the fix phase)
- [ ] Functions ≤ 30 lines
- [ ] Named exports only — no `export default`
- [ ] No barrel `index.ts` imports — imports go directly to source file
- [ ] No `as Type` casting — use type guards instead
- [ ] No `any` or `unknown` without a type guard
- [ ] Booleans named `isX` / `hasX` / `canX`
- [ ] No `console.log` — use proper error handling / logging
- [ ] No raw HTTP status numbers — use `http-status-codes`
- [ ] No empty catch blocks — always log the error

Additional for `controller` / `service` codeType:
- [ ] Controller does not call repository directly (three-layer separation)
- [ ] `http-status-codes` package imported and used

Additional for `config` / auth / middleware steps:
- Invoke security-principal for a quick review of the new files:
  ```
  subagent_type: security-principal
  prompt: Review these new files for security issues: [file contents]
  Focus on: OWASP Top 10, hardcoded secrets, input validation, auth patterns
  ```

### 3. Probe Testing

**For functions, services, utilities** (`codeType: {{codeType}}`):

Create `.micro-probes/probe-{{stepId}}.mjs` that imports the implementation and calls it with:
- Happy path: valid, expected inputs
- `null` and `undefined`
- Empty values: `''`, `[]`, `{}`
- Boundary values: `0`, `-1`, `Number.MAX_SAFE_INTEGER`, very long string (1000 chars)
- Wrong types: number where string expected, string where number expected

Output results as JSON: `console.log(JSON.stringify({ results }))`.
Run: `node .micro-probes/probe-{{stepId}}.mjs`

**For React components** (`codeType: component`):

Use Playwright MCP tools directly (preferred — no file generation needed):
1. Start the dev server if not running
2. Call `browser_navigate` to the component's route (e.g., Storybook or dev route)
3. Call `browser_snapshot` — verify the component structure appears in the accessibility tree
4. Call `browser_take_screenshot` — save for visual confirmation
5. Check for console errors in the snapshot output

If Playwright MCP is not available, write `.micro-probes/probe-{{stepId}}.mjs` using standalone `playwright`:
```js
const { chromium } = require('playwright');
// launch, navigate, screenshot, collect errors, exit 1 if errors
```

**For API endpoints** (`codeType: controller`):

Write `.micro-probes/probe-{{stepId}}.mjs` using `fetch`:
- Valid payload → expect 2xx
- Missing required fields → expect 4xx
- Invalid field values → expect 4xx
- Extra unknown fields → must not crash

---

## Validation Report

After running all checks, output this report:

```
## Validation Report: {{stepName}}

| Check | Result | Details |
|-------|--------|---------|
| npm test | PASS/FAIL/SKIP | ... |
| TypeScript | PASS/FAIL | ... |
| Lint | PASS/FAIL/SKIP | ... |
| Build | PASS/FAIL/SKIP | ... |
| CLAUDE.md compliance | PASS/FAIL | [violations if any] |
| Probe: happy path | PASS/FAIL/SKIP | ... |
| Probe: null/empty | PASS/FAIL/SKIP | ... |
| Probe: boundary | PASS/FAIL/SKIP | ... |
| Probe: wrong types | PASS/FAIL/SKIP | ... |
| Component render | PASS/FAIL/SKIP | ... |
| Security review | PASS/FAIL/SKIP | ... |
```

### 4. Cleanup
Delete probe scripts: `rm -rf .micro-probes/`

### 5. Signal Result

If ALL checks pass:
```
<micro-validated result="pass"/>
```

If ANY check fails:
```
<micro-validated result="fail" reason="[specific failure description]"/>
```
