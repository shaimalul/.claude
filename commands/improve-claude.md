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

| Location | Purpose |
|----------|---------|
| `~/.claude/CLAUDE.md` | Global standards document (source of truth) |
| `~/.claude/agents/*.md` | Specialized AI agent personalities |
| `~/.claude/skills/*/SKILL.md` | Reusable pattern libraries |
| `~/.claude/rules/*.mdc` | Enforcement guidelines |

## Category Detection

I analyze your instruction keywords to determine the category:

| Category | Keywords | Target Files |
|----------|----------|--------------|
| TypeScript | type, interface, enum, any, unknown, casting, generic | CLAUDE.md, typescript-types skill, zc-typescript-conventions.mdc |
| Frontend | react, component, hook, useState, jsx, tsx, prop | CLAUDE.md, frontend-conventions agent, react-component skill |
| Backend | express, nestjs, controller, service, repository, api, http | CLAUDE.md, backend-principal agent, backend-patterns skill |
| Security | auth, jwt, password, injection, xss, csrf, owasp | CLAUDE.md, security-principal agent, security-patterns skill |
| DevOps | docker, kubernetes, terraform, ci, cd, pipeline | CLAUDE.md, devops-principal agent, relevant skills |
| AI/ML | openai, llm, prompt, gpt, embedding | CLAUDE.md, ai-principal agent, openai-integration skill |
| Testing | test, jest, vitest, mock, spec | CLAUDE.md, testing-patterns skill |
| Styling | css, scss, style, rtl, color | CLAUDE.md, styling-rtl skill |
| General | (none of above) | CLAUDE.md, all relevant agents |

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
- ~/.claude/agents/[relevant-agent].md (if applicable)
- ~/.claude/skills/[relevant-skill]/SKILL.md (if applicable)
- ~/.claude/rules/[relevant-rule].mdc (if applicable)
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

**Agent Files:**
- Find most semantically relevant section
- Default to guidelines/best practices section

**Skill Files:**
- Append to relevant pattern section
- Or add new subsection if needed

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

## Phase 7: Report Results

After applying changes, I'll show:

```
## /improve-claude Report

**Instruction:** [your instruction]
**Category:** [detected category]

### Files Updated

| File | Action | Section |
|------|--------|---------|
| CLAUDE.md | Updated | Code Style |
| frontend-conventions.md | Added | Guidelines |
| react-component/SKILL.md | Added | Patterns |

### Changes Applied

**CLAUDE.md:**
- Updated existing rule about [topic]
- Added code example for [scenario]

**frontend-conventions.md:**
- Added new section: [title]

### Verification
- [x] Rule synced across all target files
- [x] No duplicates created
- [x] Code examples generated
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
2. **Agents get specialized context** - Additional guidance specific to their domain
3. **Skills get pattern examples** - Focus on code patterns and examples
4. **Rules get enforcement** - Focus on what to check and enforce

**Ready to improve your Claude configuration!**
