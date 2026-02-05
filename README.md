# Claude Code Setup - Developer Memorybank

This document explains how the Claude Code setup works in `~/.claude/` for daily development workflows. Use this guide to understand the system architecture, available commands, and how to leverage the principal engineer team.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Hooks & Notifications](#hooks--notifications)
3. [Commands Reference](#commands-reference)
4. [Principal Engineer Agents](#principal-engineer-agents)
5. [Skills Library](#skills-library)
6. [Learning Loop](#learning-loop)
7. [Daily Workflow Examples](#daily-workflow-examples)
8. [Configuration Files](#configuration-files)
9. [Folder Structure](#folder-structure)
10. [Quick Reference](#quick-reference)

---

## System Overview

The Claude Code setup follows a three-tier architecture where **Commands** orchestrate **Agents**, which load **Skills** (pattern libraries).

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLAUDE.MD                                 │
│              (Principal Engineer Code Standards)                    │
│     Max 150 lines/file • 30 lines/func • Three-layer architecture   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ (enforces standards)
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌────────────────┐
│   COMMANDS    │       │    AGENTS     │       │    SKILLS      │
│   (18 total)  │──────▶│  (10 total)   │──────▶│  (26+ total)   │
│               │       │               │       │                │
│ User-facing   │       │ Specialist    │       │ Pattern        │
│ workflows     │       │ principals    │       │ libraries      │
│               │       │               │       │                │
│ /review       │       │ mastermind    │       │ react-component│
│ /gitlab-review│       │ frontend-*    │       │ backend-*      │
│ /plan-task    │       │ backend-*     │       │ security-*     │
│ /build-feature│       │ security-*    │       │ architect      │
│ ...           │       │ ...           │       │ ...            │
└───────────────┘       └───────────────┘       └────────────────┘

        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   LEARNING LOOP       │
                    │   (Auto-improvement)  │
                    │                       │
                    │ Reviews → Learn →     │
                    │ Update configs        │
                    └───────────────────────┘
```

### How It Works

1. **User invokes a command** (e.g., `/review`)
2. **Command spawns relevant agents** (e.g., security-principal, frontend-principal)
3. **Agents load their skills** (e.g., react-component, security-patterns)
4. **Agents analyze code** using skill patterns
5. **Results aggregated** and returned to user
6. **Learning loop** extracts patterns to improve configuration

---

## Hooks & Notifications

The hooks system provides real-time notifications, session management, and continuous learning triggers.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    COMPREHENSIVE HOOKS SYSTEM                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │ SessionStart    │──► session-start.js                             │
│  │ Hook            │    • Loads recent sessions (7 days)             │
│  │                 │    • Detects package manager                    │
│  │                 │                                                 │
│  └─────────────────┘                                                 │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │ SessionEnd      │──► session-end.js                               │
│  │ Hook            │    • Creates/updates session file               │
│  │                 │    • Persists state to ~/.claude/sessions/      │
│  └─────────────────┘                                                 │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │ Stop Hook       │──► 1. Submarine sound (audio notification)      │
│  │ (when Claude    │──► 2. evaluate-session.js                       │
│  │  stops)         │       • Counts session messages                 │
│  │                 │       • Signals if 10+ messages                 │
│  │                 │       • Triggers learning extraction            │
│  └─────────────────┘                                                 │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │ PreToolUse      │──► 1. notify.sh (AskQuestion/ExitPlan)          │
│  │ Hook            │       • Desktop notifications                   │
│  │                 │──► 2. suggest-compact.js (Edit/Write)           │
│  │                 │       • Suggests /compact at 50 calls           │
│  │                 │       • Reminders every 25 calls                │
│  └─────────────────┘                                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Hook Scripts (Node.js - Cross-Platform)

| Script | Location | Purpose |
|--------|----------|---------|
| `session-start.js` | `scripts/hooks/` | Load previous context on session start |
| `session-end.js` | `scripts/hooks/` | Persist session state |
| `evaluate-session.js` | `scripts/hooks/` | Trigger learning extraction at session end |
| `suggest-compact.js` | `scripts/hooks/` | Strategic compaction suggestions |

### ClaudeNotifier Menu Bar App

The custom macOS menu bar app receives notifications via HTTP on port **19847**:

| Notification Type | Trigger | Message |
|-------------------|---------|---------|
| `ask_question` | AskUserQuestion tool | "Claude is asking you a question" |
| `stop` | Claude stops processing | "Claude is waiting for your response" |
| `permission_request` | Permission prompt | "Permission requested for: [tool]" |
| `tool_use` | Other tools | "Claude is using: [tool_name]" |

### Hook Configuration (settings.json)

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /Users/shaimalul/.claude/scripts/hooks/session-start.js",
        "timeout": 10
      }]
    }],
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /Users/shaimalul/.claude/scripts/hooks/session-end.js",
        "timeout": 10
      }]
    }],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "afplay /System/Library/Sounds/Submarine.aiff",
          "timeout": 5
        }]
      },
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node /Users/shaimalul/.claude/scripts/hooks/evaluate-session.js",
          "timeout": 10
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion|ExitPlanMode",
        "hooks": [{
          "type": "command",
          "command": "/Users/shaimalul/.claude/plugins/claude-notifier-plugin/scripts/notify.sh",
          "timeout": 5
        }]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "node /Users/shaimalul/.claude/scripts/hooks/suggest-compact.js",
          "timeout": 5
        }]
      }
    ]
  }
}
```

---

## Commands Reference

### 20 Available Slash Commands

| Command | Description | Spawns Agents |
|---------|-------------|---------------|
| **Code Review** |||
| `/review` | Review current branch changes | security, architect, frontend, backend, ux, devops, ai (based on files) |
| `/gitlab-review <url>` | Review GitLab MR + post draft comments | Same as /review |
| `/gitlab-fix-comments <proj> <mr>` | Apply fixes from MR comments | gitlab-comment-fixer |
| **Feature Development** |||
| `/plan-task [description]` | Plan feature with mastermind | mastermind |
| `/build-feature` | Execute planned feature | mastermind → specialists |
| `/refactor` | Intelligent refactoring engine | frontend/backend principals |
| `/iterate-task <prompt.md>` | Run task repeatedly until done (Ralph approach) | None |
| **Quality & Analysis** |||
| `/quality-gate` | Run comprehensive quality checks | security, architect |
| `/find-bug [context]` | Debug and root cause analysis | bug-finder |
| **Git & Commits** |||
| `/commit-all` | Group commits by Conventional Commits | None |
| `/mr-description` | Generate MR description from changes | None |
| **Consultation** |||
| `/consult [domain]` | Consult specific principal engineer | Specified principal |
| **Utilities** |||
| `/improve-claude [rule]` | Update Claude configuration | None |
| `/extract-learning [topic]` | Extract session knowledge as reusable skill | None |
| `/remove-comments` | Remove obvious comments | None |

### Command Details

#### `/review` - Local Code Review

Reviews all changes on current branch compared to base branch (main/master).

**What it does:**
1. Identifies changed files via `git diff`
2. Categorizes files by type (frontend, backend, devops, AI)
3. Spawns relevant principal agents IN PARALLEL
4. Aggregates findings by severity (Critical → High → Medium → Low)
5. Runs learning loop to improve configuration

**Agents always spawned:**
- `security-principal` - OWASP, vulnerabilities, secrets
- `architect-principal` - CLAUDE.md compliance, architecture

**Agents spawned based on file types:**
- `frontend-principal` - For .tsx, .jsx, .css, .scss files
- `ux-principal` - For UI components
- `backend-principal` - For backend .ts files
- `devops-principal` - For .tf, .yaml, Dockerfile
- `ai-principal` - For AI/ML related files

#### `/gitlab-review <url>` - Remote MR Review

Fully automated GitLab MR review that posts draft comments.

**Requirements:**
- `GITLAB_TOKEN` with `api` scope (not just `read_api`)
- Must be project member for private projects

**What it does:**
1. Parses MR URL to extract project and MR ID
2. Fetches MR data, diffs, and file contents via GitLab API
3. Analyzes with principal agents
4. Posts findings as **draft comments** on GitLab
5. Generates comprehensive report saved to `~/.claude/gitlab-review-assets/`

**Output:**
- Draft comments posted to GitLab MR
- Report saved: `~/.claude/gitlab-review-assets/mr_<ID>_<TIMESTAMP>/review-report.md`

#### `/plan-task [description]` + `/build-feature`

Two-step workflow for feature implementation.

**Step 1: `/plan-task "implement user authentication"`**
- Mastermind analyzes requirements
- Identifies involved domains (frontend, backend, security, etc.)
- Creates task breakdown with phases
- Defines dependencies and risks

**Step 2: `/build-feature`**
- Reads plan from previous step
- Delegates to specialist principals by phase
- Runs quality gates after implementation
- Generates build report

#### `/commit-all`

Intelligent commit grouping following Conventional Commits.

**Process:**
1. Analyzes all staged and unstaged changes
2. Groups by domain/type
3. Shows commit plan for approval
4. Creates semantic commits

**Commit prefixes:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `chore:` - Maintenance
- `refactor:` - Code restructuring
- `test:` - Test changes
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `style:` - Code style changes

#### `/extract-learning [topic]` - Knowledge Extraction

Extract reusable knowledge from your session and save it as a skill.

**When to use:**
- After fixing a non-obvious bug
- After finding a workaround through trial-and-error
- After discovering a useful pattern
- After resolving an error where root cause wasn't obvious

**Usage:**
```bash
/extract-learning                           # Review full session
/extract-learning "prisma pooling fix"      # Extract specific topic
```

**What it does:**
1. Reviews session for extractable knowledge
2. Checks quality gates (reusable, non-trivial, verified)
3. Identifies the appropriate domain skill (styling-rtl, react-component, etc.)
4. Integrates the pattern into the existing skill file
5. Reports what was updated

**Quality gates:**
- Solution was verified to work
- Description has specific triggers
- Knowledge is reusable (not one-time fix)
- No sensitive data

**Output location:** Integrated into existing `~/.claude/skills/[domain]/SKILL.md`

#### `/iterate-task <prompt.md>` - Iterative Task Execution (Ralph Approach)

Run a task repeatedly until complete, with prompt refinement between iterations.

**Philosophy:** When things go wrong, **tune the prompt—not the code.**

**Usage:**
```bash
/iterate-task path/to/PROMPT.md             # Iterate until done
/iterate-task path/to/PROMPT.md --max=5     # Max 5 iterations
```

**What it does:**
1. Reads your PROMPT.md task definition
2. Executes the task
3. Reports results
4. If not complete: prompts you to refine PROMPT.md
5. Repeats until success or max iterations

**PROMPT.md format:**
```markdown
# Task: [Your Task]

## Context
[Project background]

## Objective
[What needs to be done]

## Previous Attempts
- Attempt 1: [What was tried] → [Result]

## Current Focus
[What to try this iteration]

## Success Criteria
[How to know when done]
```

**Template location:** `~/.claude/templates/iterate-prompt.md`

---

## Principal Engineer Agents

### 10 Specialist Agents

| Agent | Expertise | Auto-Loaded Skills |
|-------|-----------|-------------------|
| **mastermind** | Orchestrator - delegates to specialists | All skills (routes based on task) |
| **frontend-principal** | React, TypeScript, hooks, state, components | react-component, refactoring-patterns, typescript-types, common-ui-patterns |
| **backend-principal** | Node.js, NestJS, Express, APIs, databases | backend-patterns, api-design, database-patterns |
| **security-principal** | OWASP Top 10, auth, vulnerabilities, secrets | security-patterns |
| **architect-principal** | System design, ADRs, scalability, integration | architect |
| **devops-principal** | Docker, K8s, Terraform, CI/CD, infrastructure | docker-patterns, kubernetes-patterns, terraform-patterns, cicd-patterns |
| **ai-principal** | OpenAI, prompts, RAG, embeddings, streaming | openai-integration, prompt-engineering |
| **ux-principal** | Accessibility, WCAG 2.1, ARIA, interactions | accessibility-patterns, interaction-design |
| **bug-finder** | Root cause analysis, error logs, stack traces | find-bug |
| **gitlab-comment-fixer** | Analyze and apply MR comment fixes | None |

### Agent Skill Routing (Mastermind)

When mastermind encounters specific code patterns, it routes to the appropriate specialist:

| Code Pattern | Primary Skill | Routes To |
|--------------|---------------|-----------|
| `fetch()` in component, multiple `useState` | refactoring-patterns | frontend-principal |
| Native HTML vs ZCD components | common-ui-patterns | frontend-principal |
| DB calls in controller, missing validation | backend-patterns | backend-principal |
| API design, REST conventions | api-design | backend-principal |
| TypeORM, Prisma queries | database-patterns | backend-principal |
| Strategy pattern, ADRs | architect | architect-principal |
| Type casting, enum patterns | typescript-types | frontend-principal |
| OWASP, auth patterns | security-patterns | security-principal |
| Docker, Compose | docker-patterns | devops-principal |
| Kubernetes, Helm | kubernetes-patterns | devops-principal |
| OpenAI API, streaming | openai-integration | ai-principal |
| Prompt design | prompt-engineering | ai-principal |
| ARIA, keyboard nav | accessibility-patterns | ux-principal |

---

## Skills Library

### 26 Pattern Libraries

#### Frontend (9 skills)

| Skill | Purpose |
|-------|---------|
| `react-component` | React patterns, hooks, state management, anti-patterns |
| `refactoring-patterns` | Code smell detection, fetch→Service+Query, business logic extraction |
| `useeffect-patterns` | useEffect best practices, dependency arrays, cleanup |
| `styling-rtl` | CSS/SCSS with RTL support, logical properties, design tokens |
| `storybook-story` | Storybook conventions, interaction tests, argTypes |
| `common-ui-patterns` | Zencity Common UI system, ZCD components, colors |
| `typescript-types` | TypeScript naming, discriminated unions, type patterns |
| `testing-patterns` | Behavior-driven tests, mocking, React Query tests |
| `no-comments` | Self-documenting code guidelines |

#### Backend (3 skills)

| Skill | Purpose |
|-------|---------|
| `backend-patterns` | Three-layer architecture, Controller→Service→Repository, DI |
| `api-design` | RESTful conventions, validation, error responses, HTTP codes |
| `database-patterns` | TypeORM/Prisma queries, transactions, N+1 prevention |

#### DevOps (5 skills)

| Skill | Purpose |
|-------|---------|
| `docker-patterns` | Multi-stage builds, security, optimization, Compose |
| `kubernetes-patterns` | K8s manifests, Helm charts, Node.js deployment |
| `terraform-patterns` | AWS/GCP/Azure modules, networking, compute |
| `cicd-patterns` | GitHub Actions, GitLab CI, testing, deployment |
| `aws-eks-patterns` | EKS clusters, node groups, IRSA, networking |

#### Security (1 skill)

| Skill | Purpose |
|-------|---------|
| `security-patterns` | OWASP Top 10, authentication, secrets management |

#### AI/ML (2 skills)

| Skill | Purpose |
|-------|---------|
| `openai-integration` | Chat API, Embeddings, Function Calling, streaming |
| `prompt-engineering` | System prompts, few-shot, chain-of-thought, output formatting |

#### Architecture (3 skills)

| Skill | Purpose |
|-------|---------|
| `architect` | System design, ADRs, scalability, reliability patterns |
| `npm-package-patterns` | Package exports, subpath exports, JSDoc |
| `find-bug` | Bug detection, error log analysis, root cause patterns |

#### Design (2 skills)

| Skill | Purpose |
|-------|---------|
| `accessibility-patterns` | WCAG 2.1 AA, semantic HTML, ARIA, focus management |
| `interaction-design` | Modals, forms, loading states, error handling, notifications |

---

## Learning Loop

The system continuously improves through session hooks and review commands, all unified through `/improve-claude`.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED LEARNING PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SESSION END                        REVIEW COMMANDS                 │
│  ───────────                        ───────────────                 │
│  evaluate-session.js                /review or /gitlab-review       │
│       │                                    │                        │
│       ▼                                    ▼                        │
│  [ContinuousLearning]              Extract [Blocker]/[Nice to have] │
│  "Session ready for extraction"    /[Suggestion] findings           │
│       │                                    │                        │
│       │                                    │                        │
│       └──────────────────┬─────────────────┘                        │
│                          ▼                                          │
│                 ┌─────────────────┐                                 │
│                 │ /improve-claude │                                 │
│                 │ (unified cmd)   │                                 │
│                 └────────┬────────┘                                 │
│                          │                                          │
│            ┌─────────────┼─────────────┐                            │
│            ▼             ▼             ▼                            │
│      CLAUDE.md    agents/*.md   skills/[domain]/                    │
│      (rules)      (behavior)    SKILL.md                            │
│                                                                     │
│                          │                                          │
│                          ▼                                          │
│                 ┌─────────────────┐                                 │
│                 │  NEXT SESSION   │                                 │
│                 │  Skills loaded  │                                 │
│                 │  via normal     │                                 │
│                 │  skill system   │                                 │
│                 └─────────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Learning Triggers

| Trigger | When | What Happens |
|---------|------|--------------|
| **Session End** | Claude stops (10+ messages) | `evaluate-session.js` analyzes transcript for extraction triggers, recommends `/extract-learning` if score >= 2 |
| **Manual Extraction** | `/extract-learning [topic]` | Reviews session, extracts reusable knowledge, integrates into existing domain skills |
| **Review Commands** | `/review`, `/gitlab-review` | Extracts [Blocker]/[Nice to have]/[Suggestion] findings |
| **Config Update** | `/improve-claude --save-skill` | Direct rule + skill creation |

### Learning Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| **Domain Skills** | `~/.claude/skills/[domain]/SKILL.md` | Patterns integrated into existing domain skills |
| **Rule Updates** | `CLAUDE.md`, `agents/`, `skills/` | Configuration improvements via `/improve-claude` |

### Learning Integration Format

Patterns are added to existing domain skill files (e.g., `~/.claude/skills/react-component/SKILL.md`):

```markdown
# [Pattern Name]

**Extracted:** 2026-01-26
**Source:** /review
**Type:** blocker
**Category:** react-component

## Problem
[Specific issue found]

## Solution
[Fix or best practice]

## Example
[Code example if applicable]

## When to Use
[Trigger conditions]
```

---

## Daily Workflow Examples

### Workflow 1: Feature Implementation

```
┌──────────────────────────────────────────────────────────────────┐
│                 FEATURE IMPLEMENTATION                           │
└──────────────────────────────────────────────────────────────────┘

User: /plan-task "implement user authentication"
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ MASTERMIND ANALYZES REQUIREMENTS          │
        │                                           │
        │ • Identifies domains: frontend + backend  │
        │ • Security review needed                  │
        │ • Database changes required               │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ CREATES TASK BREAKDOWN                    │
        │                                           │
        │ Phase 1: Database models + migrations     │
        │ Phase 2: Backend API endpoints            │
        │ Phase 3: Frontend auth components         │
        │ Phase 4: Security review                  │
        │ Phase 5: Tests                            │
        └───────────────────────────────────────────┘

User: /build-feature
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ PHASE 1: backend-principal                │
        │ Creates User model, migrations            │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ PHASE 2: backend-principal                │
        │ Implements /auth/login, /auth/register    │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ PHASE 3: frontend-principal               │
        │ Creates LoginForm, AuthContext            │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ PHASE 4: security-principal               │
        │ Reviews for OWASP, auth vulnerabilities   │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ QUALITY GATE                              │
        │ npm test → tsc --noEmit → lint → build    │
        └───────────────────────────────────────────┘

User: /commit-all
                │
                ▼
        Creates grouped commits:
        • feat(db): add user model and migrations
        • feat(api): implement auth endpoints
        • feat(ui): add login form and auth context
        • test(auth): add authentication tests
```

### Workflow 2: Local Code Review

```
┌──────────────────────────────────────────────────────────────────┐
│                    LOCAL CODE REVIEW                              │
└──────────────────────────────────────────────────────────────────┘

User: /review
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ IDENTIFY CHANGED FILES                    │
        │                                           │
        │ git diff $(git merge-base HEAD main)...HEAD │
        │                                           │
        │ Changed files:                            │
        │ • src/components/UserProfile.tsx          │
        │ • src/services/userService.ts             │
        │ • src/controllers/userController.ts       │
        │ • Dockerfile                              │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ SPAWN AGENTS IN PARALLEL                  │
        │                                           │
        │ ┌──────────────┐ ┌──────────────┐         │
        │ │ security-*   │ │ architect-*  │         │
        │ │ (always)     │ │ (always)     │         │
        │ └──────────────┘ └──────────────┘         │
        │                                           │
        │ ┌──────────────┐ ┌──────────────┐         │
        │ │ frontend-*   │ │ backend-*    │         │
        │ │ (has .tsx)   │ │ (has .ts)    │         │
        │ └──────────────┘ └──────────────┘         │
        │                                           │
        │ ┌──────────────┐                          │
        │ │ devops-*     │                          │
        │ │ (Dockerfile) │                          │
        │ └──────────────┘                          │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ AGGREGATE FINDINGS                        │
        │                                           │
        │ Critical: 1 (SQL injection in controller) │
        │ High: 2 (missing validation, type cast)   │
        │ Medium: 3 (file too long, dead code)      │
        │ Low: 1 (naming convention)                │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ LEARNING LOOP                             │
        │                                           │
        │ Extracts Critical + High + Suggestion     │
        │ Invokes /improve-claude for each          │
        │ Logs to learning-history.md               │
        └───────────────────────────────────────────┘
                │
                ▼
        Outputs prioritized review report
```

### Workflow 3: GitLab MR Review (Remote)

```
┌──────────────────────────────────────────────────────────────────┐
│                   GITLAB MR REVIEW                               │
└──────────────────────────────────────────────────────────────────┘

User: /gitlab-review https://gitlab.com/team/project/-/merge_requests/123
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ PARSE URL & AUTHENTICATE                  │
        │                                           │
        │ Project: team/project                     │
        │ MR ID: 123                                │
        │ Token: from ~/.claude/.secrets            │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌─────────────────────────────────────────────────────┐
        │ FETCH MR DATA via GitLab API                        │
        │                                                     │
        │ GET /api/v4/projects/:id/merge_requests/123         │
        │ GET /api/v4/projects/:id/merge_requests/123/diffs   │
        │                                                     │
        │ Downloads: MR metadata, diffs, comments             │
        └─────────────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ ANALYZE WITH PRINCIPAL AGENTS             │
        │                                           │
        │ Same parallel analysis as /review         │
        │ Based on changed file types               │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ POST DRAFT COMMENTS TO GITLAB             │
        │                                           │
        │ For each finding:                         │
        │ POST /api/v4/projects/:id/merge_requests/ │
        │      123/discussions                      │
        │                                           │
        │ Comments posted as DRAFTS (not published) │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │ SAVE REPORT                               │
        │                                           │
        │ Location:                                 │
        │ ~/.claude/gitlab-review-assets/           │
        │   mr_123_20260125_143022/                 │
        │   └── review-report.md                    │
        └───────────────────────────────────────────┘
                │
                ▼
        Displays clickable link to report
```

### Workflow 4: Principal Consultation

```
User: /principal frontend "How should I structure state for a complex form?"
                │
                ▼
        Spawns frontend-principal with:
        • react-component skill loaded
        • refactoring-patterns skill loaded
        • typescript-types skill loaded
                │
                ▼
        Returns expert guidance on:
        • Form state patterns (controlled vs uncontrolled)
        • React Hook Form vs Formik recommendations
        • Validation strategies (Zod schemas)
        • Error handling patterns
```

---

## Configuration Files

### settings.json

Main configuration with model, permissions, and hooks:

```json
{
  "$schema": "https://json-schema.store.org/claude-code-settings.json",
  "model": "claude-opus-4-5-20251101",
  "permissions": {
    "allow": [
      "mcp__chrome-devtools__*",
      "mcp__playwright__*",
      "Read(**)",
      "Write(**)",
      "Edit(**)",
      "Bash",
      "WebSearch"
    ],
    "defaultMode": "bypassPermissions"
  },
  "alwaysThinkingEnabled": true,
  "hooks": {
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "afplay /System/Library/Sounds/Submarine.aiff",
          "timeout": 5
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion|ExitPlanMode",
        "hooks": [{
          "type": "command",
          "command": "/Users/shaimalul/.claude/plugins/claude-notifier-plugin/scripts/notify.sh",
          "timeout": 5
        }]
      }
    ]
  }
}
```

### .secrets

GitLab token for remote MR reviews:

```bash
GITLAB_TOKEN="glpat-xxx"  # Required for /gitlab-review
```

**Security notes:**
- Never commit this file
- Token requires `api` scope (not just `read_api`)
- Must be project member for private projects

### CLAUDE.md

Source of truth for code standards. Key rules:

| Rule | Limit |
|------|-------|
| File length | Max 150 lines |
| Function length | Max 30 lines |
| Class length | Max 200 lines |
| Architecture | Three-layer (UI → Logic → Data) |
| Exports | Named exports only (no default) |
| Imports | Direct imports (no barrel files) |
| Type casting | Never use `as Type` |

---

## Folder Structure

```
~/.claude/
│
├── CLAUDE.md                  # Code standards (source of truth)
├── README.md                  # This documentation
├── settings.json              # Model, permissions, hooks
├── .secrets                   # GitLab token (gitignored)
│
├── scripts/                   # Hook automation scripts
│   ├── hooks/                 # Event-triggered scripts
│   │   ├── session-start.js   # Loads context on session start
│   │   ├── session-end.js     # Persists state on session end
│   │   ├── evaluate-session.js# Triggers learning extraction
│   │   └── suggest-compact.js # Token optimization suggestions
│   └── lib/                   # Shared utilities
│       ├── utils.js           # Common functions
│       └── package-manager.js # Package manager detection
│
├── sessions/                  # Session state persistence
│   └── YYYY-MM-DD-{id}.tmp    # Daily session files (7-day retention)
│
├── commands/                  # 20 slash commands
│   ├── review.md              # Local code review
│   ├── gitlab-review.md       # Remote MR review
│   ├── gitlab-fix-comments.md # Apply MR fixes
│   ├── plan-task.md           # Feature planning
│   ├── build-feature.md       # Feature execution
│   ├── iterate-task.md        # Iterative task execution (Ralph)
│   ├── commit-all.md          # Smart commits
│   ├── quality-gate.md        # Quality checks
│   ├── consult.md             # Principal consultation
│   ├── find-bug.md            # Bug analysis
│   ├── refactor.md            # Refactoring engine
│   ├── improve-claude.md      # Config updates + pattern extraction
│   ├── extract-learning.md    # Session knowledge extraction
│   ├── mr-description.md      # MR description gen
│   └── remove-comments.md     # Comment removal
│
├── agents/                    # 10 principal engineers
│   ├── mastermind.md          # Orchestrator
│   ├── frontend-principal.md  # React/TypeScript expert
│   ├── backend-principal.md   # Node.js/NestJS expert
│   ├── security-principal.md  # OWASP/auth expert
│   ├── architect-principal.md # System design expert
│   ├── devops-principal.md    # Docker/K8s expert
│   ├── ai-principal.md        # OpenAI/prompts expert
│   ├── ux-principal.md        # Accessibility expert
│   ├── bug-finder.md          # Debug expert
│   └── gitlab-comment-fixer.md# MR fix expert
│
├── skills/                    # Pattern libraries (learnings integrated here)
│   ├── continuous-learning/   # Learning configuration
│   │   └── config.json
│   ├── extract-learning/      # Knowledge extraction skill
│   │   └── SKILL.md
│   ├── react-component/       # React patterns
│   ├── refactoring-patterns/  # Code smell fixes
│   ├── backend-patterns/      # Three-layer arch
│   ├── security-patterns/     # OWASP patterns
│   ├── docker-patterns/       # Container best practices
│   ├── openai-integration/    # OpenAI patterns
│   └── ...                    # 20 more skills
│
├── templates/                 # Reusable templates
│   └── iterate-prompt.md      # Template for /iterate-task
│
├── iterate-sessions/          # Iteration session logs
│   └── iterate-[timestamp].log
│
├── rules/                     # Always-follow guidelines
│   ├── performance.md         # Model selection, token optimization
│   ├── coding-style.md        # Immutability, file limits
│   ├── testing.md             # TDD, coverage requirements
│   ├── git-workflow.md        # Commit format, PR process
│   ├── security.md            # OWASP, secret management
│   └── agents.md              # Agent delegation rules
│
├── plugins/
│   └── claude-notifier-plugin/
│       ├── hooks/hooks.json   # Hook configuration
│       └── scripts/notify.sh  # Notification script
│
├── projects/                  # Per-project session data
│   └── -Users-xxx-project/    # Session history
│
├── gitlab-review-assets/      # MR review reports
│   └── mr_123_timestamp/
│       ├── mr_data.json
│       └── review-report.md
│
└── gitlab-fix-comments/       # MR fix reports
    └── mr_123_timestamp/
        └── analysis.json
```

---

## Quick Reference

### Most Used Commands

```bash
# Feature development
/plan-task "implement X"      # Plan the feature
/build-feature                # Execute the plan
/iterate-task PROMPT.md       # Iterate until done (Ralph approach)
/commit-all                   # Create grouped commits

# Code review
/review                       # Review current branch
/gitlab-review <url>          # Review remote MR
/quality-gate                 # Run all checks

# Debugging
/find-bug <context>           # Analyze bug
/consult backend "question"   # Ask expert

# Learning & Utilities
/extract-learning "topic"     # Save session knowledge as skill
/improve-claude "rule"        # Add new standard
/mr-description               # Generate MR desc
```

### Principal Domains

```bash
/principal frontend   # React, TypeScript, components
/principal backend    # Node.js, NestJS, APIs
/principal security   # OWASP, auth, vulnerabilities
/principal architect  # System design, ADRs
/principal devops     # Docker, K8s, CI/CD
/principal ai         # OpenAI, prompts
```

### Notification Sounds

| Event | Sound |
|-------|-------|
| Claude stops | Submarine (audio) |
| Claude asks question | Menu bar notification |
| Claude needs permission | Menu bar notification |

---

## Summary

This Claude Code setup provides:

1. **Automated code reviews** with parallel principal agent analysis
2. **GitLab integration** for remote MR reviews with draft comments
3. **Feature orchestration** via mastermind → specialist delegation
4. **Continuous learning** via `/extract-learning` that integrates patterns into existing domain skills
5. **Iterative task execution** via `/iterate-task` following the Ralph approach (tune the prompt, not the code)
6. **Session persistence** via hooks that save/load context across sessions
7. **Token optimization** with strategic `/compact` suggestions at 50+ edits
8. **Desktop notifications** when Claude needs attention
9. **26+ skill libraries** covering frontend, backend, security, DevOps, and AI (learnings integrated directly)
10. **6 rules files** for consistent enforcement of coding standards

The system follows principal engineer standards defined in CLAUDE.md and continuously improves through:
- **`/extract-learning`** - Manual knowledge extraction from sessions
- **`evaluate-session.js`** - Automatic trigger detection recommending extraction
- **Review commands** - Learning loop that extracts patterns from code reviews

---

*Last updated: 2026-01-26*
