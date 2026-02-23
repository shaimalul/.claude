---
name: rgr-patterns
description: Red-Green-Refactor TDD workflow patterns including test-first design, triangulation, transformation priority, and incremental complexity. Use when implementing new features, fixing bugs, or modifying existing logic to ensure test-driven development discipline.
globs: "**/*.ts,**/*.tsx,**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Red-Green-Refactor (RGR) Patterns

Follow RGR when writing new logic or fixing bugs. Load this skill before implementation.

## When to Use RGR

- New functions, hooks, services, components with logic
- Bug fixes (write a test that reproduces the bug first)
- Significant refactors that change behavior
- API endpoint implementation

## When to Skip RGR

- Config/env changes
- Documentation-only changes
- Styling-only changes (CSS/SCSS with no logic)
- Renaming/moving files with no behavior change
- Adding types/interfaces with no runtime code

## The Three Laws

1. Do not write production code unless it makes a failing test pass
2. Do not write more of a test than is sufficient to fail
3. Do not write more production code than is sufficient to pass

## RED Phase: Write a Failing Test

### Start With the Simplest Case

```typescript
// Cycle 1: degenerate case
describe('calculateDiscount', () => {
  it('should return 0 for empty cart', () => {
    expect(calculateDiscount([])).toBe(0);
  });
});

// Cycle 2: next simplest
it('should return 0 when no items qualify', () => {
  const cart = [{ price: 10, category: 'regular' }];
  expect(calculateDiscount(cart)).toBe(0);
});

// Cycle 3: first qualifying case
it('should apply 10% discount for sale items', () => {
  const cart = [{ price: 100, category: 'sale' }];
  expect(calculateDiscount(cart)).toBe(10);
});
```

### Assert-First Design

Write the test from the assertion backward:

1. Write expected outcome: `expect(result).toBe(expectedValue);`
2. Write the action: `const result = functionUnderTest(input);`
3. Write the setup: `const input = createTestInput();`

### Test the Interface, Not the Implementation

```typescript
// Bad: testing internals
it('should call Array.reduce internally', () => {
  const spy = vi.spyOn(Array.prototype, 'reduce');
  calculateTotal(items);
  expect(spy).toHaveBeenCalled();
});

// Good: testing observable behavior
it('should return the sum of all item prices', () => {
  const items = [{ price: 10 }, { price: 20 }, { price: 30 }];
  expect(calculateTotal(items)).toBe(60);
});
```

### Triangulation

Use multiple examples to force generalization:

```typescript
// First test: could be solved with a constant
it('should convert 0 celsius to 32 fahrenheit', () => {
  expect(celsiusToFahrenheit(0)).toBe(32);
});

// Second test: forces the real formula
it('should convert 100 celsius to 212 fahrenheit', () => {
  expect(celsiusToFahrenheit(100)).toBe(212);
});
```

### RED Verification

After writing the test, run it:

```bash
npm test -- --run [test-file]
```

The test MUST fail. If it passes, the behavior already exists - write a different test.

## GREEN Phase: Write Minimal Implementation

### Transformation Priority Premise

Apply transformations in this priority order (simplest first):

| Priority | Transformation | Example |
|----------|---------------|---------|
| 1 | Constant | `return 0;` |
| 2 | Scalar | `return input;` |
| 3 | Conditional | `if (x) return a; return b;` |
| 4 | Iteration | `for (const item of items) {...}` |
| 5 | Collection | `items.filter(...).map(...)` |

### Fake It Till You Make It

When only one test exists, hardcode the return value. The next test will force generalization.

```typescript
// With only one test expecting 32:
const celsiusToFahrenheit = (celsius: number): number => {
  return 32; // Next test will force the real formula
};
```

### Obvious Implementation

When the solution is trivially clear, skip faking:

```typescript
const celsiusToFahrenheit = (celsius: number): number => {
  return celsius * 9 / 5 + 32;
};
```

### GREEN Rules

- Write ONLY the minimum code to make the test pass
- Do NOT add error handling beyond what the test requires
- Do NOT optimize or add untested features
- Follow CLAUDE.md standards (named exports, immutability, no `any`)

### GREEN Verification

After writing the implementation, run ALL tests:

```bash
npm test
```

ALL tests must pass. If they fail, fix the implementation (not the test).

## REFACTOR Phase: Improve While Green

### What to Refactor

- Duplication in production code
- Long functions (> 30 lines per CLAUDE.md)
- Complex conditionals that can be simplified
- Missing abstractions the tests reveal
- Variable/function naming improvements
- Extract helpers for reuse

### What NOT to Refactor

- Do NOT change test assertions or expected behavior
- Do NOT add new features (that requires a new RED phase)
- Do NOT change the public API unless tests still pass
- Do NOT optimize prematurely

### Extract Helper Pattern

```typescript
// Before (GREEN result):
const processOrder = (order: Order): ProcessedOrder => {
  const subtotal = order.items.reduce((sum, item) =>
    sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const discount = order.items
    .filter(item => item.category === 'sale')
    .reduce((sum, item) =>
      sum + item.price * item.quantity * 0.1, 0);
  return { ...order, subtotal, tax, discount, total: subtotal + tax - discount };
};

// After (REFACTOR result - same tests pass):
const calculateSubtotal = (items: OrderItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const calculateTax = (subtotal: number): number =>
  subtotal * TAX_RATE;

const calculateDiscount = (items: OrderItem[]): number =>
  items
    .filter(item => item.category === 'sale')
    .reduce((sum, item) => sum + item.price * item.quantity * SALE_DISCOUNT_RATE, 0);

const processOrder = (order: Order): ProcessedOrder => {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const discount = calculateDiscount(order.items);
  return { ...order, subtotal, tax, discount, total: subtotal + tax - discount };
};
```

### REFACTOR Verification

After EACH refactoring change, run tests:

```bash
npm test
```

All tests must STILL pass. If a test breaks, revert the change and try differently.

## Cycle Planning

| Scenario | RED-GREEN Cycles | Rationale |
|----------|-----------------|-----------|
| Simple utility function | 1-2 | One test often enough |
| Function with multiple branches | 3-5 | Each branch needs a test |
| Component with states | 3-4 | Loading, success, error, empty |
| Service with validation | 2-3 | Happy path + edge cases |
| Bug fix | 1 | Write test that reproduces bug, then fix |

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Writing test after code | Confirmation bias | Strict RED-first |
| Too-large test steps | Hard to debug | Smaller increments |
| Skipping REFACTOR | Tech debt accumulates | Budget time for cleanup |
| Testing trivial code | Wasted effort | Focus on logic |
| Coupling tests to each other | Order-dependent failures | Each test independent |
| Testing implementation details | Brittle tests | Test observable behavior |

## RGR for Bug Fixes

1. RED: Write a test that reproduces the exact bug
2. Verify the test fails (confirms the bug exists)
3. GREEN: Fix the bug with minimal code change
4. Verify ALL tests pass (bug is fixed, nothing else broke)
5. REFACTOR: Clean up if needed

```typescript
// RED: reproduce the bug
it('should handle negative quantities without crashing', () => {
  const cart = [{ price: 10, quantity: -1 }];
  expect(() => calculateTotal(cart)).not.toThrow();
  expect(calculateTotal(cart)).toBe(0);
});

// GREEN: fix it
const calculateTotal = (items: CartItem[]): number =>
  items
    .filter(item => item.quantity > 0)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
```
