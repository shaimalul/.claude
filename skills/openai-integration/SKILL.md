---
name: openai-integration
description: OpenAI API integration patterns for Chat, Embeddings, and Function Calling with streaming and error handling. Use when integrating OpenAI APIs, implementing chat completions, streaming responses, function calling, or embedding generation.
---

# OpenAI Integration Skill

Apply these patterns when integrating OpenAI APIs.

## Client Setup

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});
```

## Chat Completions

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: userMessage },
  ],
  temperature: 0.7,
  max_tokens: 1000,
});

const content = response.choices[0]?.message?.content ?? '';
```

## Streaming Responses

```typescript
async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

// SSE Controller
@Get('chat/stream')
async streamChat(@Query('message') message: string, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for await (const chunk of this.aiService.streamChat(message)) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
```

## Function Calling

```typescript
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  tools,
  tool_choice: 'auto',
});

if (response.choices[0].finish_reason === 'tool_calls') {
  const toolCall = response.choices[0].message.tool_calls[0];
  const args = JSON.parse(toolCall.function.arguments);
  const result = await executeFunction(toolCall.function.name, args);
  // Continue with tool result...
}
```

## Embeddings

```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: text,
});

const embedding = response.data[0].embedding;

// Batch embeddings
const batchResponse = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: texts, // Array of strings
});

const embeddings = batchResponse.data.map(d => d.embedding);
```

## Error Handling

```typescript
import OpenAI from 'openai';

async function safeChat(messages: Message[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });
    return response.choices[0]?.message?.content ?? '';
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 429:
          throw new Error('Rate limited - try again later');
        case 500:
        case 502:
        case 503:
          throw new Error('OpenAI service unavailable');
        case 400:
          throw new Error('Invalid request');
        case 401:
          throw new Error('Invalid API key');
        default:
          throw error;
      }
    }
    throw error;
  }
}
```

## Caching

```typescript
import { createHash } from 'crypto';

class CachedOpenAI {
  constructor(
    private openai: OpenAI,
    private cache: CacheService,
  ) {}

  async chat(messages: Message[], ttl = 3600): Promise<string> {
    const key = this.hashMessages(messages);
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });
    const content = response.choices[0]?.message?.content ?? '';
    await this.cache.set(key, content, ttl);
    return content;
  }

  private hashMessages(messages: Message[]): string {
    return createHash('sha256')
      .update(JSON.stringify(messages))
      .digest('hex');
  }
}
```

## Checklist

- [ ] API key from environment variable
- [ ] Timeout and retry configuration
- [ ] Streaming for long responses
- [ ] Error handling with specific status codes
- [ ] Caching for repeated queries
- [ ] Token counting for cost management
- [ ] Rate limiting awareness
