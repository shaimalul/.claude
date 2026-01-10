# Code Review with Project Agents

I'll review your code changes using project-specific agents from `.claude/agents`.

First, let me discover project-specific agents:
```bash
find . -path "*/.claude/agents/*.md" -type f 2>/dev/null | head -20
ls -la .claude/agents/ 2>/dev/null || echo "No .claude/agents directory found"
```

I'll also check for `.cursor/rules` to understand project standards:
```bash
find . -path "*/.cursor/rules*" -type f 2>/dev/null | head -10
```

Let me analyze what changes you've made:
```bash
git status
git diff --stat
```

Creating a checkpoint before review:
```bash
git add -A  
git commit -m "Pre-review checkpoint" || echo "No changes to commit"
```

I'll use specialized agents for comprehensive analysis:

**Project-Specific Agents** (from .claude/agents):
- I'll read and utilize any custom agents defined in your project
- Each agent will review changes according to its specific expertise
- Agents will be launched as sub-agents to analyze your code

**Default Review Agents**:
- **cursor-rules-reviewer**: Ensures compliance with .cursor/rules standards
- **standards-enforcer**: Comprehensive coding standards validation
- **Security sub-agent**: Credential exposure, input validation, vulnerabilities
- **Performance sub-agent**: Bottlenecks, memory issues, optimization opportunities  
- **Quality sub-agent**: Code complexity, maintainability, best practices
- **Architecture sub-agent**: Layer separation, dependency direction, scalability patterns

I'll examine your changes to analyze:
1. **Project Agent Concerns** - issues identified by your custom agents
2. **Standards Compliance** - adherence to .cursor/rules and project conventions
3. **Security Issues** - credential exposure, input validation
4. **Logic Problems** - error handling, edge cases  
5. **Performance Concerns** - inefficient patterns, bottlenecks
6. **Code Quality** - complexity, maintainability

For each custom agent found, I'll:
- Read the agent definition from .claude/agents/
- Launch it as a sub-agent to review your changes
- Incorporate its findings into the overall review

When issues are found, I'll create a todo list to address them systematically.

For each issue, I'll:
- Show exact location with file references
- Explain which agent identified the issue
- Describe the problem and potential impact
- Provide specific remediation steps following project conventions
- Prioritize by severity and effort

After review, I'll ask: "Create GitHub issues for critical findings?"
- Yes: I'll create prioritized issues with detailed descriptions
- Todos only: I'll maintain local tracking for resolution
- Summary: I'll provide actionable report

**Important**: I will NEVER:
- Add "Co-authored-by" or any Claude signatures to commits
- Add "Created by Claude" or any AI attribution to issues
- Include "Generated with Claude Code" in any output
- Modify git config or repository settings
- Add any AI/assistant signatures or watermarks
- Use emojis in commits, PRs, issues, or git-related content

This review leverages your project's custom agents to ensure code quality while maintaining consistency with established standards and patterns.