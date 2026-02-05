---
description: Review Technical Designs (TDs) for Common-UI design system changes
argument-hint: <notion-td-url>
allowed-tools: Bash, Task, TodoWrite, Read, Grep, Glob
---

# Common-UI Technical Design Review

Review a Technical Design (TD) for the Common-UI design system before implementation. This command acts as a Principal Frontend Architect reviewing cross-company design system changes.

## What This Command Does

1. Fetches the TD from Notion using the provided URL
2. Understands the context by examining the Common-UI repo
3. Searches for existing usage across GitLab to detect breaking changes
4. Reviews the TD against quality, accessibility, and design system standards
5. Generates a detailed report with findings and recommendations

## Prerequisites

1. Notion Token: Stored in `~/.claude/.secrets` as `NOTION_TOKEN`
2. GitLab Token: Stored in `~/.claude/.secrets` as `GITLAB_TOKEN`
3. Common-UI Repo: Available at `/Users/shaimalul/Documents/Dev/common-ui`

## Usage

```bash
/cui-td-review https://www.notion.so/ZCDComponentName-abc123...
```

## Review Process

I'll analyze the TD using the following workflow.

### Step 1: Fetch and Parse TD

Use the mcp__notion__notion-fetch tool to retrieve the TD content:

```
Tool: mcp__notion__notion-fetch
Parameters: { "id": "$ARGUMENTS" }
```

The TD should contain these sections:
- Component Overview - What and why
- Rationale - Problem being solved
- Design - Figma links, visual changes
- Implementation Details - Requirements, dependencies, code examples
- Testing - Unit test scenarios
- Storybook - Stories configuration
- Accessibility - A11y requirements

### Step 2: Understand Common-UI Context

Read the relevant component files from the Common-UI repo:

```bash
# Check if component exists
ls -la /Users/shaimalul/Documents/Dev/common-ui/src/ZCD/ | grep -i "<ComponentName>"

# If exists, read the current implementation
cat /Users/shaimalul/Documents/Dev/common-ui/src/ZCD/<ComponentName>/<ComponentName>.tsx
```

Also examine:
- Similar components for pattern consistency
- Base components if applicable (BaseButton, BaseInput, etc.)
- Existing type definitions

### Step 3: Search for Cross-Company Usage

Search GitLab for existing usage to assess breaking change impact:

```bash
# Source secrets
source ~/.claude/.secrets

# Search for component usage across all Zencity repos
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/groups/5884472/search?scope=blobs&search=<ComponentName>" \
  | jq '.[] | {file: .filename, project: .project_id, path: .path}'
```

Key patterns to search for:
- Direct component imports: `import { ZCDComponentName }`
- Props that might change: `<ZCDComponentName propName=`
- Style overrides: `.zcd-component-name`

### Step 4: Invoke TD Reviewer Agent

Use the Task tool to invoke the specialized TD reviewer agent:

```
subagent_type: cui-td-reviewer
prompt: |
  Review this Common-UI Technical Design:

  TD Content:
  [Fetched TD content]

  Current Component (if exists):
  [Current implementation]

  Cross-Company Usage:
  - Found in X repositories
  - Usage patterns: [list]

  Review Focus:
  1. Check all TD sections against the review checklist
  2. Identify breaking changes
  3. Verify design system alignment
  4. Assess accessibility requirements
  5. Review testing coverage

  Generate a detailed review report with findings using the standard prefixes:
  [BLOCKER], [BREAKING], [REQUIRED], [RECOMMENDED], [SUGGESTION], [QUESTION]
```

### Step 5: Generate Ready-to-Paste Comments

The output includes TWO parts:

1. Summary Table - Quick overview (verdict, issue counts)
2. Ready-to-Paste Comments - Individual comments by TD section, written like a colleague would write them

#### Part 1: Summary Table

```
Summary:

| Item | Value |
|------|-------|
| Verdict | NEEDS REVISION |
| Blockers | 2 |
| Required | 4 |
| Suggestions | 3 |

Good additive changes overall, but accessibility section is empty and the padding/standardBodyPadding interaction is unclear.
```

#### Part 2: Ready-to-Paste Comments by Section

Each comment is written in a natural, human tone and can be pasted directly into Notion.

Format for each comment:

```
---
### Section: [TD Section Name]

Copy this comment:

[Severity] [Issue title]

[Natural, conversational explanation - written like a colleague would write it]

[Optional: specific suggestions, questions, or examples]

---
```

Severity tags (no emojis):
- `[Blocker]` - Must fix before approval
- `[Breaking]` - Introduces breaking change
- `[Required]` - Must address
- `[Suggestion]` - Nice to have improvement
- `[Question]` - Needs clarification

Example output:

```
Summary:

| Item | Value |
|------|-------|
| Verdict | NEEDS REVISION |
| Blockers | 2 |
| Required | 4 |

Good additive changes overall, but accessibility section is empty and the padding/standardBodyPadding interaction is unclear.

---

Ready-to-Paste Comments

---
### Section: Accessibility

Copy this comment:

[Blocker] This section needs to be filled out

I noticed this section is empty. Since we're adding interactive, loading, and disabled states, we need to define the accessibility behavior.

For interactive cards, we need to decide on the ARIA role (role="button" or article?), whether they should be focusable with tabIndex={0}, and what keyboard shortcuts activate them.

For disabled state, use aria-disabled="true" and remove from tab order with tabIndex={-1}.

For loading state, use aria-busy="true" and consider aria-live="polite" for announcements.

Could you add specs for these?

---
### Section: Design

Copy this comment:

[Blocker] Missing Figma link

Hey, I don't see a Figma link. We need visual specs for the new states - hover, active, focus ring, disabled treatment, and loading appearance. Can you add it?

---
### Section: Implementation Details - Props

Copy this comment:

[Required] How does padding interact with standardBodyPadding?

Quick question - the TD adds a new `padding` prop but we already have `standardBodyPadding`. How do they work together?

A few things to clarify: What happens if both are set? Should we deprecate standardBodyPadding? Maybe padding="none" could replace standardBodyPadding={false}?

---
### Section: Implementation Details - States

Copy this comment:

[Required] Define combined state behavior

What happens when multiple states are active? For example, with interactive + disabled I assume disabled wins and we skip hover styles? With interactive + loading, loading probably takes over? And loading + disabled - do both apply?

Could you add a quick table showing the expected behavior?

---
### Section: Testing

Copy this comment:

[Suggestion] Add combined state tests

The test list looks good for individual props. Consider also testing interactive + disabled together, interactive with onClick handler, loading content replacement, and the aria-disabled and aria-busy attributes.

---
### Section: borderLeft prop

Copy this comment:

[Suggestion] Consider RTL support

For RTL languages, border-left becomes border-right. Consider using border-inline-start instead, or document that borderLeft actually uses the logical property internally.

---
```

## Review Categories

### API Design
- Props naming follows conventions (camelCase, descriptive)
- TypeScript types are complete and use discriminated unions
- Backward compatibility maintained

### Breaking Changes
- Props not renamed without deprecation
- Default values not changed unexpectedly
- Migration path provided for breaking changes

### Design System Alignment
- Uses ZCD color tokens (`$zcd-blue-20`, etc.)
- Uses CSS logical properties (`padding-inline-start`)
- Uses CSS Modules (`.module.scss`)
- Follows existing patterns

### Testing
- Unit tests cover all variants
- Edge cases identified
- Accessibility tests included

### Accessibility
- ARIA labels defined
- Keyboard navigation specified
- Focus management addressed
- Color contrast considered

## Example Output

```
Summary:

| Item | Value |
|------|-------|
| Verdict | APPROVED WITH CHANGES |
| Blockers | 0 |
| Required | 2 |
| Suggestions | 1 |

Good TD overall - comprehensive examples and clear API design. Just need to add ARIA specs and use color tokens for postIconColor.

---

Ready-to-Paste Comments

---
### Section: Accessibility

Copy this comment:

[Required] Add ARIA specs for hierarchical mode

I noticed the hierarchical mode changes how selection works, but we don't have ARIA specs for it. Could you add role="tree" for the container, role="treeitem" for each option, aria-expanded for parent items, and arrow key navigation (up/down for siblings, right to expand, left to collapse)?

---
### Section: Type Definitions

Copy this comment:

[Required] Use color tokens for postIconColor

Right now postIconColor is typed as string, which means any color value works. We should restrict it to ZCD color tokens to keep things consistent:

postIconColor?: ZCDColorToken

This way consumers can't accidentally use hex values or other non-system colors.

---
### Section: Keyboard Navigation

Copy this comment:

[Suggestion] Document keyboard shortcuts for hierarchy

This would be helpful to add - how should arrow keys work for navigating the hierarchy? I'd suggest Up/Down to move between siblings, Right to expand parent or enter children, and Left to collapse or go to parent.

---
```

## Related Commands

- `/review` - Review code changes in current branch
- `/gitlab-review` - Review GitLab MR
- `/consult frontend` - Get frontend architecture guidance
