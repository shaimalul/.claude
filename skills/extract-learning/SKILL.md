---
name: extract-learning
description: |
  Autonomous knowledge extraction from sessions. Triggers on:
  (1) /extract-learning command
  (2) "save this as a skill" or "extract what we learned"
  (3) After debugging with non-obvious solutions
  Saves reusable patterns to ~/.claude/skills/learned/
author: Claude Code
version: 1.0.0
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Skill
---

# Extract Learning: Session Knowledge Extraction

## Core Principle

Extract reusable knowledge ONLY when it meets quality criteria:
- **Reusable**: Benefits future tasks, not just this instance
- **Non-trivial**: Required discovery, not documentation lookup
- **Specific**: Exact trigger conditions identifiable
- **Verified**: Solution actually worked

## Quality Gates

Before saving, verify:
- [ ] Description contains specific trigger conditions (error messages, symptoms)
- [ ] Solution was verified to work
- [ ] Content is actionable and reusable
- [ ] No sensitive information included
- [ ] Doesn't duplicate existing documentation
- [ ] Would help someone hitting this problem in 6 months

## Extraction Triggers

Extract when you:
1. Completed debugging with a **non-obvious solution**
2. Found a workaround through **trial-and-error**
3. Resolved an error where **root cause wasn't immediately apparent**
4. Learned **project-specific patterns** through investigation
5. User says "save this as a skill" or "extract this learning"

## What NOT to Extract

Skip extraction for:
- Documentation lookups (just link to docs)
- One-time project-specific fixes
- Unverified or partial solutions
- Trivial implementations
- Common knowledge available in tutorials

## Extraction Process

### Step 1: Check for Existing Skills

Search both directories for similar skills:
```bash
~/.claude/skills/learned/     # User-level
.claude/skills/               # Project-level (if exists)
```

If similar skill exists: **UPDATE** it, don't duplicate.

### Step 2: Identify the Knowledge

Analyze:
- What specific problem was solved?
- What made it non-obvious?
- What would help someone solve this faster next time?
- What exact error message or symptom led here?

### Step 3: Research Best Practices (if technology-specific)

For technology-related learnings, use WebSearch to find:
- Official documentation references
- Known gotchas and pitfalls
- Current best practices (2026)

Skip for project-specific patterns.

### Step 4: Create Skill File

Save to `~/.claude/skills/learned/[category]-[short-description].md`

**Categories:**
- `typescript` - Type issues, generics, type guards
- `react` - Hooks, state, components, lifecycle
- `backend` - APIs, services, databases, Node.js
- `security` - Auth, vulnerabilities, OWASP
- `devops` - Docker, K8s, CI/CD
- `general` - Everything else

### Step 5: Use Standard Format

```markdown
# [Descriptive Pattern Name]

**Extracted:** YYYY-MM-DD
**Source:** /extract-learning
**Type:** [error-resolution|workaround|pattern|configuration]
**Category:** [typescript|react|backend|security|devops|general]

## Problem

[What issue this pattern addresses - be SPECIFIC]
[Include exact error messages, symptoms, or conditions]

## Solution

[The fix or best practice - step by step if needed]

## Example

```typescript
// Bad - what causes the problem
[problematic code]

// Good - the fix
[correct code]
```

## When to Use

[Trigger conditions - when this skill should activate]
[What keywords or symptoms to look for]
```

### Step 6: Report Extraction

Output to user:
```markdown
## Learning Extracted

**Problem:** [Specific problem description]
**Solution:** [What worked]
**Saved to:** ~/.claude/skills/learned/[filename].md
**Reusability:** [How this helps future tasks]
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad |
|--------------|--------------|
| Over-extraction | Not every task needs a skill |
| Vague descriptions | "Helps with React" is useless for retrieval |
| Unverified solutions | Only extract what actually worked |
| Documentation duplication | Link to docs, add what's missing |
| Sensitive data | Never include API keys, passwords, etc. |

## Retrospective Mode

When `/extract-learning` is called without a specific topic:

1. Review the session conversation for extraction candidates
2. Look for patterns: debugging, workarounds, discoveries
3. For each candidate:
   - Check quality gates
   - If passes: extract
   - If fails: skip with reason
4. Report summary of what was/wasn't extracted
