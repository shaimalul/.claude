# Iterate Task

Run a task iteratively until complete, following the Ralph approach.

**Arguments:** `$ARGUMENTS` - Path to PROMPT.md file (required), optionally with `--max=N` for iteration limit

## Philosophy

**When things go wrong, tune the prompt—not the code.**

This command implements the Ralph approach: continuous iteration with prompt refinement. Each iteration learns from the previous. When something fails, you edit the prompt file to provide clearer instructions.

## What This Command Does

1. Reads your PROMPT.md task definition
2. Executes the task
3. Reports results
4. If not complete: prompts you to refine PROMPT.md
5. Repeats until success or max iterations

## Usage

```bash
# Basic usage - iterate until done
/iterate-task path/to/PROMPT.md

# With iteration limit
/iterate-task path/to/PROMPT.md --max=5

# Using the template
/iterate-task ~/.claude/templates/iterate-prompt.md
```

## Instructions

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- `prompt_file`: Path to the PROMPT.md file (required)
- `max_iterations`: Number after `--max=` (default: unlimited)

If no prompt file provided, show usage help.

### Step 2: Read and Validate Prompt File

1. Read the prompt file using the Read tool
2. Validate it has required sections:
   - Task description or Objective
   - Success Criteria (recommended)
3. If file doesn't exist, suggest using the template

### Step 3: Execute Iteration

1. Log iteration number
2. Execute the task as described in the prompt
3. Work toward the objective
4. Track what was attempted and results

### Step 4: Evaluate Results

After attempting the task:

**If SUCCESS:**
```markdown
## Iteration Complete

**Iterations:** [N]
**Result:** Success
**Summary:** [What was accomplished]

**Tip:** Run `/extract-learning` to save any discoveries as skills
```

**If PARTIAL/FAILURE:**
```markdown
## Iteration [N] Results

**Status:** [Partial progress / Blocked / Failed]
**Attempted:** [What was tried]
**Outcome:** [What happened]
**Blocker:** [What prevented success]

### Next Steps

1. Edit your PROMPT.md file to address the blocker
2. Add details to the "Previous Attempts" section
3. Refine the "Current Focus" section
4. Run `/iterate-task [path]` again

**Remember:** Tune the prompt, not the code.
```

### Step 5: Track Iteration History

If the prompt file has a "Previous Attempts" section, suggest updating it:

```markdown
## Suggested Update to PROMPT.md

Add to "Previous Attempts":
- Iteration [N]: [What was tried] → [Result]
```

## PROMPT.md Format

Recommended structure for your prompt file:

```markdown
# Task: [Clear Task Title]

## Context
[Project context, relevant background]

## Objective
[What needs to be accomplished - be specific]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Constraints
- [Any constraints or rules to follow]

## Previous Attempts
<!-- Update after each iteration -->
- Attempt 1: [What was tried] → [Result]
- Attempt 2: [Refined approach] → [Result]

## Current Focus
<!-- What to focus on this iteration -->
[Specific aspect to work on]

## Success Criteria
[How to know when the task is complete]
```

## Session Logging

Iterations are logged to `~/.claude/iterate-sessions/` for reference:
- `iterate-[timestamp].log` - Full session log
- Includes: prompt content, attempts, results

## Best Practices

1. **Start specific, then broaden** - Begin with focused objectives
2. **Document failures** - Update "Previous Attempts" after each iteration
3. **Refine, don't restart** - Build on what you learned
4. **Extract learnings** - Run `/extract-learning` after success

## Example Session

```bash
# First iteration
/iterate-task ~/projects/api/PROMPT.md
# Result: Failed - missing authentication

# Edit PROMPT.md to add auth details
# Add to Previous Attempts: "Attempt 1: No auth → 401 errors"
# Update Current Focus: "Add JWT authentication first"

# Second iteration
/iterate-task ~/projects/api/PROMPT.md
# Result: Partial - auth works, validation failing

# Edit PROMPT.md again
# Add to Previous Attempts: "Attempt 2: Auth works → validation errors"
# Update Current Focus: "Add input validation with Zod"

# Third iteration
/iterate-task ~/projects/api/PROMPT.md
# Result: Success!

# Extract what was learned
/extract-learning "JWT auth with Zod validation pattern"
```
