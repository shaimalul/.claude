---
name: extract-learning
description: |
  Autonomous knowledge extraction from sessions. Triggers on:
  (1) /extract-learning command
  (2) "save this as a skill" or "extract what we learned"
  (3) After debugging with non-obvious solutions
  Integrates learnings into existing domain skill files.
allowed-tools: Read, Write, Edit, Grep, Glob, Skill
---

# Extract Learning: Session Knowledge Extraction

Extract reusable knowledge from your current session and integrate it into the appropriate skill files.

**Arguments:** `$ARGUMENTS` - Optional: specific topic to extract (e.g., "the prisma pooling fix")

## Core Principle

Extract reusable knowledge and **integrate it into existing skill files** rather than creating separate files. This maintains single source of truth and keeps related patterns together.

## When to Use

Run this skill when you've:
- Fixed a non-obvious bug
- Found a workaround through trial-and-error
- Resolved an error where root cause wasn't immediately apparent
- Discovered a useful pattern through investigation

## Quality Gates (MUST ALL PASS)

- [ ] Solution was verified to work (not theoretical)
- [ ] Description has specific triggers (error messages, symptoms)
- [ ] Knowledge is reusable (not one-time fix)
- [ ] No sensitive data (API keys, passwords)
- [ ] Not just documentation lookup

## Instructions

### Step 1: Identify the Learning

**If specific topic provided:** Focus on `$ARGUMENTS`

**If no topic (session review):**
1. Review the session conversation for extraction candidates
2. Look for signals:
   - "finally fixed", "figured out", "the issue was"
   - "turns out", "the trick is", "workaround"
   - "root cause", "after debugging"
3. For each candidate, check quality gates

### Step 2: Categorize the Learning

Match the learning to an existing skill domain:

| Learning Topic | Target Skill |
|----------------|--------------|
| RTL, CSS, styling, logical properties | `styling-rtl` |
| React hooks, components, state | `react-component` |
| TypeScript types, generics | `typescript-types` |
| Backend, APIs, services | `backend-patterns` |
| Security, auth, OWASP | `security-patterns` |
| Testing, mocking, coverage | `testing-patterns` |
| useEffect, lifecycle | `useeffect-patterns` |
| Docker, K8s, CI/CD | devops skills |

| Storybook stories | `storybook-story` |
| Accessibility, ARIA | `accessibility-patterns` |

### Step 3: Search for Existing Content

Before adding, search the target skill file for similar patterns:
1. Read the target SKILL.md file
2. Search for keywords from the learning
3. If similar content exists: **UPDATE** it, don't duplicate
4. If not found: **ADD** new section in appropriate location

### Step 4: Integrate the Learning

**Format for skill files:**

```markdown
## [Pattern/Rule Name]

[Problem description with specific triggers]

```[language]
// Bad - [what causes the problem]
[problematic code]

// Good - [the fix]
[correct code]
```

**When to apply:** [Trigger conditions]
```

### Step 5: Update Related Files

Based on category, also update:
- `CLAUDE.md` - If it's a core coding standard
- `rules/*.md` - If it's an enforcement rule
- `agents/*.md` - If it affects a principal's domain

### Step 6: Report Results

```markdown
## Learning Extracted

**Problem:** [Brief problem description]
**Solution:** [What worked]
**Integrated into:**
- `~/.claude/skills/[skill-name]/SKILL.md` - Added [section name]
- `~/.claude/[other-file]` - Updated [section name]

**Why this location:** [Brief explanation of routing decision]
```

If nothing extracted:

```markdown
## No Learnings Extracted

**Reason:** [Why nothing qualified]
**Tip:** Run this skill after solving non-obvious problems
```

## Important: No Separate Learned Folder

**DO NOT** create files in `~/.claude/skills/learned/`. All learnings should be integrated into existing domain skill files. This maintains single source of truth and keeps related patterns together.
