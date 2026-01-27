# Improve Claude Configuration

I'll analyze your instruction and add/update it across all relevant Claude Code configuration files, maintaining single source of truth.

Arguments: `$ARGUMENTS` - The rule/standard to add (e.g., "never use 'any' type", "always use http-status-codes package")

## What I Do

When you provide an instruction, I will:

1. **Categorize** - Detect the domain (TypeScript, Frontend, Backend, Security, DevOps, AI, Testing, Styling)
2. **Find Target Files** - Identify which config files should contain this rule
3. **Search for Existing** - Find similar rules to UPDATE (never duplicate)
4. **Auto-Generate Examples** - Create Bad/Good code patterns from your instruction
5. **Apply Changes** - Update files directly, no confirmation needed
6. **Report** - Show exactly what was updated/created

## Configuration Files I Manage

| Location | Purpose | Format |
|----------|---------|--------|
| `~/.claude/CLAUDE.md` | Global standards document (source of truth) | Markdown |
| `~/.claude/rules/*.md` | Personal coding guidelines, security checklists, workflow patterns | Markdown |
| `~/.claude/agents/*.md` | Specialized AI agent personalities with model assignments | Markdown + YAML frontmatter |
| `~/.claude/skills/*/SKILL.md` | Domain-specific pattern libraries | Markdown + YAML frontmatter |
| `~/.claude/skills/learned/*.md` | Auto-extracted knowledge from sessions | Markdown |
| `~/.claude/scripts/hooks/*.js` | Session lifecycle automation hooks | JavaScript |
| `~/.claude/scripts/lib/*.js` | Shared utility functions for scripts | JavaScript |
| `~/.claude/templates/*.md` | Structured templates for iterative tasks | Markdown |
| `~/.claude/commands/*.md` | User-invocable command definitions | Markdown |

### Directory Overview

| Directory | Files | Content |
|-----------|-------|---------|
| `rules/` | 6 files | agents.md, coding-style.md, git-workflow.md, performance.md, security.md, testing.md |
| `agents/` | 10 files | frontend-principal, backend-principal, ai-principal, devops-principal, security-principal, architect-principal, ux-principal, mastermind, bug-finder, gitlab-comment-fixer |
| `skills/` | 30+ folders | Each with SKILL.md containing YAML frontmatter + patterns |
| `scripts/hooks/` | 4 files | session-start.js, session-end.js, suggest-compact.js, evaluate-session.js |
| `scripts/lib/` | 2 files | utils.js, package-manager.js |
| `templates/` | 1 file | iterate-prompt.md |
| `commands/` | 16 files | Various slash command definitions |

## Category Detection

I analyze your instruction keywords to determine the category:

| Category | Keywords | Target Files | Commands Affected |
|----------|----------|--------------|-------------------|
| TypeScript | type, interface, enum, any, unknown, casting, generic | CLAUDE.md, typescript-types skill, rules/coding-style.md | quality-gate.md (Code Standards) |
| Frontend | react, component, hook, useState, jsx, tsx, prop | CLAUDE.md, frontend-principal agent, rules/coding-style.md | quality-gate.md (Code Standards) |
| Backend | express, nestjs, controller, service, repository, api, http | CLAUDE.md, backend-principal agent, rules/coding-style.md | quality-gate.md (Code Standards) |
| Security | auth, jwt, password, injection, xss, csrf, owasp | CLAUDE.md, security-principal agent, rules/security.md | quality-gate.md (Security Review) |
| DevOps | docker, kubernetes, terraform, ci, cd, pipeline | CLAUDE.md, devops-principal agent, rules/performance.md | quality-gate.md (Performance) |
| Architect | architecture, design, pattern, ADR, scalability, system, integration, module | CLAUDE.md, architect-principal agent, architect skill | quality-gate.md (Code Standards) |
| AI/ML | openai, llm, prompt, gpt, embedding | CLAUDE.md, ai-principal agent | quality-gate.md (Code Standards) |
| Testing | test, jest, vitest, mock, spec, coverage | CLAUDE.md, testing-patterns skill, rules/testing.md | quality-gate.md (Test Coverage) |
| Styling | css, scss, style, rtl, color | CLAUDE.md, styling-rtl skill | quality-gate.md (Code Standards) |
| Git/Workflow | git, commit, branch, merge, pr, mr, workflow | CLAUDE.md, rules/git-workflow.md | commit-all.md, mr-description.md |
| Performance | performance, optimization, context, model, cost, compaction | CLAUDE.md, rules/performance.md | quality-gate.md (Performance) |
| Agents | agent, principal, consult, orchestration, delegate | CLAUDE.md, rules/agents.md, mastermind agent | consult.md, plan-task.md |
| Scripts | hook, lifecycle, session, automation, startup | scripts/hooks/*.js, scripts/lib/*.js | N/A (runtime behavior) |
| Templates | template, prompt, iterate, task structure | templates/*.md | iterate-task.md |
| General | (none of above) | CLAUDE.md, all relevant agents | Review all commands |

## Phase 1: Parse & Categorize

First, I'll analyze your instruction:

```
Instruction: $ARGUMENTS
```

**Analysis Steps:**
1. Extract key concepts and keywords from the instruction
2. Match against category keyword lists
3. If ambiguous, ask you to clarify the category
4. If `--category=<name>` flag provided, use that category

**Category Override:**
You can force a category with: `/improve-claude "your rule" --category=backend`

## Phase 2: Resolve Target Files

Based on detected category, I'll identify all files that need updating:

**Target Resolution:**
```
Category: [detected]
Target Files:
- ~/.claude/CLAUDE.md (Section: [determined])
- ~/.claude/rules/[relevant-rule].md (if applicable)
- ~/.claude/agents/[relevant-agent].md (if applicable)
- ~/.claude/skills/[relevant-skill]/SKILL.md (if applicable)
- ~/.claude/scripts/[hooks|lib]/[file].js (if applicable - for automation rules)
- ~/.claude/templates/[template].md (if applicable - for task structure rules)
```

## Phase 3: Search for Existing Rules

I'll search each target file for similar existing rules:

**Search Strategy:**
1. Extract key concepts from your instruction
2. Search each file for rules with >50% concept overlap
3. If found: **UPDATE** the existing rule (single source of truth)
4. If not found: **ADD** new rule in appropriate section

**CRITICAL: Single Source of Truth**
- Never create duplicate rules
- Always update existing rules to improve/expand them
- Merge new instruction with existing guidance

## Phase 3.5: Directory-Specific Routing

Based on category detection, I route rules to specific directories:

### Rules Directory Routing (`~/.claude/rules/`)

| Rule Topic | Target File | Section to Update |
|------------|-------------|-------------------|
| Immutability, naming, exports, file organization | `coding-style.md` | Relevant subsection |
| Test coverage, TDD, mocking, specs | `testing.md` | Relevant subsection |
| Auth, secrets, OWASP, validation | `security.md` | Security checklist |
| Git commits, branches, PRs, workflow | `git-workflow.md` | Workflow section |
| Context window, model selection, compaction | `performance.md` | Optimization section |
| Agent usage, orchestration, principals | `agents.md` | Agent table or usage section |

### Scripts Directory Routing (`~/.claude/scripts/`)

| Script Type | Location | When to Reference |
|-------------|----------|-------------------|
| Session lifecycle | `hooks/session-start.js`, `hooks/session-end.js` | Session automation rules |
| Context management | `hooks/suggest-compact.js` | Performance/context rules |
| Session evaluation | `hooks/evaluate-session.js` | Learning extraction rules |
| Shared utilities | `lib/utils.js`, `lib/package-manager.js` | When adding utility functions |

**Note:** Scripts are JavaScript files. When a rule affects script behavior, document the expected behavior change rather than the code modification.

### Templates Directory Routing (`~/.claude/templates/`)

| Template | Purpose | When to Update |
|----------|---------|----------------|
| `iterate-prompt.md` | Structured task iteration template | When adding task structure guidelines |

### Agent Directory Routing (`~/.claude/agents/`)

| Agent File | Domain | Invocation |
|------------|--------|------------|
| `frontend-principal.md` | React, TypeScript, components | `/consult frontend` |
| `backend-principal.md` | Node.js, NestJS, APIs | `/consult backend` |
| `ai-principal.md` | OpenAI, prompts, RAG | `/consult ai` |
| `devops-principal.md` | Docker, K8s, Terraform | `/consult devops` |
| `security-principal.md` | OWASP, auth, vulnerabilities | `/consult security` |
| `architect-principal.md` | System design, ADRs | `/consult architect` |
| `ux-principal.md` | Accessibility, WCAG, ARIA | `/consult ux` |
| `mastermind.md` | Orchestrator, multi-domain | `/plan-task`, `/build-feature` |
| `bug-finder.md` | Root cause analysis | `/find-bug` |
| `gitlab-comment-fixer.md` | MR comment processing | `/gitlab-fix-comments` |

## Phase 4: Determine Section Placement

**CLAUDE.md Section Mapping:**
| Rule Pattern | Target Section |
|--------------|----------------|
| "never use X" / "always use Y" | ## Code Style |
| "extract X to Y" / "when you see X" | ## Refactoring Patterns |
| Backend patterns | ## Backend Refactoring Patterns |
| Security rules | ## Security Standards |
| DevOps rules | ## DevOps Standards |
| AI/ML rules | ## AI/ML Integration Standards |
| Testing rules | ## Testing Considerations |

**Rules Files Section Mapping:**

| Rules File | Sections Available |
|------------|-------------------|
| `coding-style.md` | Immutability, File Organization, Error Handling, Input Validation, Code Quality Checklist |
| `testing.md` | Minimum Test Coverage, Test-Driven Development, Behavior-Driven Tests, Post-Implementation Verification |
| `security.md` | Mandatory Security Checks, Secret Management, Security Response Protocol, OWASP Top 10 |
| `git-workflow.md` | Commit Message Format, Pull Request Workflow, Feature Implementation Workflow, GitLab Integration |
| `performance.md` | Model Selection Strategy, Context Window Management, Strategic Compaction, Build Troubleshooting |
| `agents.md` | Available Principal Engineers, Immediate Agent Usage, Parallel Task Execution, Multi-Perspective Analysis |

**Agent Files:**
- Find most semantically relevant section
- Default to guidelines/best practices section
- Agents use YAML frontmatter with: name, description, tools, model, skills

**Skill Files:**
- Append to relevant pattern section
- Or add new subsection if needed
- Skills use YAML frontmatter with: name, description, globs

**Script Files (Reference Only):**
- Document expected behavior changes
- Do not modify JavaScript code directly through this command
- Reference script file and describe the behavior to implement

**Template Files:**
- Update structure sections as needed
- Preserve placeholder format (`[brackets]` and `<!-- comments -->`)

## Phase 5: Auto-Generate Code Examples

I'll create Bad/Good code examples from your instruction:

**Example Generation:**
```typescript
// Bad - [what to avoid]
[generated bad example]

// Good - [what to do]
[generated good example]
```

**Generation Rules:**
- Infer the "bad" pattern from "never use X" or "avoid X"
- Infer the "good" pattern from "always use Y" or "prefer Y"
- Use realistic, contextual examples
- Match the complexity level of existing examples in the file

## Phase 6: Apply Changes

I'll update each target file directly:

**For New Rules:**
```markdown
### [Rule Title]

[Description of the rule]

```typescript
// Bad
[bad example]

// Good
[good example]
```
```

**For Existing Rules (Update):**
- Merge new guidance with existing rule
- Expand examples if needed
- Preserve existing formatting

## Phase 6.5: Review and Update Commands

After updating the core configuration files, I'll review command files for related content:

**Command Review Strategy:**
1. Search all `/commands/*.md` files for keywords from the instruction
2. Check if any command has embedded rules, checklists, or examples that should include the new standard
3. Update affected commands to maintain consistency

**Key Commands to Check:**

| Command | What to Update |
|---------|----------------|
| `quality-gate.md` | Add new check to relevant section (Code Standards, Security, etc.) |
| `refactor.md` | Add new refactoring pattern if applicable |
| `review.md` | Add new review criterion if applicable |
| `iterate-task.md` | Add new iteration guideline if applicable |
| `commit-all.md` | Add new commit convention if applicable |

**Update Logic:**
- **Code Style rule** → Add to quality-gate.md "Code Standards" checklist
- **Security rule** → Add to quality-gate.md "Security Review" checklist
- **Refactoring pattern** → Consider adding to refactor.md patterns
- **Testing rule** → Add to quality-gate.md "Test Coverage" checklist

**Example Update:**
If instruction is "never use console.log in production":
- Add `- [ ] No console.log in production code` to quality-gate.md's Code Standards section

## Phase 7: Save to Learned Skills (Pattern Extraction)

When processing rules from code reviews or session learning, I also save patterns as reusable skills in `~/.claude/skills/learned/`.

**This happens automatically when:**
- Rule comes from a review (`/review`, `/gitlab-review`)
- Pattern is marked as [Blocker], [Nice to have], or [Suggestion]
- `--save-skill` flag is used

**Skill File Creation:**

1. **Filename:** `[category]-[short-description].md` (kebab-case)
   - Example: `typescript-avoid-any-type.md`
   - Example: `react-missing-useeffect-deps.md`

2. **Location:** `~/.claude/skills/learned/`

3. **Format:**
```markdown
# [Descriptive Pattern Name]

**Extracted:** [YYYY-MM-DD]
**Source:** [/improve-claude | /review | /gitlab-review]
**Type:** [rule|blocker|nice-to-have|suggestion]
**Category:** [typescript-types|react-component|backend-patterns|security-patterns|general]

## Problem
[What issue this pattern addresses - be specific]

## Solution
[The fix or best practice to apply]

## Example
```typescript
// Bad
[problematic code pattern]

// Good
[correct code pattern]
```

## When to Use
[Trigger conditions - when this skill should activate]
```

**Automatic Loading:**
The `session-start.js` hook notifies Claude of available learned skills at the start of each session.

## Phase 8: Report Results

After applying changes, I'll show:

```
## /improve-claude Report

**Instruction:** [your instruction]
**Category:** [detected category]

### Files Updated

| File | Action | Section |
|------|--------|---------|
| CLAUDE.md | Updated | Code Style |
| rules/coding-style.md | Updated | Immutability |
| rules/testing.md | Added | New subsection |
| frontend-principal.md | Added | Guidelines |
| react-component/SKILL.md | Added | Patterns |
| quality-gate.md | Added | Code Standards Checklist |

### Scripts Referenced (if applicable)

| Script | Behavior Change |
|--------|-----------------|
| hooks/session-start.js | [Description of expected change] |

### Templates Updated (if applicable)

| Template | Section |
|----------|---------|
| iterate-prompt.md | [Section name] |

### Skills Saved

| Skill File | Type | Category |
|------------|------|----------|
| typescript-avoid-any.md | rule | typescript-types |

### Changes Applied

**CLAUDE.md:**
- Updated existing rule about [topic]
- Added code example for [scenario]

**rules/coding-style.md:**
- Added new subsection: [title]

**frontend-principal.md:**
- Added new section: [title]

**quality-gate.md:**
- Added new check: "[check description]"

**skills/learned/:**
- Created: typescript-avoid-any.md

### Verification
- [x] Rule synced across all target files
- [x] No duplicates created
- [x] Code examples generated
- [x] Commands reviewed for related content
- [x] Quality gate checklist updated (if applicable)
- [x] Rules files updated (if applicable)
- [x] Scripts referenced (if applicable)
- [x] Templates updated (if applicable)
- [x] Learned skill saved (if applicable)
```

## File Format Reference

### Rules Files (`~/.claude/rules/*.md`)

```markdown
# Rule Category Title

## Subsection

Description and guidelines...

\`\`\`typescript
// Bad
[example]

// Good
[example]
\`\`\`

## Checklist

- [ ] Check item 1
- [ ] Check item 2
```

### Agent Files (`~/.claude/agents/*.md`)

```markdown
---
name: agent-name
description: When to use this agent
tools: Read, Grep, Glob, Bash, Edit, Write
model: opus|sonnet|haiku
skills: skill1, skill2
---

# Agent Content

Guidelines and patterns...
```

### Skill Files (`~/.claude/skills/*/SKILL.md`)

```markdown
---
name: skill-name
description: What this skill provides
globs: "**/*.ts,**/*.tsx"
---

# Skill Content

Patterns and examples...
```

### Template Files (`~/.claude/templates/*.md`)

```markdown
# Task: [Placeholder Title]

## Context
[Description with placeholders]

## Requirements
- [ ] Requirement 1
```

### Hook Scripts (`~/.claude/scripts/hooks/*.js`)

```javascript
#!/usr/bin/env node
/**
 * Hook Description
 */

const { utilFunction } = require('../lib/utils');

async function main() {
  // Hook logic
  process.exit(0);
}

main().catch(err => {
  console.error('[HookName] Error:', err.message);
  process.exit(0); // Don't block on errors
});
```

### Library Scripts (`~/.claude/scripts/lib/*.js`)

```javascript
/**
 * Utility function description
 */
function utilityFunction(param) {
  // Implementation
}

module.exports = { utilityFunction };
```

## Usage Examples

```bash
# TypeScript rule
/improve-claude "never use 'any' type - use proper typing or type guards"

# HTTP status codes (backend)
/improve-claude "always use http-status-codes package instead of raw numbers like res.status(500)"

# React rule
/improve-claude "never pass setState directly to child components - use callback handlers with semantic names"

# Force specific category
/improve-claude "validate all inputs" --category=backend

# Security rule
/improve-claude "always sanitize user input before database queries to prevent SQL injection"
```

## Safety Guarantees

I will NEVER:
- Create duplicate rules across files
- Remove existing rules without merging
- Break file formatting
- Modify files outside ~/.claude configuration
- Add AI attribution or signatures

## Important Notes

1. **CLAUDE.md is source of truth** - It always gets updated for code standards
2. **Rules files get specific guidelines** - Categorized enforcement rules (coding-style, testing, security, etc.)
3. **Agents get specialized context** - Additional guidance specific to their domain
4. **Skills get pattern examples** - Focus on code patterns and examples
5. **Scripts are reference-only** - Document behavior changes, don't modify JS directly
6. **Templates preserve structure** - Keep placeholders and comment format intact
7. **Commands get workflow rules** - Rules that affect command behavior

### Directory Quick Reference

| Need to add... | Update... |
|----------------|-----------|
| Coding style rule | `rules/coding-style.md` + `CLAUDE.md` |
| Testing requirement | `rules/testing.md` + `CLAUDE.md` |
| Security checklist item | `rules/security.md` + `CLAUDE.md` |
| Git workflow step | `rules/git-workflow.md` + `CLAUDE.md` |
| Performance guideline | `rules/performance.md` + `CLAUDE.md` |
| Agent usage pattern | `rules/agents.md` + relevant agent file |
| React pattern | `frontend-principal.md` + `react-component` skill |
| Backend pattern | `backend-principal.md` + `backend-patterns` skill |
| Quality check | `quality-gate.md` checklist |
| Session automation | Reference `scripts/hooks/` + document behavior |
| Task structure | `templates/iterate-prompt.md` |

**Ready to improve your Claude configuration!**
