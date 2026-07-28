---
name: llm-integration
description: OpenAI SDK integration patterns covering service setup, streaming, function calling, embeddings, error handling, cost optimization, and AI service architecture. Use when writing or reviewing code that calls an LLM provider, streams model responses, or budgets token cost.
user-invocable: false
---

# LLM Integration Skill

Apply these patterns when integrating an LLM provider into a backend service.

NOTE: Model names in examples below are illustrative and may be outdated. Always verify current model identifiers via WebSearch.

## Service Setup

```typescript
// services/openai.service.ts
import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3,
    });
  }

  async chat(messages: OpenAI.ChatCompletionMessageParam[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
```

## Streaming Responses

```typescript
// services/openai.service.ts
async *chatStream(
  messages: OpenAI.ChatCompletionMessageParam[]
): AsyncGenerator<string> {
  const stream = await this.client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Controller with SSE
@Get('chat/stream')
@Header('Content-Type', 'text/event-stream')
@Header('Cache-Control', 'no-cache')
@Header('Connection', 'keep-alive')
async streamChat(@Query('message') message: string, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const messages = [{ role: 'user' as const, content: message }];

  for await (const chunk of this.openaiService.chatStream(messages)) {
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
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, e.g., "San Francisco, CA"',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
];

async chatWithTools(message: string): Promise<string> {
  const response = await this.client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }],
    tools,
    tool_choice: 'auto',
  });

  const choice = response.choices[0];

  if (choice.finish_reason === 'tool_calls') {
    const toolCalls = choice.message.tool_calls ?? [];
    const toolResults = await Promise.all(
      toolCalls.map(async (call) => ({
        role: 'tool' as const,
        tool_call_id: call.id,
        content: await this.executeFunction(call.function.name, JSON.parse(call.function.arguments)),
      }))
    );

    // Continue conversation with tool results
    return this.chat([
      { role: 'user', content: message },
      choice.message,
      ...toolResults,
    ]);
  }

  return choice.message.content ?? '';
}
```

## Embeddings for RAG

```typescript
// services/embedding.service.ts
@Injectable()
export class EmbeddingService {
  constructor(private readonly openai: OpenAIService) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.openai.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

## Error Handling

```typescript
import OpenAI from 'openai';

async safeChat(messages: OpenAI.ChatCompletionMessageParam[]): Promise<string> {
  try {
    return await this.chat(messages);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 429:
          // Rate limit - implement exponential backoff
          await this.sleep(Math.pow(2, retryCount) * 1000);
          return this.safeChat(messages, retryCount + 1);
        case 500:
        case 502:
        case 503:
          // Server error - retry
          if (retryCount < 3) {
            await this.sleep(1000);
            return this.safeChat(messages, retryCount + 1);
          }
          throw new Error('OpenAI service unavailable');
        case 400:
          throw new Error('Invalid request to OpenAI');
        case 401:
          throw new Error('OpenAI API key invalid');
        default:
          throw error;
      }
    }
    throw error;
  }
}

private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

Use typed errors for AI-specific failures rather than throwing raw strings:

```typescript
// errors/ai.errors.ts
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

export class TokenLimitExceededError extends AIServiceError {
  constructor(tokens: number, limit: number) {
    super(
      `Token limit exceeded: ${tokens}/${limit}`,
      'TOKEN_LIMIT_EXCEEDED',
      false,
    );
  }
}

export class RateLimitError extends AIServiceError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter}s`,
      'RATE_LIMIT_EXCEEDED',
      true,
    );
  }
}
```

## Cost Optimization

### Token Counting

```typescript
import { encoding_for_model } from 'tiktoken';

function countTokens(text: string, model = 'gpt-4o'): number {
  const encoding = encoding_for_model(model);
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
}

// Estimate cost before API call - verify current pricing via WebSearch, it changes
function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * 0.005;
  const outputCost = (outputTokens / 1000) * 0.015;
  return inputCost + outputCost;
}
```

### Caching Responses

```typescript
import { createHash } from 'crypto';

@Injectable()
export class CachedOpenAIService {
  constructor(
    private readonly openai: OpenAIService,
    private readonly cache: CacheService,
  ) {}

  async cachedChat(
    messages: OpenAI.ChatCompletionMessageParam[],
    ttl = 3600,
  ): Promise<string> {
    const cacheKey = this.hashMessages(messages);

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await this.openai.chat(messages);
    await this.cache.set(cacheKey, response, ttl);

    return response;
  }

  private hashMessages(messages: OpenAI.ChatCompletionMessageParam[]): string {
    const content = JSON.stringify(messages);
    return createHash('sha256').update(content).digest('hex');
  }
}
```

## Rate Limiting for AI APIs

```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,
  reservoir: 100,
  reservoirRefreshInterval: 60 * 1000,
  reservoirRefreshAmount: 100,
});

async function rateLimitedChat(messages: Message[]): Promise<string> {
  return limiter.schedule(() => openai.chat(messages));
}
```

## Config Management for API Keys

```typescript
// config/ai.config.ts
export const aiConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  },
  models: {
    default: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
    complex: 'gpt-4o',
  },
} as const;

// Validate on startup
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}
```

## AI Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   AI Controller                         │
│  - Request validation                                   │
│  - Rate limiting                                        │
│  - Response streaming                                   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   AI Service                            │
│  - Prompt construction                                  │
│  - Model selection                                      │
│  - Response parsing                                     │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   OpenAI     │ │   Cache     │ │   Vector    │
│   Client     │ │   Layer     │ │   Store     │
└──────────────┘ └─────────────┘ └─────────────┘
```

## Checklist

- [ ] Error handling with retries and typed errors implemented
- [ ] Streaming used for long responses
- [ ] Responses cached when appropriate to reduce cost
- [ ] Tokens counted and cost estimated before expensive operations
- [ ] Rate limiting in place to stay within API quotas
- [ ] Model size matched to task complexity (mini for simple, full for complex)
- [ ] JSON mode used when structured output is needed
- [ ] Fallback behavior defined for when the AI service is unavailable
- [ ] No `console.log` in production - use proper logging services
- [ ] Model names and pricing verified via WebSearch, not assumed from training data
