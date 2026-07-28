---
name: plan-test
description: Interactive test planning for production-grade tests. Use after building a feature to design edge cases, boundary tests, and failure modes before writing tests.
argument-hint: [feature file path or description]
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
model: opus
---

# Production-Grade Test Planning

LLM-generated tests tend to be shallow happy-path assertions that "just pass." This skill helps engineers design resilient, battle-tested test suites that mock production scenarios and survive refactoring.

Prerequisite knowledge: `testing-patterns` (boundary testing standard), `tdd` (the red-green loop and seams), `codebase-design` (what a seam is).

Output: A structured test plan. This skill does NOT generate test code, it helps you THINK about what to test.

Relationship to planning: `/plan-task` and `/plan-to-docs` already agree the SEAMS during their grill, so every plan carries them. Reach for this skill when you want to go deeper at those seams, designing edge cases and failure modes before writing the tests.

## Phase 1: Context Gathering (Automated)

Before asking any questions, gather context automatically:

1. If `$ARGUMENTS` is a file path, read the file(s)
2. If `$ARGUMENTS` is a description, search the codebase for relevant files
3. For each file found, identify:
   - Public API surface (exports, function signatures, component props)
   - External dependencies (HTTP calls, DB queries, file I/O, timers)
   - State transitions (loading/error/success, finite state patterns)
   - Error handling paths (try/catch, error boundaries, fallback UI)
   - Configuration dependencies (env vars, config objects, feature flags)
4. Search for existing test files (`*.test.ts`, `*.spec.ts` alongside source)

Present a brief **Feature Understanding** summary:

```markdown
## Feature Understanding

**Purpose**: [What this feature does in one sentence]

**Public Contracts**:
- [Exported function/component]: [input] -> [output]

**Boundaries Detected**:
- [HTTP/DB/File/Time/Env] -> [specific usage]

**Error Paths Found**:
- [try/catch blocks, error states, fallback logic]

**Current Test Coverage**: [Existing test file found / No tests found]
```

Then proceed to Phase 2.

## Phase 2: Grill Session (Interactive)

Run the `grilling` protocol. That skill owns the technique: one question at a time, your recommended answer as context, explore the codebase instead of asking when you can, and always offer the stop option.

This skill owns only the question categories below. Pick 2-3 from each based on relevance, and skip categories that do not apply to this feature.

### Category 0: Seams

- "Which seam does each behaviour get tested at? My read is: [your analysis]"
- "Is there an existing seam that already reaches this behaviour, so we do not add a new one?"
- "Is there a HIGHER seam that would cover this with fewer tests?"

No test is planned at a seam the engineer has not confirmed. If `/plan-task` or `/plan-to-docs` already agreed the seams, load them and confirm rather than re-deriving.


### Category 1: Contract Questions

- "What is the contract of [function/component]? What does a consumer depend on? My read of the code suggests: [your analysis]"
- "If the response shape from [boundary] changes, who breaks? What downstream consumers rely on this exact shape?"
- "What promises does this API make that callers rely on? (e.g., always returns array, never throws, resolves within Xms)"
- "Are there implicit contracts? (e.g., ordering guarantees, idempotency, side effects)"

### Category 2: Boundary Questions

- "What external systems does this touch? I found: [list from Phase 1]. Am I missing any?"
- "What happens when [specific boundary] is unavailable? (network timeout, 503, connection refused)"
- "What happens when [specific boundary] returns unexpected data? (empty array, null, malformed JSON, HTML instead of JSON)"
- "What happens when [specific boundary] is slow? (2s, 10s, 30s response times)"
- "Are there rate limits, quotas, or throttling on any boundary that could affect behavior?"

### Category 3: Edge Case Questions

- "What are the boundary values for [identified input]? (empty, zero, negative, max int, empty string, null, undefined)"
- "What happens with concurrent calls? Can this be invoked twice simultaneously? What about race conditions?"
- "What are the state transitions? Can you reach an invalid state? (e.g., loading=true + error=true simultaneously)"
- "What happens when the user does something unexpected? (double-click, back button, refresh mid-operation, paste instead of type)"
- "Are there temporal edge cases? (midnight rollover, timezone differences, DST transitions, leap year)"

### Category 4: Failure Mode Questions

- "What is the worst thing that can happen if this breaks in production? (data loss, incorrect billing, security breach, silent corruption)"
- "How does this fail gracefully? What does the user see on failure?"
- "What partial failure scenarios exist? (first API call succeeds, second fails - is state consistent?)"
- "Can this feature leave data in an inconsistent state? (e.g., created record but failed to send notification)"
- "What happens on retry? Is this operation idempotent?"

### Category 5: Library Swap Test

- "I see the code uses [detected library]. If we swapped it for an alternative, would the tests we're planning still make sense?"
- "Are we planning to test the contract (input/output) or the implementation (how it works internally)?"

## Phase 3: Test Plan Generation

After the grill-me session (when engineer selects "stop asking"), produce this structured test plan:

```markdown
## Test Plan: [Feature Name]

### Contracts Under Test
| # | Contract | Input | Expected Output | Priority |
|---|----------|-------|-----------------|----------|
| 1 | [function/endpoint name] | [input description] | [output description] | High/Medium |

### Boundary Tests (Mock at HTTP/DB/FS layer)
| # | Boundary | Scenario | Mock Setup | Expected Behavior |
|---|----------|----------|------------|-------------------|
| 1 | HTTP (MSW) | API returns 200 with data | `http.get('/api/x', () => HttpResponse.json(data))` | Renders data correctly |
| 2 | HTTP (MSW) | API returns 500 | `http.get('/api/x', () => HttpResponse.json({}, { status: 500 }))` | Shows error state |
| 3 | HTTP (MSW) | API returns empty array | `http.get('/api/x', () => HttpResponse.json([]))` | Shows empty state |
| 4 | HTTP (MSW) | API returns malformed data | `http.get('/api/x', () => HttpResponse.json({ wrong: 'shape' }))` | Handles gracefully |
| 5 | HTTP (MSW) | Network timeout | `http.get('/api/x', () => delay('infinite'))` | Shows timeout/retry |

### Edge Case Tests
| # | Case | Input | Expected Behavior |
|---|------|-------|-------------------|
| 1 | Empty input | `[]` / `""` / `null` | [specific behavior] |
| 2 | Boundary value | [max/min/zero] | [specific behavior] |
| 3 | Concurrent invocation | Call twice rapidly | [no duplicate, idempotent, etc.] |

### Failure Mode Tests
| # | Failure Scenario | Setup | Expected Recovery |
|---|------------------|-------|-------------------|
| 1 | Partial failure | First call succeeds, second fails | [rollback/retry/error state] |
| 2 | Retry behavior | Operation fails then succeeds | [idempotent/deduped] |

### State Transition Tests
| # | From State | Action | To State | Assertion |
|---|------------|--------|----------|-----------|
| 1 | idle | trigger fetch | loading | Spinner visible |
| 2 | loading | success response | success | Data rendered |
| 3 | loading | error response | error | Error message shown |

### Tests NOT to Write (Anti-Patterns)
- Do NOT `vi.mock('[library]')` - use MSW/nock at HTTP boundary instead
- Do NOT test that [specific internal function] was called - test the output
- Do NOT test [third-party behavior] - that's their responsibility
- Do NOT test [TypeScript-guaranteed behavior] - types already enforce this
- [Any other feature-specific anti-patterns identified during grilling]

### Suggested Test File Structure
```typescript
describe('[FeatureName]', () => {
  // Setup: MSW handlers, test wrappers, etc.

  describe('when [scenario group 1]', () => {
    it('should [contract 1]', () => {});
    it('should [contract 2]', () => {});
  });

  describe('when [boundary] fails', () => {
    it('should [failure behavior]', () => {});
    it('should [recovery behavior]', () => {});
  });

  describe('edge cases', () => {
    it('should handle [edge case 1]', () => {});
    it('should handle [edge case 2]', () => {});
  });
});
```

### Priority Order
1. [Most critical test to write first - highest production risk]
2. [Second priority]
3. [Third priority]
```

## Phase 4: Next Steps

After presenting the test plan, remind the engineer:

1. Load `tdd` skill for the RED-GREEN-REFACTOR workflow
2. Load `testing-patterns` skill for boundary mocking conventions
3. Start with the highest priority test from the plan
4. After writing tests, run `/review-test` to audit the test quality
