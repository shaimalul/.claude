# Extract Learning

Extract reusable knowledge from your current session and integrate it into the appropriate skill files.

**Arguments:** `$ARGUMENTS` - Optional: specific topic to extract (e.g., "the prisma pooling fix")

## What This Command Does

Analyzes your session for extractable knowledge and **integrates it into existing skill files** using the same routing logic as `/improve-claude`. This ensures learnings are placed where they belong, not in a separate location.

## When to Use

Run this command when you've:
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

| Learning Topic | Target Skill | Target Files |
|----------------|--------------|--------------|
| RTL, CSS, styling, logical properties | `styling-rtl` | `skills/styling-rtl/SKILL.md`, `rules/coding-style.md` |
| React hooks, components, state | `react-component` | `skills/react-component/SKILL.md`, `agents/frontend-principal.md` |
| TypeScript types, generics | `typescript-types` | `skills/typescript-types/SKILL.md`, `CLAUDE.md` |
| Backend, APIs, services | `backend-patterns` | `skills/backend-patterns/SKILL.md`, `agents/backend-principal.md` |
| Security, auth, OWASP | `security-patterns` | `skills/security-patterns/SKILL.md`, `rules/security.md` |
| Testing, mocking, coverage | `testing-patterns` | `skills/testing-patterns/SKILL.md`, `rules/testing.md` |
| useEffect, lifecycle | `useeffect-patterns` | `skills/useeffect-patterns/SKILL.md` |
| Docker, K8s, CI/CD | `devops` | Relevant devops skills, `agents/devops-principal.md` |
| Common UI, ZCD components | `common-ui-patterns` | `skills/common-ui-patterns/SKILL.md` |
| Storybook stories | `storybook-story` | `skills/storybook-story/SKILL.md` |
| Accessibility, ARIA | `accessibility-patterns` | `skills/accessibility-patterns/SKILL.md`, `agents/ux-principal.md` |

### Step 3: Search for Existing Content

Before adding, search the target skill file for similar patterns:
1. Read the target SKILL.md file
2. Search for keywords from the learning
3. If similar content exists: **UPDATE** it, don't duplicate
4. If not found: **ADD** new section in appropriate location

### Step 4: Integrate the Learning

**Format for skill files:**

Add a new section or update existing section with:

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

**Reason:** [Why nothing qualified - failed quality gates or no extractable patterns]
**Tip:** Run this command after solving non-obvious problems
```

## Categories Reference

| Category | Keywords | Primary Skill |
|----------|----------|---------------|
| `styling` | css, scss, rtl, left, right, start, end, padding, margin | `styling-rtl` |
| `react` | hook, useState, useEffect, component, prop, jsx | `react-component` |
| `typescript` | type, interface, enum, generic, as, any | `typescript-types` |
| `backend` | express, nestjs, controller, service, api | `backend-patterns` |
| `security` | auth, jwt, xss, injection, owasp | `security-patterns` |
| `testing` | test, mock, spec, coverage, vitest | `testing-patterns` |
| `devops` | docker, kubernetes, terraform, pipeline | devops skills |
| `common-ui` | ZCD, Zencity, common-ui, design system | `common-ui-patterns` |

## Examples

```bash
# Extract RTL naming convention
/extract-learning "use start/end instead of left/right in prop names"
# → Updates skills/styling-rtl/SKILL.md with React prop naming section

# Extract useEffect pattern
/extract-learning "why useEffect was running twice"
# → Updates skills/useeffect-patterns/SKILL.md

# Extract backend pattern
/extract-learning "the prisma connection pooling fix"
# → Updates skills/backend-patterns/SKILL.md or database-patterns

# Review full session
/extract-learning
# → Reviews session, routes each finding to appropriate skill
```

## Important: No Separate Learned Folder

**DO NOT** create files in `~/.claude/skills/learned/`. All learnings should be integrated into existing domain skill files. This maintains single source of truth and keeps related patterns together.

If a learning truly doesn't fit any existing skill, consider:
1. Is it specific enough to be reusable?
2. Should a new skill be created in `skills/[domain-name]/SKILL.md`?
3. Or should it go in `rules/*.md` or `CLAUDE.md`?
