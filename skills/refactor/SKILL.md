---
name: refactor
description: Intelligent Refactoring Engine - restructure code systematically preserving functionality while improving structure and maintainability
argument-hint: [files/directories/scope] or resume|status|new|validate
disable-model-invocation: true
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write, TodoWrite
model: opus
---

# Intelligent Refactoring Engine

Restructure code systematically - preserving functionality while improving structure, readability, and maintainability.

Arguments: `$ARGUMENTS` - files, directories, or refactoring scope

**SESSION FILES LOCATION: Always use refactor/ folder in current directory**

## Session Intelligence

Session Files (in current project):
- `refactor/plan.md` - Refactoring plan with progress tracking
- `refactor/state.json` - Current state and completed actions

## Phase 1: Initial Setup & Analysis

**MANDATORY FIRST STEPS:**
1. Check for `refactor/` directory in current directory
2. If exists, read `refactor/state.json` and `refactor/plan.md`
3. If session exists with incomplete tasks: display progress, ask resume/new

**Analysis Focus:**
- Code complexity hotspots using Grep patterns
- Duplication detection across files
- Architecture inconsistencies
- Test coverage for safe refactoring

## Phase 2: Refactoring Planning

Create plan in `refactor/plan.md` with: Initial State Analysis, Refactoring Tasks (prioritized with risk levels), Validation Checklist, De-Para Mapping.

## Phase 2.5: Consult Specialist

Use Task tool for frontend-principal or backend-principal based on file types.

## Phase 3: Incremental Execution

1. Create git checkpoint
2. Apply low-risk improvements first
3. Validate after each change (tests, TypeScript, imports)
4. Progress to higher-impact refactorings
5. Update plan with completion status

**After EVERY change:**
- Run unit tests
- Deep comparison (function outputs before/after)
- Automated fixes (imports, types, linting)
- Quality gates (STOP if tests fail)

## Phase 4: Pattern Application

- Extract duplicated code into utilities
- Simplify complex functions
- Improve naming for clarity
- Reduce coupling between modules

## Phase 5: Quality Metrics

Track: complexity reduction, duplication elimination, test coverage, performance benchmarks.

## Phase 6: Final Validation

Automatic after all refactorings:
1. Coverage Check - find remaining old patterns
2. Import Verification - detect broken imports
3. Build & Test - full suite
4. Dead Code Detection
5. Generate de-para documentation

## Commands

```bash
/refactor                    # Analyze entire project
/refactor src/components/    # Focus on specific directory
/refactor resume             # Continue existing session
/refactor status             # Check progress
/refactor new                # Start fresh
/refactor validate           # Run validation phase
/refactor finish             # Complete with full validation
```

## Safety Guarantees

- Save state before changes
- Incremental updates at logical points
- Test validation after each step
- Clear rollback strategy
