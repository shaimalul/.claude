# Reliability & Integration Patterns

## Caching Strategies

```typescript
// Cache-Aside (most common)
async function getData(key: string): Promise<Data> {
  // 1. Check cache
  const cached = await cache.get(key);
  if (cached) return cached;

  // 2. Load from database
  const data = await db.query(key);

  // 3. Populate cache
  await cache.set(key, data, { ttl: 3600 });

  return data;
}

// Read-Through (cache handles loading)
// Write-Through (write to cache + db synchronously)
// Write-Behind (write to cache, async to db)
```

**Cache invalidation strategies:**
- **TTL-based**: Simple, eventual consistency
- **Event-based**: Invalidate on writes
- **Versioned keys**: `user:123:v2` - new version = new key

## Database Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCALING                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Read Replicas  │    Sharding     │    Partitioning         │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Scale reads     │ Scale writes    │ Scale storage           │
│ Leader-follower │ By tenant/key   │ By time/range           │
│ Async replication│ Cross-shard    │ Same database           │
│                 │ queries complex │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

**Sharding key selection:**
- High cardinality (many unique values)
- Even distribution (avoid hot spots)
- Query patterns (minimize cross-shard)
- Common choices: tenant_id, user_id, date

## Saga Pattern (Distributed Transactions)

**Use when:** Multiple services must coordinate a transaction

```
┌─────────────────────────────────────────────────────────────┐
│                    SAGA: Order Processing                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Create  │──▶│ Reserve │──▶│ Process │──▶│  Ship   │    │
│  │ Order   │   │ Stock   │   │ Payment │   │  Order  │    │
│  └────┬────┘   └────┬────┘   └────┬────┘   └─────────┘    │
│       │             │             │                        │
│       │ Compensate  │ Compensate  │ Compensate            │
│       ▼             ▼             ▼                        │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                  │
│  │ Cancel  │◀──│ Release │◀──│ Refund  │                  │
│  │ Order   │   │ Stock   │   │ Payment │                  │
│  └─────────┘   └─────────┘   └─────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Key: Each step has a compensating action for rollback
```

**Saga types:**
- **Choreography**: Services react to events (simpler, harder to track)
- **Orchestration**: Central coordinator manages flow (complex, easier to track)

## Outbox Pattern (Reliable Events)

```typescript
// Problem: Need to update DB and publish event atomically

// Solution: Outbox pattern
async function createOrder(order: Order): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Write to main table
    await tx.insert('orders', order);

    // 2. Write event to outbox table (same transaction)
    await tx.insert('outbox', {
      eventType: 'OrderCreated',
      payload: order,
      createdAt: new Date(),
    });
  });

  // 3. Separate process polls outbox and publishes events
}
```

## Circuit Breaker

```
┌─────────────────────────────────────────────────────────────┐
│                   CIRCUIT BREAKER STATES                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌────────┐    failures    ┌────────┐    timeout    ┌────────┐
│   │ CLOSED │──────────────▶│  OPEN  │─────────────▶│ HALF   │
│   │        │   > threshold │        │               │ OPEN   │
│   └────────┘               └────────┘               └───┬────┘
│       ▲                                                 │
│       │                     success                     │
│       └─────────────────────────────────────────────────┘
│                                                             │
│   CLOSED: Normal operation, requests pass through          │
│   OPEN: Requests fail fast, no calls to downstream         │
│   HALF-OPEN: Limited requests to test recovery             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelay: number }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Exponential backoff with jitter
      const delay = options.baseDelay * Math.pow(2, attempt);
      const jitter = delay * 0.1 * Math.random();
      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

// Usage
const result = await withRetry(() => callExternalApi(), {
  maxRetries: 3,
  baseDelay: 1000, // 1s, 2s, 4s
});
```

## Bulkhead Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    BULKHEAD ISOLATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ Thread Pool │   │ Thread Pool │   │ Thread Pool │       │
│  │ Service A   │   │ Service B   │   │ Service C   │       │
│  │ (10 threads)│   │ (5 threads) │   │ (8 threads) │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                             │
│  Benefit: Service A failure doesn't exhaust all threads    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Health Checks

```typescript
// Liveness: Is the process running?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness: Can the service handle requests?
app.get('/health/ready', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkDependencies(),
  ]);

  const healthy = checks.every((c) => c.healthy);
  res.status(healthy ? 200 : 503).json({ checks });
});
```
