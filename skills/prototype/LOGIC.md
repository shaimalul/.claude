# Logic Prototype

A single, self-contained HTML file (a SHAREABLE DEMO) that lets anyone drive a state model by clicking buttons. Use it when the question is about business logic, state transitions, or data shape: the kind of thing that looks reasonable on paper but only feels wrong once you push real cases through it.

Because it is one file with nothing to install, you can hand it to a designer, a PM, or a domain expert and let them feel the model for themselves. So it speaks their language, not the code's.

## When This Is The Right Shape

- "I'm not sure this state machine handles the edge case where X then Y"
- "Does this data model actually let me represent the case where..."
- "I want to feel out what the API should look like before writing it"
- Anything where someone wants to press buttons and watch state change

If the question is "what should this look like", use [UI.md](UI.md) instead.

## Process

### 1. State The Question

Before writing code, write down the state model and the question being prototyped: one paragraph in a visible intro at the top of the demo, not just a comment. A logic prototype that answers the wrong question is pure waste, so make the question checkable later.

### 2. Isolate The Logic In A Portable Module

Put the logic that answers the question in one `<script>` block written as a small, PURE module that could be lifted into the real codebase later. The page around it is throwaway; this module is not.

Pick the shape that fits the question, not the one easiest to wire to a page:

- A pure reducer `(state, action) => state`, when actions are discrete events and state is one value
- A state machine with explicit states and transitions, when "which actions are even legal right now" is part of the question
- A small set of pure functions over a plain data type, when there is no implicit current state
- A class or module with a clear method surface, when the logic genuinely owns ongoing internal state

No DOM, no `document`, no button handlers reaching inside it. The page calls into the module; nothing flows the other direction.

### 3. Build The Shareable HTML File

One file, plain HTML, CSS, and JS: no framework, no bundler, no server, everything inline so it opens by double-click and survives being emailed. Every label is in DOMAIN language: buttons and state read like the business, not the reducer.

Top to bottom:

1. Title and a one-line explanation of what the demo lets you explore (the question from step 1)
2. Current state: the full relevant state as a readable panel of labelled fields, not a raw JSON dump, re-rendered after every click. Call out what just changed
3. Free-play buttons: one per action, always available, so anyone can poke the model in any order
4. Guided walkthroughs: one SCENARIO per tab. Each tab holds a plain-language description of the situation and what to watch for, then the ordered buttons to press. Each step is a real button that performs the action and advances. Starting a walkthrough resets to a known initial state

Choose scenarios that expose the awkward cases: the happy path, a tricky edge case, an attempt at something that should be illegal.

Clean typography, generous spacing, one accent colour. No animations: nothing competes with the state and the buttons.

### 4. Hand It Over

Send the file or open it for the user. The interesting moments are "wait, that shouldn't be possible" or "huh, I assumed X would be different": those are bugs in the IDEA, which is the point. Add actions or scenarios when they ask.

### 5. Capture The Answer

Once it has answered its question, capture it per Rules For Both in [SKILL.md](SKILL.md). The validated reducer, machine, or function set is the part worth rebuilding in the real module; the HTML shell rides along to the throwaway branch, where it stays trivially re-runnable.

## Anti-Patterns

- Adding tests. A prototype that needs tests is no longer a prototype
- Wiring it to the real database. In-memory state unless the question is about persistence
- Generalising. No "what if we wanted X later". It answers one question
- Blurring logic and page. If the module references the DOM or button handlers, it is no longer liftable
- Reaching for a framework, bundler, or server. That defeats "shareable"
- Shipping the HTML shell. The page is built to be clicked by hand; only the logic is worth keeping
