# Architecture Patterns - Detailed Implementations

## Monolith (Modular)

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

## Microservices

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

## Event-Driven Architecture

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

## CQRS (Command Query Responsibility Segregation)

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
