---
name: iterate-task
description: Run a task iteratively until complete, following the Ralph approach (tune the prompt, not the code)
argument-hint: [path-to-PROMPT.md] [--max=N]
disable-model-invocation: true
---

# Iterate Task

Run a task iteratively until complete, following the Ralph approach.

**Arguments:** `$ARGUMENTS` - Path to PROMPT.md file (required), optionally with `--max=N` for iteration limit

## Philosophy

**When things go wrong, tune the prompt - not the code.**

This skill implements the Ralph approach: continuous iteration with prompt refinement. Each iteration learns from the previous. When something fails, you edit the prompt file to provide clearer instructions.

## Usage

```bash
/iterate-task path/to/PROMPT.md
/iterate-task path/to/PROMPT.md --max=5
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
- Iteration [N]: [What was tried] -> [Result]
```

## Best Practices

1. **Start specific, then broaden** - Begin with focused objectives
2. **Document failures** - Update "Previous Attempts" after each iteration
3. **Refine, don't restart** - Build on what you learned
4. **Extract learnings** - Run `/extract-learning` after success
