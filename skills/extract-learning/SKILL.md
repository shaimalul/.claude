---
name: extract-learning
description: |
  Extract reusable knowledge from the current session and integrate it into the existing skill, rule, or check that owns it. Triggers on:
  (1) /extract-learning command
  (2) "save this as a skill" or "extract what we learned"
  (3) After debugging with a non-obvious solution
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Extract Learning

Turn what this session learned into a durable improvement to the configuration, placed where it will actually change the next run.

Arguments: `$ARGUMENTS` - optional topic to extract (e.g. "the prisma pooling fix"). Without one, review the whole session.

Write every change to the `writing-for-agents` primitive. Route and format through `improve-claude`: its [ROUTING.md](../improve-claude/ROUTING.md) owns which file a topic lands in, and its [FORMATS.md](../improve-claude/FORMATS.md) owns the pattern format. Neither is restated here.

## Quality Gates

A candidate is extracted only when every gate passes:

- [ ] The trigger is specific: an error message, a symptom, a situation someone will hit again
- [ ] The solution was verified to work in this session
- [ ] It is reusable beyond this one fix, and would help someone hitting it in 6 months
- [ ] It is not common knowledge or a documentation lookup (link the docs instead)
- [ ] It contains no secrets, tokens, or personal data

## Process

### Step 1: Identify Candidates

For each candidate, write down the problem, what made it non-obvious, the exact symptom that led there, and what would have found it faster. Drop any candidate that fails a quality gate, with the reason.

### Step 2: Classify Mechanical vs Judgement

- MECHANICAL: a fixed pattern a machine can detect (a banned API, an import shape, a file-location rule, a command that must never run). It becomes a DETERMINISTIC CHECK: a lint rule in the project's linter, a PreToolUse hook in `scripts/hooks/` with its test first, or a CI job, whichever the repo already has the cheapest place for. A prose rule for a mechanical violation is the fallback only when no check can express it
- JUDGEMENT: needs a human-style call (consistency across files, matching surrounding style, domain trade-offs). It becomes prose in the owning skill or rule, and a review-worthy judgement goes to the Standards axis of `review-base`

Also look for the opposite: an existing prose rule in `CLAUDE.md` or `rules/` that a check could now enforce. Propose the check and deleting the prose.

### Step 3: Route

Find the owning file with the Category Detection table in [ROUTING.md](../improve-claude/ROUTING.md), then search it and its neighbours for the concept. An existing pattern gets UPDATED, never duplicated.

### Step 4: Propose And Confirm

Never write before the user approves. Present:

```markdown
## Proposed Learnings

Learning 1: [title]
- Kind: check | prose
- Target: [owning file, section]
- Change: [one-line summary]

Shall I apply these?
```

### Step 5: Apply

After approval, create the lock the config-edit guard checks, then write each change in the target file's existing format:

```bash
echo $(date +%s) > ~/.claude/.config-edit-unlocked
```

A check goes in through `tdd`: its failing test first, then the check. Prose goes into the owning section using the pattern format in [FORMATS.md](../improve-claude/FORMATS.md).

### Step 6: Verify And Report

```bash
npm test
rm -f ~/.claude/.config-edit-unlocked
```

```markdown
## Learning Extracted

Problem: [specific problem]
Solution: [what worked]
Integrated into:
- [file] - [check added | section added or updated]
```

If nothing qualified, report which gate each candidate failed.

## Examples

```bash
/extract-learning "use start/end instead of left/right in prop names"
/extract-learning "why useEffect was running twice"
/extract-learning
```

## Checklist

- [ ] Every extracted item passed all quality gates
- [ ] Mechanical violations became checks, not prose
- [ ] Each learning lives in exactly one owning file
- [ ] The user approved before any write
- [ ] `npm test` passes and the lock file is removed
