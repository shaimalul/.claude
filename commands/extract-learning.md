# Extract Learning

Extract reusable knowledge from your current session and save it as a skill.

**Arguments:** `$ARGUMENTS` - Optional: specific topic to extract (e.g., "the prisma pooling fix")

## What This Command Does

Analyzes your session for extractable knowledge and saves reusable patterns as skills to `~/.claude/skills/learned/`.

## When to Use

Run this command when you've:
- Fixed a non-obvious bug
- Found a workaround through trial-and-error
- Resolved an error where root cause wasn't immediately apparent
- Discovered a useful pattern through investigation

## Instructions

### If Specific Topic Provided

1. Focus extraction on the specified topic: `$ARGUMENTS`
2. Verify the solution actually worked in this session
3. Check for existing similar skills in `~/.claude/skills/learned/`
4. If duplicate: update existing skill instead of creating new
5. Create skill file following the format below

### If No Topic (Session Review)

1. Review the session conversation for extraction candidates
2. Look for signals:
   - "finally fixed", "figured out", "the issue was"
   - "turns out", "the trick is", "workaround"
   - "root cause", "after debugging"
3. For each candidate, check quality gates
4. Extract those that pass, skip others with explanation

## Quality Gates (MUST ALL PASS)

- [ ] Solution was verified to work (not theoretical)
- [ ] Description has specific triggers (error messages, symptoms)
- [ ] Knowledge is reusable (not one-time fix)
- [ ] No sensitive data (API keys, passwords)
- [ ] Not just documentation lookup

## Skill File Format

Save to: `~/.claude/skills/learned/[category]-[description].md`

```markdown
# [Descriptive Pattern Name]

**Extracted:** YYYY-MM-DD
**Source:** /extract-learning
**Type:** [error-resolution|workaround|pattern|configuration]
**Category:** [typescript|react|backend|security|devops|general]

## Problem

[SPECIFIC problem description with exact error messages/symptoms]

## Solution

[Step-by-step fix]

## Example

```typescript
// Bad
[problematic code]

// Good
[fixed code]
```

## When to Use

[Trigger conditions for future retrieval]
```

## Categories

| Category | Use For |
|----------|---------|
| `typescript` | Type issues, generics, type guards |
| `react` | Hooks, state, components, lifecycle |
| `backend` | APIs, services, databases, Node.js |
| `security` | Auth, vulnerabilities, OWASP |
| `devops` | Docker, K8s, CI/CD, infrastructure |
| `general` | Everything else |

## Output Format

After extraction, report:

```markdown
## Learning Extracted

**Problem:** [Brief problem description]
**Solution:** [What worked]
**Saved to:** ~/.claude/skills/learned/[filename].md
**Reusability:** [How this helps future tasks]
```

If nothing extracted:

```markdown
## No Learnings Extracted

**Reason:** [Why nothing qualified]
**Tip:** Run this command after solving non-obvious problems
```

## Examples

```bash
# Extract a specific topic
/extract-learning "the prisma connection pooling fix"

# Review full session for learnings
/extract-learning

# Extract after debugging
/extract-learning "why useEffect was running twice"
```
