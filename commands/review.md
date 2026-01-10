# Code Review

I'll review your code for potential issues.

I'll use specialized sub-agents for comprehensive analysis:
- **Security sub-agent**: Credential exposure, input validation, vulnerabilities
- **Performance sub-agent**: Bottlenecks, memory issues, optimization opportunities  
- **Quality sub-agent**: Code complexity, maintainability, best practices
- **Architecture sub-agent**: Layer separation, dependency direction, scalability patterns

I'll examine files using the Read and Grep tools to analyze:
1. **Security Issues** - credential exposure, input validation
2. **Logic Problems** - error handling, edge cases  
3. **Performance Concerns** - inefficient patterns, bottlenecks
4. **Code Quality** - complexity, maintainability

When I find multiple issues, I'll create a todo list to address them systematically.

For each issue, I'll:
- Show exact location with file references
- Explain the problem and potential impact
- Provide specific remediation steps
- Prioritize by severity and effort

After review, I'll provide:
- Prioritized list of findings with detailed descriptions
- Local todo tracking for resolution
- Actionable summary report

**Important**: I will NEVER:
- Add "Co-authored-by" or any Claude signatures
- Add "Created by Claude" or any AI attribution
- Include "Generated with Claude Code" in any output
- Modify repository settings
- Add any AI/assistant signatures or watermarks
- Use emojis in documentation

This focuses on real problems that impact your application's reliability and maintainability.