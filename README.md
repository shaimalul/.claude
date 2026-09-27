# Claude Code Config

A personal Claude Code configuration. Provides 49 skills (20 user-invocable), 11 specialist agents, 8 rule files, and automated hooks for daily development workflows.

---

## Getting Started

### Prerequisites

- Claude Code CLI installed (macOS, Linux, WSL: `curl -fsSL https://claude.ai/install.sh | bash`)
- Node.js 18+ (for hook scripts)
- GitHub account, with the `gh` CLI installed and authenticated

### Installation

Pick the scenario that matches your setup:

#### A) `~/.claude` does not exist (never used Claude Code)

```bash
git clone <your-repo-url> ~/.claude
```

#### B) `~/.claude` exists without git (used Claude Code before)

```bash
cd ~/.claude
git init
git remote add origin <your-repo-url>
git fetch origin
git checkout -t origin/main -f
```

#### C) `~/.claude` exists with git (previous install attempt)

```bash
cd ~/.claude
git remote set-url origin <your-repo-url>
git fetch origin
git checkout -t origin/main -f
```

> The `-f` flag is safe - all Claude Code runtime files are in `.gitignore` so your personal settings, cache, and history are preserved.

#### Then run setup (all scenarios)

```bash
# 1. Run the setup script (generates settings.json)
bash ~/.claude/scripts/setup.sh

# 2. Run `gh auth login` (stores a GitHub token in your OS keychain)

# 3. Verify
cd ~/your-project && claude
```

The setup script generates `settings.json` from `settings.template.json`, replacing path placeholders with your home directory. Both `settings.json` and `settings.local.json` are gitignored so your personal settings never conflict with the repo.

### GitHub Access

No token file is needed. `/review`, `/resolve-pr`, `/pr-description`, `/split-changes`, and `/wayfinder` all go through the `gh` CLI, which uses the token `gh auth login` stores in your OS keychain. Grant it the `repo` scope. Never put a token in a file in this repo or pass one as a command-line argument.

---

## Personal Customization (p- prefix)

Most files in this repo are tracked in git. To add personal skills, agents, or rules that stay out of version control, use the `p-` prefix - these are gitignored:

```
skills/review/SKILL.md       <- Company (tracked in git)
skills/p-my-patterns/        <- Personal (gitignored)

agents/mastermind-agent.md         <- Company (tracked in git)
agents/p-my-agent.md         <- Personal (gitignored)

rules/coding-style.md        <- Company (tracked in git)
rules/p-my-rules.md          <- Personal (gitignored)
```

---

## Contributing - The `/improve-claude` Rule

### Never Edit Config Files Directly

This is the single most important rule for contributors. All configuration files in this repo are interconnected - a single rule might live in `CLAUDE.md`, a rule file, an agent file, and a skill file simultaneously. Editing one file directly creates drift and broken sync across the system.

**Protected files (NEVER edit directly):**
- `CLAUDE.md` - global code standards
- `rules/*.md` - coding style, testing, security, git workflow, model selection, performance
- `agents/*.md` - specialist agent definitions
- `skills/*/SKILL.md` - skill and pattern library definitions

**Always use `/improve-claude` instead:**

```bash
# Adding a new coding standard
/improve-claude "never use console.log in production - use a structured logger"

# Adding a security rule
/improve-claude "always sanitize user input before database queries"

# Adding a testing convention
/improve-claude "mock external services at the service boundary, not inside components"
```

### Why `/improve-claude` Exists

Without it, adding a rule like "always use http-status-codes" would require you to manually find and update every relevant file - `CLAUDE.md`, `rules/coding-style.md`, `backend-agent.md`, `js-backend-patterns` skill, `quality-gate` skill checklist, and possibly more. Miss one, and Claude gets inconsistent guidance depending on which file it reads.

`/improve-claude` solves this by:

1. **Auto-categorizing** your instruction (frontend, backend, security, testing, etc.)
2. **Resolving all target files** that need the rule - not just one, but every file where it belongs
3. **Searching for duplicates** before adding anything, so you never get conflicting rules
4. **Deciding the right split** between skills, agents, and rules - it knows whether a pattern belongs in a skill file (code examples), an agent file (domain expertise), or a rule file (enforcement checklist)
5. **Generating code examples** (Bad/Good patterns) automatically from your plain-English instruction
6. **Updating dependent skills** like `quality-gate` checklists that reference the rule

### When to Use `/improve-claude`

| Scenario                                      | Action                                             |
| --------------------------------------------- | -------------------------------------------------- |
| New coding standard or convention             | `/improve-claude "your rule"`                      |
| Learning from a code review                   | `/improve-claude "pattern we discovered"`          |
| Adding a security checklist item              | `/improve-claude "security requirement"`           |
| New testing convention                        | `/improve-claude "testing pattern"`                |
| Updating agent behavior                       | `/improve-claude "agent should do X"`              |
| Adding a quality gate check                   | `/improve-claude "check for X in reviews"`         |
| Fixing a typo in one file                     | Edit directly (single-file typo fixes are allowed) |
| Editing `p-*` personal files                  | Edit directly (personal files are yours)           |
| Editing `scripts/`, `README.md`, `.gitignore` | Edit directly (code/infra/docs are not config)     |

### What Happens If You Edit Directly

Claude is configured with a `config-edit-guard` hook that will **stop you and ask** if you try to edit a protected file without going through `/improve-claude`. This is intentional - it prevents accidental sync breakage.

If you see this warning, stop and use `/improve-claude` instead. The only exception is single-file typo or formatting-only fixes.

---

## Permission Modes

The default permission mode is `acceptEdits` - Claude can edit files but prompts for Bash commands and other potentially dangerous tools.

To use bypass mode (no prompts), create a personal override:

```bash
# Create your personal settings.local.json (not tracked in git)
# Edit ~/.claude/settings.local.json and change:
"defaultMode": "bypassPermissions"
```

Note: The git-guardrails hook still blocks dangerous git commands regardless of permission mode.

---

## System Overview

The setup follows a three-tier architecture where Skills orchestrate Agents, which load pattern libraries.

```
CLAUDE.md (Code Standards)
    |
    v
SKILLS (55) -------> AGENTS (11) -------> PATTERN LIBRARIES (29)
/review              mastermind-agent      react-component
/plan-task           frontend-agent        js-backend-patterns
/plan-to-docs        backend-agent         security-patterns
/find-bug            bug-finder-agent      testing-patterns
...                  ...                   ...
    |                                          |
    +-- Extends --> BASES (2)                  |
    |               review-base, plan-base     |
    +-- cites -----> PRIMITIVES (4) <----------+
                    grilling, domain-modeling,
                    codebase-design, tdd
    |
    v
LEARNING LOOP (Auto-improvement)
Reviews -> Learn -> Update configs
```

### How It Works

1. User invokes a skill (e.g., `/review`)
2. Skill spawns relevant agents (e.g., security-agent, frontend-agent)
3. Agents load pattern libraries (e.g., react-component, security-patterns)
4. Agents analyze code using skill patterns
5. Results aggregated and returned to user
6. Learning loop extracts patterns to improve configuration

### Skills vs. Agents

These are two distinct mechanisms, not variations of the same thing:

- **Invoking a skill** (`Skill` tool, or typing `/<skill-name>`) loads the SKILL.md body as plain text
  into the *current* conversation - no new context, no new model. When a skill like `/review`
  appears to "spin up specialist agents," that's not the skill mechanism forking; it's prose
  inside the skill body instructing Claude to call the `Agent`/`Task` tool per specialist.
- **Spawning an agent** (`Agent`/`Task` tool with a `subagent_type`) starts a genuinely separate
  process: its own model tier, its own tool allowlist, its own conversation history, and skills
  preloaded from its frontmatter. It reports back a summary; intermediate tool calls aren't
  visible. `CLAUDE.md` loads into every spawned agent unconditionally, regardless of its
  frontmatter `skills:` list - that list only adds domain skills on top of the shared floor.

Two frontmatter switches control skill visibility:

| Frontmatter | Effect |
| --- | --- |
| `disable-model-invocation: true` | Only a human-typed `/<skill-name>` can invoke it - the `Skill` tool itself refuses the call. Used by skills with real side effects (`commit-all`, `plan-task`, `refactor`, etc.) |
| `user-invocable: false` | Hidden from the `/` menu, but Claude can still load it via the `Skill` tool. Used by pure pattern-library skills meant to be loaded silently when relevant. |

### Hooks

Hooks are real child processes Claude Code spawns around tool calls and turn boundaries -
independent of what Claude decides to do, not a prompt it might or might not follow:

```
Your turn:  message -> [PreToolUse per tool call] -> tool runs -> [PostToolUse]
                                                                        |
Turn ends:  [Stop - can block and force continuation] ------------------
Session:    [SessionStart on open] ... [SessionEnd on close]
```

The learning loop runs on the `Stop` hook: `evaluate-session.js` scores the turn's transcript
and recommends `/extract-learning` when a threshold is hit. That skill writes
`~/.claude/.config-edit-unlocked`, which lets `config-edit-guard.js` permit one window of
writes to protected files before the lock is removed.

---

## Skills Reference

### User-Invocable Skills

These are slash commands developers invoke manually via the `/` menu. Type `/` in Claude Code to see them.

23 user-invocable skills.

| Skill                            | Description                                         | Spawns Agents                                                           |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **Code Review**                  |                                                     |                                                                         |
| `/review [pr-url]`               | Two-axis review of the diff: Standards and Spec     | security, architect, bug-finder, frontend, backend, ux, devops, ai (based on files) + a Spec sub-agent |
| `/review-test [path]`            | Audit tests for anti-patterns and Library Swap failures | None                                                                |
| `/fix-review [report]`           | Fix every finding in a review report, test-first    | None                                                                    |
| `/resolve-pr <url>`              | Analyze PR review threads, plan responses, fix code | pr-resolver-agent                                                       |
| **Planning & Development**       |                                                     |                                                                         |
| `/plan-task [description]`       | Plan a task: domain docs, agents, grill, seams      | mastermind-agent                                                        |
| `/wayfinder [idea \| map]`       | Chart a foggy multi-session effort as a map of decision tickets, then resolve one per session | research subagents (worktree-isolated) |
| `/plan-to-docs [description]`    | Plan as vertical-slice phase docs in `ai_plans/`    | mastermind-agent                                                        |
| `/research [question]`           | Read primary sources in a background agent, write cited findings | general-purpose (background)                                   |
| `/prototype [question]`          | Throwaway logic demo or UI variants to answer one design question | None                                                          |
| `/implement-phase <phase.md>`    | Build one phase test-first, cascade to later phases | mastermind-agent -> specialists                                         |
| `/plan-test [path]`              | Design edge cases and failure modes before testing  | None                                                                    |
| `/build-feature`                 | Execute planned feature                             | mastermind-agent -> specialists                                         |
| `/refactor`                      | Intelligent refactoring engine                      | frontend/backend agents                                                 |
| **Quality & Analysis**           |                                                     |                                                                         |
| `/quality-gate`                  | Run comprehensive quality checks                    | security, architect                                                     |
| `/find-bug [context]`            | Build a red-capable loop, then diagnose to root cause | bug-finder-agent                                                      |
| **Git & Commits**                |                                                     |                                                                         |
| `/commit-all`                    | Group commits by Conventional Commits               | None                                                                    |
| `/pr-description`                | Generate PR description from changes                | None                                                                    |
| `/split-changes [--push] [--pr]` | Split branch into domain-focused branches           | None                                                                    |
| `/merge-branches <branches...>`  | Merge reviewed domain branches                      | None                                                                    |
| **Consultation**                 |                                                     |                                                                         |
| `/consult [domain]`              | Consult specific specialist agent                   | Specified agent                                                         |
| **Utilities**                    |                                                     |                                                                         |
| `/improve-claude [rule]`         | Update Claude configuration                         | None                                                                    |
| `/extract-learning [topic]`      | Extract session knowledge as reusable skill         | None                                                                    |
| `/remove-comments`               | Remove obvious comments                             | None                                                                    |

---

## Specialist Agents

### 11 Specialist Agents

| Agent             | Expertise                                          | Color  |
| ----------------- | --------------------------------------------------- | ------ |
| mastermind-agent  | Orchestrator - delegates to specialists            | purple |
| frontend-agent    | React, TypeScript, hooks, state, components        | blue   |
| backend-agent     | Node.js, NestJS, Express, APIs, databases          | green  |
| security-agent    | OWASP Top 10, auth, vulnerabilities, secrets       | red    |
| architect-agent   | System design, ADRs, scalability, integration      | purple |
| devops-agent      | Docker, Terraform, CI/CD, infrastructure           | orange |
| ai-agent          | LLM integration, prompts, RAG, embeddings, streaming | cyan   |
| ux-agent          | Accessibility, WCAG 2.1, ARIA, interactions        | pink   |
| product-agent     | Product strategy, prioritization, metrics, PRDs    | cyan   |
| bug-finder-agent  | Feedback-loop construction, root cause analysis    | yellow |
| pr-resolver-agent | Analyze PR discussions, plan and execute responses | orange |

Colors distinguish agents when several run in parallel (e.g. `/review` spawning up to 6-8 at once). `architect-agent` and `mastermind-agent` share purple, and `ai-agent`/`product-agent` share cyan, and `devops-agent`/`pr-resolver-agent` share orange, since none of those pairs co-spawn with each other in the same review.

Auto-loaded skills are deliberately NOT listed here. Each agent's `skills:` frontmatter is the single source of truth; a copy in this README would drift. To see what any agent loads:

```bash
grep -Hn '^skills:' agents/*.md
```

---

## Pattern Libraries

### Auto-Loaded Pattern Libraries (Do Not Invoke)

These skills are NOT developer commands. Claude loads them automatically when relevant context is detected (e.g., writing React code triggers `react-component`). They don't appear in the `/` menu (`user-invocable: false`). 29 in total, of which `improve-claude` is the one exception that is also user-invocable.

**Frontend (9):** react-component, refactoring-patterns, useeffect-patterns, styling-rtl, storybook-story, design-system-patterns, typescript-types, testing-patterns, no-comments

**Backend (3):** js-backend-patterns, api-design, database-patterns

**DevOps (5):** docker-patterns, terraform-patterns, cicd-patterns, aws-eks-patterns, bash-patterns

**Security (1):** security-patterns

**Architecture (2):** architect, npm-package-patterns

**Design (2):** accessibility-patterns, interaction-design

**Workflow (2):** migration-patterns, no-comments

### Bases and Primitives

A **base** owns the shared content of a skill family; consumers declare `Extends: <base>` and carry only overrides. A **primitive** owns one concept outright and is cited by name from anywhere.

| Skill | Kind | Owns |
| ----------------- | --------- | ------------------------------------------------------------- |
| `review-base` | base | Prefixes, severity, agent routing, the fixed point, the two axes, the Fowler smell baseline, review machinery |
| `plan-base` | base | Domain discovery, mastermind invocation, plan format, seams under test, the planning grill |
| `grilling` | primitive | The decision-tree interview: rounds over the frontier, recommended answer, facts looked up not asked, the stop option |
| `domain-modeling` | primitive | `CONTEXT.md` glossary format, ADR format and the 3-of-3 gate, lazy creation, consumer rules |
| `codebase-design` | primitive | Deep modules: module, interface, depth, seam, adapter, leverage, locality |
| `tdd` | primitive | The red-green-refactor loop, what a good test is, seams, test anti-patterns |
| `writing-for-agents` | primitive | How to write any agent-read document: pointers, the two loads, hierarchy, completion criteria, leading words, pruning |

---

## Hooks & Notifications

| Hook         | Script                       | Purpose                                                                       |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------- |
| SessionStart | `session-start.js`           | Auto-pull config updates (12h throttle), load context, detect package manager |
| SessionEnd   | `session-end.js`             | Persist session state                                                         |
| Stop         | `play-sound.sh done`         | Plays a "turn finished" sound                                                 |
| Stop         | `evaluate-session.js`        | Trigger learning extraction if 10+ messages                                   |
| Notification | `play-sound.sh notify`       | Plays a "Claude needs you" sound (permission prompt, question, idle)          |
| PreToolUse   | `git-guardrails.js`          | Block dangerous git commands                                                  |

Hook paths are configured via `settings.template.json` with `__HOME__` placeholders, resolved by `scripts/setup.sh` during installation.

### Sounds

Both hooks run the same script with a different argument: `play-sound.sh done` or `play-sound.sh notify`. The script always plays a local system sound directly - no external notifier app is involved.

macOS only: `Submarine.aiff` for `done`, `Glass.aiff` for `notify` (both under `/System/Library/Sounds/`), played via `afplay`. No WAV files are bundled in this repo - there is no `assets/sounds/` directory or generator script. To change a sound, edit the `afplay` path directly in `play-sound.sh`.

---

## Rules

8 always-loaded rule files in `rules/`:

| Rule              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `agents.md`       | External fact verification before asserting an identifier  |
| `coding-style.md` | Immutability, file limits, naming conventions              |
| `git-workflow.md` | Conventional commits, PR process                           |
| `testing.md`      | TDD, seams, test anti-patterns, 80% coverage               |
| `models.md`       | Model tier SSOT - per-agent/skill assignment, no versions  |
| `performance.md`  | Context management, compaction, build troubleshooting      |
| `python.md`       | Virtualenv discipline, version pinning, quality checklist  |
| `security.md`     | OWASP checklist, secret management                         |

---

## Daily Workflow Examples

### Feature Implementation

```bash
/plan-task "implement user authentication"  # Mastermind Agent plans phases
/build-feature                              # Specialists execute each phase
/quality-gate                               # Run all checks
/commit-all                                 # Create grouped commits
/pr-description                             # Generate PR description
```

### Code Review

```bash
/review                                     # Review current branch locally
/review <pr-url>                            # Review remote GitHub PR
/resolve-pr <pr-url>                        # Analyze and respond to PR review threads
```

### Debugging

```bash
/find-bug "getting 500 on /api/users"       # Root cause analysis
/consult backend "how to handle N+1 query"  # Ask backend expert
```

### Learning

```bash
/extract-learning "prisma pooling fix"      # Save session knowledge
/improve-claude "always check for N+1"      # Add new standard
```

---

## Folder Structure

```
~/.claude/
|
|- CLAUDE.md                  # Code standards (source of truth)
|- README.md                  # This documentation
|- settings.template.json     # Hook config template (tracked in git)
|- settings.json              # Generated by setup.sh (gitignored)
|
|- scripts/                   # Hook automation scripts
|  |- setup.sh                # First-time setup (generates settings.json)
|  |- hooks/                  # Event-triggered scripts
|  |  |- auto-update.js       # Auto-pull config updates on session start
|  |  |- session-start.js
|  |  |- session-end.js
|  |  |- evaluate-session.js
|  |  |- git-guardrails.js
|  |  |- play-sound.sh        # Plays a macOS system sound (done | notify)
|  |- lib/                    # Shared modules, one concern each
|  |  |- paths.js, files.js, hook-io.js, system.js, stamps.js
|  |  |- settings-merge.js, hook-identity.js, render-settings.js
|  |  |- package-manager.js, config-inventory.js
|  |- tests/                  # Static integrity suite (npm test)
|
|- agents/                    # 11 specialist agents
|- skills/                    # 55 skills (invocable workflows + pattern libraries)
|- rules/                     # 8 always-loaded rule files
```

---

## Configuration Files

### settings.template.json -> settings.json

The template contains hook configuration with `__HOME__` placeholders. The setup script replaces these with your actual home directory to generate `settings.json`:

```bash
# Template (tracked in git)
"command": "node __HOME__/.claude/scripts/hooks/session-start.js"

# Generated settings.json (gitignored, personal to you)
"command": "node /Users/yourname/.claude/scripts/hooks/session-start.js"
```

Claude Code does not expand `$HOME` in hook commands, which is why we use this template approach.

### CLAUDE.md

Source of truth for code standards:

| Rule            | Limit                             |
| --------------- | --------------------------------- |
| File length     | Max 150 lines                     |
| Function length | Max 30 lines                      |
| Class length    | Max 200 lines                     |
| Architecture    | Three-layer (UI -> Logic -> Data) |
| Exports         | Named exports only (no default)   |
| Imports         | Direct imports (no barrel files)  |