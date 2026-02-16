---
name: prompt-engineering
description: Prompt engineering patterns for OpenAI including system prompts, few-shot learning, chain-of-thought, and output formatting. Use when designing prompts for LLMs, implementing few-shot learning, chain-of-thought reasoning, or structured output formatting.
---

# Prompt Engineering Skill

Apply these patterns when designing prompts for LLMs.

## System Prompt Structure

```typescript
const systemPrompt = `You are a [ROLE] for [CONTEXT].

## Your Role
[Clear description of what the AI should do]

## Guidelines
- [Specific behavior 1]
- [Specific behavior 2]
- [Specific behavior 3]

## Response Format
[How responses should be structured]

## Constraints
- [What NOT to do]
- [Boundaries and limitations]

## Examples
[Optional: Brief examples of good responses]`;
```

## Few-Shot Learning

```typescript
const messages = [
  {
    role: 'system',
    content: 'You classify support tickets into categories.',
  },
  // Example 1
  { role: 'user', content: 'I cannot log into my account' },
  { role: 'assistant', content: '{"category": "auth", "priority": "high"}' },
  // Example 2
  { role: 'user', content: 'How do I export my data?' },
  { role: 'assistant', content: '{"category": "question", "priority": "low"}' },
  // Actual input
  { role: 'user', content: userMessage },
];
```

## Chain of Thought

```typescript
const cotPrompt = `Analyze the following and determine the sentiment.

Think through this step by step:
1. Identify key emotional phrases
2. Consider the overall context
3. Weigh positive vs negative indicators
4. Make your final determination

Text: "${text}"

Analysis:`;
```

## JSON Mode

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'Extract structured data. Always respond with valid JSON.',
    },
    {
      role: 'user',
      content: `Extract name, email, phone from: "${text}"`,
    },
  ],
  response_format: { type: 'json_object' },
});
```

## Prompt Templates

```typescript
const templates = {
  summarize: (text: string, maxLength: number) => `
Summarize the following text in ${maxLength} words or less.
Focus on the key points and main takeaways.

Text: ${text}

Summary:`,

  translate: (text: string, targetLang: string) => `
Translate the following text to ${targetLang}.
Preserve the tone and meaning.

Text: ${text}

Translation:`,

  classify: (text: string, categories: string[]) => `
Classify the following text into one of these categories:
${categories.map(c => `- ${c}`).join('\n')}

Text: ${text}

Respond with just the category name.`,
};
```

## Token Optimization

```typescript
// Truncate long inputs
const truncate = (text: string, maxTokens: number): string => {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
};

// Compress context
const compressContext = (docs: string[]): string => {
  return docs
    .map((doc, i) => `[${i + 1}] ${doc.slice(0, 500)}`)
    .join('\n\n');
};
```

## Output Parsing

```typescript
// Parse structured output
const parseJsonResponse = <T>(content: string): T => {
  // Handle markdown code blocks
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  const json = jsonMatch ? jsonMatch[1] : content;
  return JSON.parse(json.trim());
};

// Extract specific format
const extractBullets = (content: string): string[] => {
  return content
    .split('\n')
    .filter(line => line.startsWith('- ') || line.startsWith('* '))
    .map(line => line.slice(2).trim());
};
```

## Checklist

- [ ] Clear role and context in system prompt
- [ ] Specific guidelines for behavior
- [ ] Defined output format
- [ ] Examples for complex tasks (few-shot)
- [ ] Chain of thought for reasoning tasks
- [ ] JSON mode for structured output
- [ ] Input truncation for token limits
