---
name: architect
description: System architecture and design patterns including ADRs, scalability, reliability, and integration patterns for principal-level design decisions
---

# Architect Skill

Apply these patterns when making system design decisions, reviewing architecture, or documenting technical choices.

## System Design Framework

When analyzing any system design problem:

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUIREMENTS ANALYSIS                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Functional    │ Non-Functional  │    Constraints          │
│   (Features)    │ (Quality Attrs) │    (Limits)             │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • User stories  │ • Scalability   │ • Budget                │
│ • Use cases     │ • Availability  │ • Timeline              │
│ • API contracts │ • Latency       │ • Team skills           │
│                 │ • Security      │ • Existing systems      │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TRADE-OFF ANALYSIS                        │
│  Consider: CAP theorem, consistency vs availability,         │
│  complexity vs flexibility, build vs buy                     │
└─────────────────────────────────────────────────────────────┘
```

### Non-Functional Requirements (NFRs) Template

| NFR | Question | Metric |
|-----|----------|--------|
| **Scalability** | How many concurrent users? | Target: X users, Y RPS |
| **Availability** | What uptime is required? | Target: 99.9% (8.76h downtime/year) |
| **Latency** | What response time is acceptable? | P95 < 200ms, P99 < 500ms |
| **Throughput** | How many requests per second? | Target: X RPS |
| **Data Volume** | How much data stored/processed? | X GB/day, Y TB total |
| **Security** | What compliance is required? | SOC2, GDPR, HIPAA |

## Architecture Decision Records (ADRs)

**Always document significant decisions using ADRs.**

### ADR Template

```markdown
# ADR-001: [Short Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Context
[What is the issue that we're seeing that motivates this decision?]

## Decision
[What is the change that we're proposing and/or doing?]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Drawback 1]
- [Drawback 2]

### Risks
- [Risk and mitigation]
```

### ADR Example

```markdown
# ADR-003: Use PostgreSQL for Primary Database

## Status
Accepted

## Context
We need a primary database for our application that supports:
- Complex queries with joins
- ACID transactions
- JSON document storage for flexible schemas
- Strong consistency guarantees

Team has experience with relational databases. Expected data volume: 100GB in year 1.

## Decision
Use PostgreSQL as the primary database.

## Consequences

### Positive
- Mature, well-documented technology
- Excellent JSON support (JSONB)
- Strong community and tooling
- Team familiarity reduces onboarding time

### Negative
- Horizontal scaling requires additional tools (Citus, read replicas)
- May be overkill for simple key-value access patterns

### Risks
- If we exceed 1TB, we'll need to implement sharding strategy
  Mitigation: Design with partition keys from the start
```

## Architecture Patterns

### Decision Matrix

| Pattern | Best For | Avoid When | Complexity |
|---------|----------|------------|------------|
| **Monolith** | Small teams, MVPs, simple domains | Need independent scaling | Low |
| **Microservices** | Large teams, complex domains | Small team, unclear boundaries | High |
| **Event-Driven** | Async workflows, decoupling | Simple CRUD, strong consistency | Medium |
| **Serverless** | Variable load, event handlers | Long-running, predictable load | Medium |

### Monolith (Modular)

**When to use:**
- Team size < 10 developers
- Domain is well-understood
- Deployment simplicity is priority
- MVP or early-stage product

```
┌─────────────────────────────────────────────┐
│              MONOLITH APPLICATION           │
├─────────────┬─────────────┬─────────────────┤
│   Module A  │   Module B  │    Module C     │
│  (Users)    │  (Orders)   │   (Products)    │
├─────────────┴─────────────┴─────────────────┤
│           Shared Database Layer             │
├─────────────────────────────────────────────┤
│              Single Database                │
└─────────────────────────────────────────────┘

Key: Keep modules loosely coupled for future extraction
```

**Migration path (Strangler Fig):**
1. Identify bounded context for extraction
2. Create new service with its own database
3. Route traffic gradually (feature flags)
4. Remove old code when fully migrated

### Microservices

**When to use:**
- Team size > 10 developers
- Need independent deployment/scaling
- Multiple bounded contexts
- Polyglot persistence beneficial

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Service A│    │ Service B│    │ Service C│
│ (Users)  │    │ (Orders) │    │(Products)│
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
│   DB A   │    │   DB B   │    │   DB C   │
└──────────┘    └──────────┘    └──────────┘

Rule: Each service owns its data (no shared databases)
```

**Service boundaries checklist:**
- [ ] Single business capability
- [ ] Autonomous team can own it
- [ ] Minimal sync calls to other services
- [ ] Can be deployed independently
- [ ] Has its own data store

### Event-Driven Architecture

**When to use:**
- Asynchronous workflows
- Need to decouple producers/consumers
- Event sourcing beneficial
- Multiple consumers for same event

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│ Producer │────▶│  Event Bus  │────▶│ Consumer │
└──────────┘     │ (Kafka/SQS) │     └──────────┘
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │ Consumer 2  │
                 └─────────────┘

Pattern: Publish domain events, not integration events
```

**Event design principles:**
- Events are immutable facts
- Include enough context for consumers
- Version events for schema evolution
- Use past tense: `OrderPlaced`, `UserCreated`

### CQRS (Command Query Responsibility Segregation)

**When to use:**
- Read and write patterns differ significantly
- Need optimized read models
- Event sourcing is in place

```
┌─────────────┐                 ┌─────────────┐
│   Command   │                 │    Query    │
│   (Write)   │                 │   (Read)    │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ▼                               ▼
┌─────────────┐    Events     ┌─────────────┐
│ Write Model │──────────────▶│ Read Model  │
│ (Normalized)│               │(Denormalized)│
└─────────────┘               └─────────────┘
```

## Scalability Patterns

### Scaling Decision Matrix

| Strategy | Use When | Limitations |
|----------|----------|-------------|
| **Vertical** | Quick fix, stateful apps | Hardware limits, cost |
| **Horizontal** | Stateless services, high load | Complexity, state management |
| **Caching** | Read-heavy, expensive queries | Invalidation complexity |
| **Sharding** | Large datasets, write-heavy | Cross-shard queries |

### Caching Strategies

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

### Database Scaling

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

## Integration Patterns

### Synchronous Communication

| Protocol | Best For | Trade-offs |
|----------|----------|------------|
| **REST** | CRUD, public APIs | Verbose, no streaming |
| **gRPC** | Internal services, streaming | Binary, requires tooling |
| **GraphQL** | Flexible clients, aggregation | Complexity, caching harder |

### Asynchronous Communication

```
┌──────────────────────────────────────────────────────────────┐
│               ASYNC PATTERN SELECTION                         │
├─────────────────┬────────────────────────────────────────────┤
│ Message Queue   │ Point-to-point, work distribution         │
│ (SQS, RabbitMQ) │ One consumer processes each message       │
├─────────────────┼────────────────────────────────────────────┤
│ Pub/Sub         │ Fan-out, multiple consumers               │
│ (Kafka, SNS)    │ All subscribers receive all messages      │
├─────────────────┼────────────────────────────────────────────┤
│ Event Stream    │ Event sourcing, replay capability         │
│ (Kafka, Kinesis)│ Ordered, persistent log                   │
└─────────────────┴────────────────────────────────────────────┘
```

### Saga Pattern (Distributed Transactions)

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

### Outbox Pattern (Reliable Events)

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

## Reliability Patterns

### Circuit Breaker

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

### Retry with Exponential Backoff

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

### Bulkhead Pattern

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

### Health Checks

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

## Design Patterns

### Strategy Pattern for Complex Conditionals

When you see nested if/else or switch statements with item-type-specific logic:

```typescript
interface ItemUpdater {
  update(item: Item): void;
}

class NormalItemUpdater implements ItemUpdater {
  update(item: Item) { /* ... */ }
}

class SpecialItemUpdater implements ItemUpdater {
  update(item: Item) { /* ... */ }
}

const getUpdater = (type: string): ItemUpdater => {
  const updaters: Record<string, ItemUpdater> = {
    'special': new SpecialItemUpdater(),
  };
  return updaters[type] ?? new NormalItemUpdater();
};

// Clean usage
items.forEach(item => getUpdater(item.type).update(item));
```

**When to use:**
- Multiple item types with different behaviors
- Logic for each type is substantial (not just one-liners)
- New types are likely to be added
- Need to test each strategy independently

### AHA - Avoid Hasty Abstractions

**Start with WET (Write Everything Twice), move to DRY only when patterns are stable.**

```typescript
// Bad - premature abstraction with too many variants
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isFullWidth,
  isLoading,
  // ... 10 more props for edge cases
}) => {
  // Complex conditional logic
};

// Good - specific components for specific use cases
const PrimaryButton = ({ children, onClick }: ButtonBaseProps) => (
  <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={onClick}>
    {children}
  </button>
);

const LoadingButton = ({ children, isLoading }: LoadingButtonProps) => (
  <button className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isLoading}>
    {isLoading ? <Spinner /> : children}
  </button>
);
```

**Decision Framework:**
1. Will this abstraction simplify the codebase?
2. Is the pattern stable and unlikely to diverge?
3. Would a new team member understand it easily?
4. If "no" to any - keep code WET

**The Rule of Three:**
- First time: Write the code
- Second time: Note the duplication, but write it again
- Third time: Now consider abstracting (patterns are clearer)

## Checklist

### Before Design Review
- [ ] NFRs documented with specific metrics
- [ ] Trade-offs explicitly stated
- [ ] ADR written for significant decisions
- [ ] Component diagram created

### Architecture Quality
- [ ] Single responsibility per service/module
- [ ] Loose coupling between components
- [ ] Data ownership is clear (no shared databases)
- [ ] Failure modes identified and handled

### Scalability
- [ ] Horizontal scaling path identified
- [ ] Caching strategy defined
- [ ] Database scaling approach documented
- [ ] Load testing plan exists

### Reliability
- [ ] Circuit breakers for external calls
- [ ] Retry logic with backoff
- [ ] Health checks implemented
- [ ] Graceful degradation defined

### Observability
- [ ] Metrics collected (latency, errors, throughput)
- [ ] Distributed tracing configured
- [ ] Logging standards followed
- [ ] Alerting thresholds defined
