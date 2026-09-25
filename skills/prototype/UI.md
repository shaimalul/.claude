# UI Prototype

Generate several RADICALLY different UI variations on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), and the rest are thrown away.

If the question is about logic or state rather than what something looks like, use [LOGIC.md](LOGIC.md) instead.

## When This Is The Right Shape

- "What should this page look like?"
- "I want to see a few options for this dashboard before committing"
- "Try a different layout for the settings screen"
- Any time the user would otherwise spend a day choosing between three vague mockups in their head

## Two Sub-Shapes

A UI prototype is far easier to judge when it butts up against the rest of the app: real header, real sidebar, real data, real density. An empty route is a vacuum where every variant looks fine. STRONGLY prefer sub-shape A.

### Sub-Shape A: Existing Page (Default)

Variants render on the SAME route, gated by a `?variant=` search param. Existing data fetching, params, and auth all stay; only the rendering swaps. Something that does not have a page yet but would naturally live inside one (a new dashboard section, a new settings card, a new step in a flow) is still sub-shape A: mount the variants inside the host page.

### Sub-Shape B: New Page (Last Resort)

Only when the thing genuinely has no existing page to live in. Create a throwaway route following the project's routing convention, with `prototype` in the path or filename, and the same `?variant=` pattern. Before choosing B, sanity-check once more that no existing page could host it.

The floating bar is identical in both.

## Process

### 1. State The Question And Pick N

Default to 3 variants, cap at 5: past that they stop being radically different and become noise. Write the plan in one line at the top of the switcher file:

```tsx
// PROTOTYPE: three variants of the settings page, switchable via ?variant=, on the existing /settings route
```

### 2. Generate Radically Different Variants

Hold each variant to the page's purpose and data, the project's component library and design tokens (see `design-system-patterns`), and a clear named export: `VariantA`, `VariantB`, `VariantC`.

Variants must be STRUCTURALLY different: different layout, information hierarchy, and primary affordance, not different colours. Three slightly tweaked card grids is wallpaper. If two drafts come out too similar, redo one with explicit "do not use a card grid" guidance.

### 3. Wire Them Together

One switcher on the route. Adapt to the project's framework:

```tsx
// Good - one switcher, existing data fetching stays above it
const variant = searchParams.get('variant') ?? 'A';

return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A', 'B', 'C']} current={variant} />
  </>
);
```

### 4. Build The Floating Switcher

A small fixed bar at the bottom centre with a left arrow, the current variant label (key plus name if exported, e.g. `B (Sidebar layout)`), and a right arrow. Both arrows wrap around.

- Arrows update the URL search param through the framework's router, so the variant is shareable and reload-stable
- The left and right arrow keys also cycle, EXCEPT while an `input`, `textarea`, or `[contenteditable]` has focus
- Visually distinct from the page (high-contrast pill, subtle shadow) so it is obviously not part of the design
- Hidden in production builds via `process.env.NODE_ENV !== 'production'` or the project's equivalent, so a stray merge cannot ship it

Put it in one shared component where the project keeps shared UI.

### 5. Hand It Over

Surface the URL and the `?variant=` keys, then WAIT. The user picks. The best feedback is usually "the header from B with the sidebar from C", which is the design they actually want.

### 6. Capture The Answer And Clean Up

Record which variant won and why, then capture the prototype per Rules For Both in [SKILL.md](SKILL.md). The full set of variants and the switcher go to the throwaway branch as the primary source; none of it stays on the main branch.

## Anti-Patterns

- Variants that differ only in colour or copy. Real variants disagree about structure
- Sharing too much between variants. A shared header is fine; a shared layout defeats the point
- Wiring variants to real mutations. Point any mutation at a stub: the question is how it looks, not whether the backend works
- Promoting variant code to production. It was written under prototype constraints; rebuild the winner properly
