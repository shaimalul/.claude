---
name: find-bug
description: Analyze bug context (error logs, stack traces, code) to identify root cause and suggest fixes. Use when debugging errors, analyzing stack traces, or investigating runtime failures.
argument-hint: [error log, stack trace, file path, or bug description]
allowed-tools: Task, Read, Grep, Glob, Bash
model: opus
---

# Bug Finding

Use the **Task tool** to invoke the `bug-finder` agent for comprehensive bug analysis.

For detailed bug patterns reference, see [patterns.md](patterns.md).

## Bug Context: $ARGUMENTS

## Instructions

Spawn the bug-finder agent using the Task tool:

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

- **Error Logs**: `/find-bug TypeError: Cannot read property 'name' of undefined`
- **Stack Traces**: `/find-bug Error: ECONNREFUSED at TCPConnectWrap...`
- **File References**: `/find-bug There's a bug in src/services/userService.ts causing duplicate users`
- **User Reports**: `/find-bug When I click submit twice quickly, two orders are created`
- **Mixed Context**: `/find-bug The API returns 500 when email is empty: POST /api/users...`

## Integration

- For security vulnerabilities: delegates to `security-principal`
- For architecture issues: may suggest `/consult architect`
- For performance bugs: involves relevant specialist
