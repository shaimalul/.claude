---
name: extract-learning
description: |
  Autonomous knowledge extraction from sessions. Triggers on:
  (1) /extract-learning command
  (2) "save this as a skill" or "extract what we learned"
  (3) After debugging with non-obvious solutions
  Integrates learnings into existing domain skill files.
metadata:
  author: Claude Code
  version: 2.0.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Skill
---

# Extract Learning: Session Knowledge Extraction

## Core Principle

Extract reusable knowledge and **integrate it into existing skill files** rather than creating separate files. This maintains single source of truth and keeps related patterns together.

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

Search domain skill files for similar patterns:

| Domain | Target Skill File |
|--------|-------------------|
| RTL, CSS, styling | `~/.claude/skills/styling-rtl/SKILL.md` |
| React, hooks, components | `~/.claude/skills/react-component/SKILL.md` |
| TypeScript, types | `~/.claude/skills/typescript-types/SKILL.md` |
| Backend, APIs | `~/.claude/skills/backend-patterns/SKILL.md` |
| Security, auth | `~/.claude/skills/security-patterns/SKILL.md` |
| Testing, mocks | `~/.claude/skills/testing-patterns/SKILL.md` |
| Common UI, ZCD | `~/.claude/skills/common-ui-patterns/SKILL.md` |
| useEffect | `~/.claude/skills/useeffect-patterns/SKILL.md` |
| Accessibility | `~/.claude/skills/accessibility-patterns/SKILL.md` |

If similar pattern exists: **UPDATE** it, don't duplicate.

### Step 2: Identify the Knowledge

Analyze:
- What specific problem was solved?
- What made it non-obvious?
- What would help someone solve this faster next time?
- What exact error message or symptom led here?

### Step 3: Categorize and Route

Match the learning to the appropriate skill by keywords:

| Keywords | Target Skill |
|----------|--------------|
| css, scss, rtl, left, right, start, end, padding, margin | `styling-rtl` |
| hook, useState, useEffect, component, prop, jsx | `react-component` |
| type, interface, enum, generic, as, any | `typescript-types` |
| express, nestjs, controller, service, api | `backend-patterns` |
| auth, jwt, xss, injection, owasp | `security-patterns` |
| test, mock, spec, coverage, vitest | `testing-patterns` |
| ZCD, Zencity, common-ui, design system | `common-ui-patterns` |

### Step 4: Integrate into Existing Skill

Add a new section to the target SKILL.md using this format:

```markdown
## [Pattern Name]

[Problem description with specific triggers]

```[language]
// Bad - [what causes the problem]
[problematic code]

// Good - [the fix]
[correct code]
```

**When to apply:** [Trigger conditions]
```

### Step 5: Update Related Files (if needed)

Also consider updating:
- `CLAUDE.md` - If it's a core coding standard
- `rules/*.md` - If it's an enforcement rule
- `agents/*.md` - If it affects a principal's domain

### Step 6: Report Extraction

Output to user:
```markdown
## Learning Extracted

**Problem:** [Specific problem description]
**Solution:** [What worked]
**Integrated into:** ~/.claude/skills/[skill-name]/SKILL.md
**Section:** [Section name added/updated]
**Why this location:** [Brief routing explanation]
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad |
|--------------|--------------|
| Separate learned/ folder | Fragments knowledge, breaks single source of truth |
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
   - Route to appropriate skill
   - If passes: integrate into skill
   - If fails: skip with reason
4. Report summary of what was/wasn't extracted
