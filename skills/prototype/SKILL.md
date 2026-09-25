---
name: prototype
description: Build a throwaway prototype that answers one design question. Use when the user wants to sanity-check whether a state model or piece of logic feels right, or to explore what a UI should look like before committing to one.
argument-hint: "[design question]"
---

# Prototype

A prototype is THROWAWAY code that answers a question. The question decides the shape.

## Pick A Branch

Identify which question is being answered, from the user's prompt, the surrounding code, or by asking if the user is around:

- "Does this logic or state model feel right?" See [LOGIC.md](LOGIC.md): one shareable HTML file with free-play buttons and tabbed guided walkthroughs that a non-developer can drive
- "What should this look like?" See [UI.md](UI.md): several radically different UI variations on one route, switchable via a URL search param and a floating bottom bar

The two branches produce very different artifacts, so getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user is not reachable, pick the branch that matches the surrounding code (a backend module means logic, a page or component means UI) and state the assumption at the top of the prototype.

## Rules For Both

1. Throwaway from day one, and clearly marked. Put it next to the module or page it prototypes for, but name it so a casual reader sees it is a prototype. For UI routes, obey the project's existing routing convention
2. Trivial to run. A UI prototype starts from one command in the project's task runner. A logic demo is one HTML file the user double-clicks
3. No persistence by default. State lives in memory. If the question explicitly involves a database, hit a scratch DB or local file with a clear "PROTOTYPE, wipe me" name
4. Skip the polish. No tests, no error handling beyond what makes it runnable, no abstractions. The point is to learn fast
5. Surface the state. After every action (logic) or variant switch (UI), render the full relevant state so the user sees what changed
6. The HUMAN judges. Hand the prototype over and wait. Never pick the winning variant or declare the model right on the user's behalf
7. Capture it when done. Commit the prototype to a throwaway `prototype/<slug>` branch, never the main branch, and record the verdict and the question it settled. In a wayfinder map, that is the `wayfinder:prototype` ticket's resolution comment, with a context pointer to the branch

## Folding The Answer In

Prototype code never merges. The validated decision is rebuilt properly in the real code under the Tests pillar in `CLAUDE.md`, test-first via `tdd`. Inside a wayfinder map, that rebuild happens downstream of the map, not in the ticket.

## Done When

- [ ] The question is written at the top of the prototype
- [ ] The user has run it and given a verdict
- [ ] The prototype sits on a throwaway branch and the verdict is recorded
