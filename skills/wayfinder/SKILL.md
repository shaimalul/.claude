---
name: wayfinder
description: Plan a huge, foggy chunk of work (more than one agent session can hold) as a shared map of decision tickets on the issue tracker, then resolve them one at a time until the way to the destination is clear. Use to chart a new map from a loose idea, or to work the next ticket on an existing map.
argument-hint: "[loose idea | map URL or path] [ticket]"
allowed-tools: Task, Skill, Read, Grep, Glob, Bash, Write, Edit, AskUserQuestion
model: opus
disable-model-invocation: true
---

# Wayfinder

A loose idea has arrived, too big for one agent session and wrapped in fog: the way from here to the DESTINATION is not visible yet. Wayfinding finds that way instead of charging at the destination. This skill charts the way as a shared MAP on the issue tracker, then works its DECISION TICKETS (questions whose resolution is a decision, not slices of a build to execute) one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting because it shapes every ticket. It might be a spec to hand off, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic: engineering work, course content, whatever fits the shape.

## When To Reach For It

| Situation | Reach for |
|---|---|
| Fits in one session | `/plan-task` |
| Many sessions, decisions already clear, needs phased execution | `/plan-to-docs` |
| Many sessions, route still foggy | `/wayfinder` |
| A cleared wayfinder map | `/plan-to-docs <map>`, then `/implement-phase` |

## Plan, Don't Do

Wayfinder is PLANNING by default. Each ticket resolves a decision, and the map is done when nothing is left to decide before someone goes and does the thing. The pull to just do the work is the signal you have reached the edge of the map and it is time to hand off. An effort can override this in its Notes, carrying execution into the map itself. Absent that, produce decisions, not deliverables.

## Refer By Name

Every map and ticket has a name: its title. In everything the human reads (narration, the map's Decisions so far), refer to it by that name, never by a bare id, number, or slug. A wall of `#42, #43, #44` is illegible. The id and URL ride inside the name as its link, never stand in for it.

## The Tracker

Where the map, its tickets, blocking edges, and frontier queries physically live depends on the repo:

- `git remote -v` points at GitHub: see [tracker-github.md](tracker-github.md)
- Anything else, or no remote: see [tracker-local.md](tracker-local.md)

Load the matching file before any tracker operation. It owns every command; this file names only the operations (create map, create ticket, wire blocking, frontier query, claim, resolve).

## The Map

The map is ONE issue labelled `wayfinder:map`, the canonical artifact. Its tickets are its children.

The map is an INDEX, not a store. It lists the decisions made and points at the tickets that hold their detail. A decision lives in exactly one place, its ticket, so the map never restates it, only gists it and links.

The map body is the whole map at low resolution, loaded once per session. Open tickets are NOT listed on it: they are found by the frontier query.

```markdown
## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail -->

- [<closed ticket title>](link): <one-line gist of the answer>

## Not yet specified

<!-- in-scope fog you cannot ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->
```

## Tickets

Each ticket is a child of the map, and the tracker's id is its identity. Its body is the question, sized to one 100K token agent session:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each ticket carries a `wayfinder:<type>` label: `research`, `prototype`, `grilling`, or `task`.

A session CLAIMS a ticket by assigning it to the dev driving the map, FIRST, before any work, so concurrent sessions skip it. The assignee is the claim: an open, unassigned ticket is unclaimed.

Blocking uses the tracker's NATIVE dependency relationship, because it renders the FRONTIER visually in the tracker's own UI and the human sees what is takeable without opening the map. A ticket is unblocked when every ticket blocking it is closed. The frontier is the open, unblocked, unclaimed children: the edge of the known.

The answer is not part of the body. It is recorded on resolution. Assets created while resolving a ticket are linked from it, never pasted in.

## Ticket Types

Every ticket is either HITL (human in the loop, worked WITH a human who speaks for themselves) or AFK, driven by the agent alone. A HITL ticket only resolves through that live exchange. The agent NEVER stands in for the human's side of it: a grilling agent that answers its own questions, or a prototype agent that picks the winning variant itself, has broken the ticket.

| Type | Mode | Resolved by | Use when |
|---|---|---|---|
| `research` | AFK | A subagent that loads `research` | A fact the decision waits on lives outside the working directory: docs, third-party APIs, knowledge bases |
| `prototype` | HITL | Load `prototype`, link the result as an asset, the human reacts | "How should it look" or "how should it behave" is the key question |
| `grilling` | HITL | Load `grilling` and `domain-modeling` | The default: a conversation settles it |
| `task` | HITL or AFK | Doing the work, or handing the human a precise checklist | Manual work must happen before a decision can be made |

A `task` is the one type that DOES rather than decides: signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. It earns its place by unblocking a decision, not by delivering the destination. Its answer records what was done and any facts later tickets depend on (credentials location, new URLs, row counts).

## Fog Of War

The map is DELIBERATELY incomplete: do not chart what you cannot yet see. Beyond the live tickets lies the FOG OF WAR: decisions you can tell are coming but cannot pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever is now specifiable into fresh tickets, until the way to the destination is clear and no tickets remain.

The Not yet specified section is where that dim view is written down: the suspected question, the area to revisit. Everything there is IN scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows.

Fog or ticket? The test is whether you can STATE the question precisely now, not whether you can answer it now.

- Ticket when the question is already sharp, even if it is blocked
- Not yet specified when you cannot phrase it that sharply. Do not pre-slice fog into ticket-sized pieces: one patch may graduate into several tickets, or none

Not yet specified excludes what is decided (Decisions so far), what is a live ticket, and what is out of scope.

## Out Of Scope

Fog only ever gathers TOWARD the destination. The destination fixes the scope, so work beyond it is out of scope: not fog, and never in Not yet specified. Out-of-scope work never graduates. It returns only if the destination is redrawn, and then as a fresh effort.

Ruling something out of scope is a scoping act, not a step on the route. When an existing ticket turns out to sit past the destination, CLOSE it and leave one line in Out of scope: the gist plus why, linking the closed ticket. It stays out of Decisions so far, which records the route actually walked.

## Invocation

Two modes, picked from `$ARGUMENTS`: a loose idea charts a new map, a map URL or path works an existing one. Either way, NEVER resolve more than one ticket per session, except research tickets.

### Chart The Map

1. Name the destination. Load `grilling` and `domain-modeling` and pin down what this map is finding its way to. The destination fixes the scope, so it is settled first
2. Map the frontier. Grill again, BREADTH-FIRST: fan out across the whole space rather than deep on one thread, surfacing the open decisions and the first steps takeable now. If this surfaces NO fog (the way is already clear and the journey fits one session), you do not need a map. Stop and ask the user how to proceed, recommending `/plan-task`
3. Create the map: Destination and Notes filled in, Decisions so far empty, the fog sketched into Not yet specified
4. Create the tickets you can specify now as children of the map, then wire blocking edges in a SECOND pass (tickets need ids before they can reference each other)
5. Fire the research subagents. For each `research` ticket, spawn a background Task subagent with `isolation: "worktree"` that loads `research` to resolve it in parallel. Isolation keeps each subagent's throwaway `research/<ticket-slug>` branch from colliding with the others
6. Stop. Charting is one session's work; it hand-resolves nothing

### Work Through The Map

A ticket argument is optional. Without one, you pick the next decision, not the user.

1. Load the map: the low-res view, not every ticket body
2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. CLAIM it before any work
3. Resolve it by its type (see Ticket Types). Zoom as needed: fetch the full body of any related or closed ticket on demand, and load whichever skills the map's Notes name. If in doubt, load `grilling` and `domain-modeling`
4. Record the resolution: post the answer as a resolution comment, close the ticket, and append a context pointer to the map's Decisions so far
5. Advance the frontier. Create newly surfaced tickets (create, then wire). Graduate any fog the answer made specifiable, clearing each graduated patch from Not yet specified so it lives only as its new ticket. Rule out of scope any ticket the answer shows sits past the destination. Update or close any ticket the decision invalidated
6. If the frontier is now empty and Not yet specified is empty, the map is CLEARED: tell the user and recommend `/plan-to-docs <map>` as the handoff

Other sessions may be working unblocked tickets in parallel, so re-read the map right before editing it and expect concurrent changes.

## Done When

- [ ] The destination is written on the map before any ticket exists
- [ ] Every open ticket reads as a question. A ticket reading "build the X" is mis-typed or belongs downstream of the map
- [ ] This session resolved at most one non-research ticket, recorded its answer, closed it, and added one line to Decisions so far
- [ ] No patch of fog lives in both Not yet specified and a ticket
- [ ] A cleared map hands off to `/plan-to-docs`, not to code
