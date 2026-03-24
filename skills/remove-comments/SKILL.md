---
name: remove-comments
description: Remove obvious/redundant comments while preserving valuable documentation. Use when code has excessive comments that restate what the code does.
allowed-tools: Read, Grep, Glob, Edit
---

# Remove Obvious Comments

Clean up redundant comments while preserving valuable documentation.

## Analysis Process

Use Glob to find source files, Read to examine patterns, Grep to locate comment types.

**Comments to Remove:**
- Simply restate what the code does
- Add no value beyond the code itself
- State the obvious (like "constructor" above a constructor)

**Comments to Preserve:**
- Explain WHY something is done
- Document complex business logic
- Contain TODOs, FIXMEs, or HACKs
- Warn about non-obvious behavior
- Provide important context

## Review Process

For each file with obvious comments:
1. Show the redundant comments found
2. Explain why they should be removed
3. Show the cleaner version
4. Apply the changes after confirmation
