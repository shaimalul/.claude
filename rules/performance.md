# Performance Optimization

## Model Selection Strategy

See `rules/models.md` - the single source of truth for tier definitions and the per-agent and per-skill assignment tables.

Never hardcode a model version anywhere. Reference tiers by alias (`opus`, `sonnet`, `haiku`) only.

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Strategic Compaction

Use `/compact` at logical boundaries:
- After exploration, before execution
- After completing a milestone, before starting next
- When context feels stale or repetitive

## Ultrathink + Plan Mode

For complex tasks requiring deep reasoning:
1. Use `ultrathink` for enhanced thinking
2. Enable **Plan Mode** for structured approach
3. "Rev the engine" with multiple critique rounds
4. Use split role sub-agents for diverse analysis

## Build Troubleshooting

If build fails:
1. Use **bug-finder-agent** agent for root cause analysis
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix
