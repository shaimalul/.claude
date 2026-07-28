---
name: architect
description: System architecture and design patterns including ADRs, scalability, reliability, and integration patterns for principal-level design decisions. Use when making architectural decisions, writing ADRs, designing for scalability, or reviewing system integration patterns.
user-invocable: false
---

# Architect Skill

Apply these patterns when making system design decisions, reviewing architecture, or documenting technical choices.

Detailed implementations are in the reference directory:

- [reference/patterns.md](reference/patterns.md) - Monolith, microservices, event-driven, and CQRS pattern details
- [reference/reliability.md](reference/reliability.md) - Caching, database scaling, saga, circuit breaker, retry, health checks

---

## System Design Framework

When analyzing any system design problem:

1. Requirements Analysis: Functional (features), Non-Functional (quality attributes), Constraints (limits)
2. Trade-off Analysis: CAP theorem, consistency vs availability, complexity vs flexibility, build vs buy

### Non-Functional Requirements (NFRs) Template

| NFR | Question | Metric |
|-----|----------|--------|
| Scalability | How many concurrent users? | Target: X users, Y RPS |
| Availability | What uptime is required? | Target: 99.9% (8.76h downtime/year) |
| Latency | What response time is acceptable? | P95 < 200ms, P99 < 500ms |
| Throughput | How many requests per second? | Target: X RPS |
| Data Volume | How much data stored/processed? | X GB/day, Y TB total |
| Security | What compliance is required? | SOC2, GDPR, HIPAA |

## Architecture Decision Records (ADRs)

Always document significant decisions using ADRs.

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

### Negative
- [Drawback 1]

### Risks
- [Risk and mitigation]
```

## Architecture Pattern Selection

| Pattern | Best For | Avoid When | Complexity |
|---------|----------|------------|------------|
| Monolith | Small teams, MVPs, simple domains | Need independent scaling | Low |
| Microservices | Large teams, complex domains | Small team, unclear boundaries | High |
| Event-Driven | Async workflows, decoupling | Simple CRUD, strong consistency | Medium |
| Serverless | Variable load, event handlers | Long-running, predictable load | Medium |

Detailed pattern descriptions with diagrams: [reference/patterns.md](reference/patterns.md)

## Scalability Decision Matrix

| Strategy | Use When | Limitations |
|----------|----------|-------------|
| Vertical | Quick fix, stateful apps | Hardware limits, cost |
| Horizontal | Stateless services, high load | Complexity, state management |
| Caching | Read-heavy, expensive queries | Invalidation complexity |
| Sharding | Large datasets, write-heavy | Cross-shard queries |

## Integration Patterns

### Synchronous Communication

| Protocol | Best For | Trade-offs |
|----------|----------|------------|
| REST | CRUD, public APIs | Verbose, no streaming |
| gRPC | Internal services, streaming | Binary, requires tooling |
| GraphQL | Flexible clients, aggregation | Complexity, caching harder |

### Asynchronous Communication

| Pattern | Use Case |
|---------|----------|
| Message Queue (SQS, RabbitMQ) | Point-to-point, work distribution |
| Pub/Sub (Kafka, SNS) | Fan-out, multiple consumers |
| Event Stream (Kafka, Kinesis) | Event sourcing, replay capability |

Detailed implementations (saga, outbox, circuit breaker, retry, health checks): [reference/reliability.md](reference/reliability.md)

## Design Patterns

### Strategy Pattern for Complex Conditionals

When you see nested if/else or switch statements with item-type-specific logic:

```typescript
interface ItemUpdater {
  update(item: Item): void;
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

**When to use:** Multiple item types with different behaviors, substantial per-type logic, new types likely, need independent testing.

### AHA - Avoid Hasty Abstractions

Start with WET (Write Everything Twice), move to DRY only when patterns are stable.

**The Rule of Three:**
- First time: Write the code
- Second time: Note the duplication, but write it again
- Third time: Now consider abstracting (patterns are clearer)

**Decision Framework:**
1. Will this abstraction simplify the codebase?
2. Is the pattern stable and unlikely to diverge?
3. Would a new team member understand it easily?
4. If "no" to any - keep code WET

## Checklists

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
