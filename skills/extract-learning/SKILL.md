---
name: extract-learning
description: |
  Autonomous knowledge extraction from sessions. Triggers on:
  (1) /extract-learning command
  (2) "save this as a skill" or "extract what we learned"
  (3) After debugging with non-obvious solutions
  Integrates learnings into existing domain skill files.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Extract Learning: Session Knowledge Extraction

Extract reusable knowledge from your current session and integrate it into the appropriate skill files.

**Arguments:** `$ARGUMENTS` - Optional: specific topic to extract (e.g., "the prisma pooling fix")

## Core Principle

Extract reusable knowledge and **integrate it into existing skill files** rather than creating separate files. This maintains single source of truth and keeps related patterns together.

## Quality Gates

Before saving, verify:
- [ ] Description contains specific trigger conditions (error messages, symptoms)
- [ ] Solution was verified to work
- [ ] Content is actionable and reusable
- [ ] No sensitive information included
- [ ] Doesn't duplicate existing documentation
- [ ] Not just a documentation lookup (link to docs instead)
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
| Backend, APIs | `~/.claude/skills/js-backend-patterns/SKILL.md` |
| Security, auth | `~/.claude/skills/security-patterns/SKILL.md` |
| Testing, mocks | `~/.claude/skills/testing-patterns/SKILL.md` |
| Design system, tokens | `~/.claude/skills/design-system-patterns/SKILL.md` |
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
| express, nestjs, controller, service, api | `js-backend-patterns` |
| auth, jwt, xss, injection, owasp | `security-patterns` |
| test, mock, spec, coverage, vitest | `testing-patterns` |
| design system, tokens, components | `design-system-patterns` |

### Step 4: Present Proposed Changes and Get Confirmation

CRITICAL: NEVER write directly to skill files. Present the proposed changes to the user first and wait for explicit approval.

Format your proposal as:

```markdown
## Proposed Learnings

**Learning 1:** [title]
- Target: `~/.claude/skills/[skill-name]/SKILL.md`
- Section to add/update: [section name]
- Content summary: [brief description]

**Learning 2:** [title]
- ...

Shall I apply these changes?
```

Use AskUserQuestion if available, otherwise present in text and wait for confirmation. Do NOT proceed to Step 5 without explicit user approval.

### Step 5: Unlock Config Editing and Apply

Only after user approves, create the bypass lock file:
```bash
echo $(date +%s) > ~/.claude/.config-edit-unlocked
```

Then integrate into the target SKILL.md using this format:

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

Also consider updating (with the same user-approved scope):
- `CLAUDE.md` - If it's a core coding standard
- `rules/*.md` - If it's an enforcement rule
- `agents/*.md` - If it affects an agent's domain

### Step 6: Clean Up and Report Results

Clean up the lock file:
```bash
rm -f ~/.claude/.config-edit-unlocked
```

Then report results:
```markdown
## Learning Extracted

**Problem:** [Specific problem description]
**Solution:** [What worked]
**Integrated into:**
- `~/.claude/skills/[skill-name]/SKILL.md` - Added [section name]
- `~/.claude/[other-file]` - Updated [section name]

**Why this location:** [Brief routing explanation]
```

If nothing extracted:
```markdown
## No Learnings Extracted

**Reason:** [Why nothing qualified - failed quality gates or no extractable patterns]
**Tip:** Run this command after solving non-obvious problems
```

## Categories Reference

| Category | Keywords | Primary Skill |
|----------|----------|---------------|
| `styling` | css, scss, rtl, left, right, start, end, padding, margin | `styling-rtl` |
| `react` | hook, useState, useEffect, component, prop, jsx | `react-component` |
| `typescript` | type, interface, enum, generic, as, any | `typescript-types` |
| `backend` | express, nestjs, controller, service, api | `js-backend-patterns` |
| `security` | auth, jwt, xss, injection, owasp | `security-patterns` |
| `testing` | test, mock, spec, coverage, vitest | `testing-patterns` |
| `devops` | docker, kubernetes, terraform, pipeline | devops skills |
| `design-system` | design system, tokens, components | `design-system-patterns` |

## Examples

```bash
# Extract RTL naming convention
/extract-learning "use start/end instead of left/right in prop names"

# Extract useEffect pattern
/extract-learning "why useEffect was running twice"

# Extract backend pattern
/extract-learning "the prisma connection pooling fix"

# Review full session
/extract-learning
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

## Important: No Separate Learned Folder

**DO NOT** create files in `~/.claude/skills/learned/`. All learnings should be integrated into existing domain skill files. This maintains single source of truth and keeps related patterns together.

If a learning truly doesn't fit any existing skill, consider:
1. Is it specific enough to be reusable?
2. Should a new skill be created in `skills/[domain-name]/SKILL.md`?
3. Or should it go in `rules/*.md` or `CLAUDE.md`?

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
