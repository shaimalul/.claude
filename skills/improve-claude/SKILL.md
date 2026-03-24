---
name: improve-claude
description: Improve Claude configuration by adding rules, standards, and patterns across all config files maintaining single source of truth
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Improve Claude Configuration

Analyze instructions and add/update them across all relevant Claude Code configuration files, maintaining single source of truth.

Arguments: `$ARGUMENTS` - The rule/standard to add (e.g., "never use 'any' type", "always use http-status-codes package")

## What I Do

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
| `~/.claude/rules/*.md` | Personal coding guidelines, security, workflow | Markdown |
| `~/.claude/agents/*.md` | Specialized AI agent personalities | Markdown + YAML frontmatter |
| `~/.claude/skills/*/SKILL.md` | Domain-specific pattern libraries | Markdown + YAML frontmatter |
| `~/.claude/scripts/hooks/*.js` | Session lifecycle automation hooks | JavaScript |
| `~/.claude/scripts/lib/*.js` | Shared utility functions for scripts | JavaScript |
| `~/.claude/templates/*.md` | Structured templates for iterative tasks | Markdown |

## Category Detection

| Category | Keywords | Target Files |
|----------|----------|--------------|
| TypeScript | type, interface, enum, any, unknown, casting | CLAUDE.md, typescript-types skill, rules/coding-style.md |
| Frontend | react, component, hook, useState, jsx, tsx | CLAUDE.md, frontend-principal agent, rules/coding-style.md |
| Backend | express, nestjs, controller, service, api, http | CLAUDE.md, backend-principal agent, rules/coding-style.md |
| Security | auth, jwt, password, injection, xss, csrf | CLAUDE.md, security-principal agent, rules/security.md |
| DevOps | docker, kubernetes, terraform, ci, cd | CLAUDE.md, devops-principal agent, rules/performance.md |
| Testing | test, jest, vitest, mock, spec, coverage | CLAUDE.md, testing-patterns skill, rules/testing.md |
| Styling | css, scss, style, rtl, color | CLAUDE.md, styling-rtl skill |
| Git/Workflow | git, commit, branch, merge, pr, mr | CLAUDE.md, rules/git-workflow.md |

## Process

### Phase 1: Parse & Categorize
Extract key concepts, match against category keywords.

### Phase 2: Resolve Target Files
Identify all files that need updating based on category.

### Phase 3: Search for Existing Rules
Search each target file for similar rules (>50% concept overlap). UPDATE existing, don't duplicate.

### Phase 4: Apply Changes
Update each target file directly with proper formatting and code examples.

### Phase 5: Review Related Skills
Check if any skill files have embedded rules that should include the new standard.

### Phase 6: Report Results

```
## /improve-claude Report

**Instruction:** [your instruction]
**Category:** [detected category]

### Files Updated
| File | Action | Section |
|------|--------|---------|

### Changes Applied
[Details per file]

### Verification
- [x] Rule synced across all target files
- [x] No duplicates created
- [x] Code examples generated
```

## Safety Guarantees

- Never create duplicate rules across files
- Never remove existing rules without merging
- Never break file formatting
- Never modify files outside ~/.claude configuration
