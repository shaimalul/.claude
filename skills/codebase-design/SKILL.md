---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when designing or improving a module's interface, deciding where a seam goes, making code more testable, or when another skill needs the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality).
user-invocable: false
---

# Codebase Design

Design DEEP modules: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. The aim is leverage for callers, locality for maintainers, and testability for everyone.

This file is the single source of truth for the words below. No other skill redefines them.

## Glossary

Use these terms exactly. Do not substitute "component", "service", "API", or "boundary". Consistent language is the whole point.

Module: anything with an interface and an implementation. Deliberately scale-agnostic, so a function, class, package, or tier-spanning slice all qualify. Avoid: unit, component, service.

Interface: everything a caller must know to use the module correctly. The type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics. Avoid: API, signature, which are too narrow because they refer only to the type-level surface.

Implementation: what is inside a module, its body of code. Distinct from Adapter. A thing can be a small adapter with a large implementation (a Postgres repository) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic, "implementation" otherwise.

Depth: leverage at the interface. The amount of behaviour a caller or a test can exercise per unit of interface it has to learn. A module is DEEP when a large amount of behaviour sits behind a small interface, SHALLOW when the interface is nearly as complex as the implementation.

Seam (Michael Feathers): a place where you can alter behaviour without editing in that place. The LOCATION at which a module's interface lives. Where to put the seam is its own design decision, distinct from what goes behind it. Avoid: boundary, which is overloaded with DDD's bounded context.

Adapter: a concrete thing that satisfies an interface at a seam. Describes ROLE (what slot it fills), not substance (what is inside).

Leverage: what callers get from depth. More capability per unit of interface they learn. One implementation pays back across N call sites and M tests.

Locality: what maintainers get from depth. Change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.

## Deep vs Shallow

Deep module, small interface plus lots of implementation:

```
┌─────────────────────┐
│   Small Interface   │  <- Few methods, simple params
├─────────────────────┤
│                     │
│ Deep Implementation │  <- Complex logic hidden
│                     │
└─────────────────────┘
```

Shallow module, large interface plus little implementation. Avoid:

```
┌─────────────────────────────────┐
│       Large Interface           │  <- Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  <- Just passes through
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- Depth is a property of the interface, not the implementation. A deep module can be internally composed of small, swappable parts. They just are not part of the interface. A module can have INTERNAL seams (private to its implementation, used by its own tests) as well as the EXTERNAL seam at its interface
- The deletion test. Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep
- The interface is the test surface. Callers and tests cross the same seam. If you want to test PAST the interface, the module is probably the wrong shape
- One adapter means a hypothetical seam. Two adapters means a real one. Do not introduce a seam unless something actually varies across it

## Designing for Testability

1. Accept dependencies, do not create them

```typescript
// Testable
function processOrder(order: Order, paymentGateway: PaymentGateway) {}

// Hard to test
function processOrder(order: Order) {
  const gateway = new StripeGateway();
}
```

2. Return results, do not produce side effects

```typescript
// Testable
function calculateDiscount(cart: Cart): Discount {}

// Hard to test
function applyDiscount(cart: Cart): void {
  cart.total -= discount;
}
```

3. Small surface area. Fewer methods means fewer tests. Fewer params means simpler test setup

## Relationships

- A Module has exactly one Interface, the surface it presents to callers and tests
- Depth is a property of a Module, measured against its Interface
- A Seam is where a Module's Interface lives
- An Adapter sits at a Seam and satisfies the Interface
- Depth produces Leverage for callers and Locality for maintainers

## Rejected Framings

- Depth as the ratio of implementation lines to interface lines (Ousterhout). Rewards padding the implementation. Use depth-as-leverage instead
- "Interface" as the TypeScript `interface` keyword or a class's public methods. Too narrow. Interface here includes every fact a caller must know
- "Boundary". Overloaded with DDD's bounded context. Say SEAM or INTERFACE

## Going Deeper

- Deepening a cluster given its dependencies: see [DEEPENING.md](./DEEPENING.md) for dependency categories, seam discipline, and replace-do-not-layer testing
- Exploring alternative interfaces: see [DESIGN-IT-TWICE.md](./DESIGN-IT-TWICE.md) for the parallel sub-agent pattern

## Consumers

| Skill | Uses |
| ---------------------- | ------------------------------------------------- |
| `tdd` | The seam definition, and the interface-as-test-surface rule |
| `testing-patterns` | Dependency categories from DEEPENING.md |
| `refactoring-patterns` | The deletion test and deep-vs-shallow judgement |
| `architect-agent` | The whole vocabulary, for design reviews and ADRs |
