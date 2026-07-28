# CONTEXT.md Format

`CONTEXT.md` is a glossary and nothing else. No implementation details, no specs, no scratch notes.

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
A customer's request for goods, from submission until it is fulfilled or cancelled.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- Be opinionated. When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`
- Keep definitions tight. One or two sentences max. Define what it IS, not what it does
- Only include terms specific to this project's context. General programming concepts (timeouts, error types, utility patterns) do not belong even when the project uses them heavily. Before adding a term, ask: is this unique to this context, or a general programming concept? Only the former belongs
- Group terms under subheadings when natural clusters emerge. A flat list is fine when all terms belong to one cohesive area
- Flag conflicts explicitly. When a term is used ambiguously and the ambiguity is not yet resolved, record it under a "Flagged ambiguities" heading with the competing readings

## Single vs Multi-Context Repos

Single context, which is most repos: one `CONTEXT.md` at the repo root.

Multiple contexts: a `CONTEXT-MAP.md` at the repo root lists the contexts, where they live, and how they relate:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md) - manages warehouse picking and shipping

## Relationships

- Ordering to Fulfillment: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- Fulfillment to Billing: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- Ordering and Billing: shared types for `CustomerId` and `Money`
```

Infer which structure applies:

- If `CONTEXT-MAP.md` exists, read it to find the contexts
- If only a root `CONTEXT.md` exists, single context
- If neither exists, create a root `CONTEXT.md` lazily when the first term resolves

When multiple contexts exist, infer which one the current topic relates to. If unclear, ask.
