# Code Review with Project Rules

I'll review your code for potential issues while adhering to your project-specific rules.

First, let me check for project-specific rules:
```bash
find . -name ".cursor" -type d 2>/dev/null | head -5
find . -path "*/.cursor/rules*" -type f 2>/dev/null | head -10
```

If `.cursor/rules` files exist, I'll analyze them to understand:
- Project-specific coding standards
- Framework conventions
- Architecture patterns
- Testing requirements
- Documentation standards

Let me create a checkpoint before detailed analysis:
```bash
git add -A  
git commit -m "Pre-review checkpoint" || echo "No changes to commit"
```

I'll use specialized sub-agents for comprehensive analysis:
- **Cursor-rules-reviewer sub-agent**: Ensures compliance with .cursor/rules standards
- **Security sub-agent**: Credential exposure, input validation, vulnerabilities
- **Performance sub-agent**: Bottlenecks, memory issues, optimization opportunities  
- **Quality sub-agent**: Code complexity, maintainability, best practices
- **Architecture sub-agent**: Layer separation, dependency direction, scalability patterns

I'll examine files using the Read and Grep tools to analyze:
1. **Project Standards Compliance** - adherence to .cursor/rules
2. **Security Issues** - credential exposure, input validation
3. **Logic Problems** - error handling, edge cases  
4. **Performance Concerns** - inefficient patterns, bottlenecks
5. **Code Quality** - complexity, maintainability
6. **Convention Violations** - naming, structure, patterns

When I find multiple issues, I'll create a todo list to address them systematically.

For each issue, I'll:
- Show exact location with file references
- Explain how it violates project rules (if applicable)
- Explain the problem and potential impact
- Provide specific remediation steps that follow project conventions
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

This review ensures code quality while maintaining consistency with your project's established standards and patterns.