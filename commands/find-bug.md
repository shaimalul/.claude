---
description: Analyze bug context (error logs, stack traces, code) to identify root cause and suggest fixes
argument-hint: [error log, stack trace, file path, or bug description]
allowed-tools: Task, Read, Grep, Glob, Bash
model: opus
---

# Bug Finding

Use the **Task tool** to invoke the `bug-finder` agent for comprehensive bug analysis.

## Bug Context: $ARGUMENTS

## Instructions

Spawn the bug-finder agent using the Task tool:

**Task tool invocation:**
```
subagent_type: bug-finder
prompt: |
  Analyze this bug context and identify the root cause:

  $ARGUMENTS

  Follow this analysis process:

  1. **Classify the Input**
     - Determine if this is an error log, stack trace, code snippet, or user report
     - Identify the language/framework involved
     - Note any file paths or line numbers mentioned

  2. **Parse the Error**
     - Extract the error type and message
     - Identify the failure point from stack trace
     - Note any relevant context (request data, user action)

  3. **Search for Related Code**
     - If file paths are provided, read those files
     - Search for related patterns in the codebase
     - Look for similar error handling patterns

  4. **Identify Root Cause**
     - Match against known bug patterns (from find-bug skill)
     - Trace data flow to find where assumptions break
     - Identify the specific condition that triggers the bug

  5. **Develop Fix**
     - Create working code that fixes the issue
     - Add defensive measures to prevent recurrence
     - Suggest test cases to verify the fix

  6. **Provide Response**
     Use this format:

     ## Bug Analysis

     ### Summary
     [One sentence description of the bug]

     ### Root Cause
     [Clear explanation of why this happens]

     ### Location
     - **File**: [path if known]
     - **Line**: [line number if known]
     - **Function**: [function name if known]

     ### Fix

     ```[language]
     // Before (buggy)
     [original code]

     // After (fixed)
     [corrected code]
     ```

     ### Explanation
     [Why the fix works]

     ### Prevention
     - [How to prevent this type of bug]

     ### Related Patterns
     - [Other places in codebase that might have similar issues]
```

## Input Types Supported

### 1. Error Logs
```
/find-bug TypeError: Cannot read property 'name' of undefined
    at UserProfile (src/components/UserProfile.tsx:15:23)
```

### 2. Stack Traces
```
/find-bug
Error: ECONNREFUSED
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at Protocol._enqueue (/app/node_modules/mysql/lib/protocol/Protocol.js:144:48)
```

### 3. File References
```
/find-bug There's a bug in src/services/userService.ts causing duplicate users
```

### 4. User Reports
```
/find-bug When I click the submit button twice quickly, two orders are created
```

### 5. Mixed Context
```
/find-bug The API returns 500 when email is empty:
POST /api/users { "name": "John", "email": "" }
Response: { "error": "Internal Server Error" }
Server log: TypeError: email.toLowerCase is not a function
```

## Output Format

The agent returns analysis in this format:

```markdown
## Bug Analysis

### Summary
[One line description]

### Root Cause
[Detailed explanation]

### Location
- **File**: path/to/file.ts
- **Line**: 42
- **Function**: processUser

### Fix

```typescript
// Before (buggy)
const normalized = email.toLowerCase();

// After (fixed)
const normalized = email?.toLowerCase() ?? '';
```

### Explanation
The code assumes `email` is always a string, but the API allows
empty or missing email values. The fix uses optional chaining
and nullish coalescing to handle these cases safely.

### Prevention
1. Add input validation in the controller layer
2. Use TypeScript strict mode to catch potential undefined access
3. Add unit tests for edge cases (empty string, undefined, null)

### Related Patterns
- Check `src/services/orderService.ts:28` for similar pattern
- The `normalizeInput` utility could be extracted for reuse
```

## Integration with Other Commands

- For security vulnerabilities: `/find-bug` will delegate to `security-principal`
- For architecture issues: `/find-bug` may suggest `/architect` review
- For performance bugs: `/find-bug` will involve relevant specialist

**Important**:
- Provide working, copy-paste ready code examples
- Point to specific lines when possible
- Explain why the bug occurs, not just how to fix it
- Suggest preventive measures
