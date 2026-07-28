# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [SKILL.md](./SKILL.md): module, interface, seam, adapter.

## Dependency Categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable. Merge the modules and test through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies with a local test stand-in: PGLite for Postgres, an in-memory filesystem, a testcontainer. Deepenable if the stand-in exists. The deepened module is tested with the stand-in running inside the test suite. The seam is internal, so no port appears at the module's external interface.

PREFER a local substitute over a mock whenever one exists. A stand-in runs the real code path; a mock only asserts you called something.

### 3. Remote but owned (ports and adapters)

Your own services across a network boundary: microservices, internal APIs. Define a PORT at the seam. The deep module owns the logic; the transport is injected as an ADAPTER. Tests use an in-memory adapter, production uses an HTTP, gRPC, or queue adapter.

Recommendation shape: define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it is deployed across a network.

### 4. True external (mock)

Third-party services you do not control: Stripe, Twilio, OpenAI. The deepened module takes the external dependency as an injected port; tests provide a mock adapter, or intercept at the HTTP boundary with MSW or nock. See `testing-patterns` for the interception setup.

## Seam Discipline

- One adapter means a hypothetical seam. Two adapters means a real one. Do not introduce a port unless at least two adapters are justified, typically production plus test. A single-adapter seam is just indirection
- Internal seams versus external seams. A deep module can have internal seams, private to its implementation and used by its own tests, as well as the external seam at its interface. Do not expose internal seams through the interface just because tests use them

## Testing Strategy: Replace, Do Not Layer

- Once tests exist at the deepened module's interface, the old unit tests on the shallow modules are waste and should be removed
- Write new tests at the deepened module's interface. The interface is the test surface
- Tests assert on observable outcomes through the interface, not on internal state
- Tests should survive internal refactors because they describe behaviour, not implementation. If a test has to change when the implementation changes, it is testing past the interface
