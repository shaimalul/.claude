---
name: writing-for-agents
description: How to write any document an agent consumes - a skill, an agent, a rule, CLAUDE.md, or a doc reached by a pointer - so the agent takes the same process every run. Use when writing, editing, pruning, or diagnosing a misbehaving skill, agent, rule, or steering file.
user-invocable: false
---

# Writing For Agents

The writing primitive. Every skill, agent, rule, and `CLAUDE.md` in this configuration is written to it, and no other file restates it.

A document's job is to wrangle determinism out of a stochastic system. The goal is not the same OUTPUT every run, it is the same PROCESS. PREDICTABILITY is the root virtue: judge every choice against it, never against how clever or exhaustive the document reads.

When the document is a skill, also read [SKILL-MECHANICS.md](SKILL-MECHANICS.md) for invocation settings, the description field, supporting files, and routers.

## Context Pointers

A CONTEXT POINTER is a reference held in context that names out-of-context material and encodes the condition for reaching it. A skill's description is one; a line in `CLAUDE.md` naming a rule file is the same object. The pointer's WORDING, not its target, decides when the agent reaches the material and how reliably. A must-have target behind a weakly worded pointer is a variance bug: sharpen the wording first, and inline the material only if sharpening fails.

A pointer states what the material is and lists the BRANCHES that should trigger reaching it (a branch is a distinct case the document handles). Every word of an always-loaded pointer costs on every turn:

- Front-load the leading word: the pointer is where it does its triggering work
- One trigger per branch. Synonyms that rename one branch are that branch written twice; collapse them
- Cut identity the body already carries

## The Two Loads

- CONTEXT LOAD is the cost of always-loaded material on the agent's window: a `CLAUDE.md` line, a skill description, anything in context every turn whether or not it fires
- COGNITIVE LOAD is the cost on the human: which documents exist and when to reach for each. The human is the index. It is the price of human agency, so spend it where human judgement matters and remove it where it does not

Material reached only through a pointer escapes context load at the price of the pointer's own line. Material with no pointer at all rides entirely on cognitive load.

## Information Hierarchy

A document holds STEPS (the ordered actions the agent performs) and REFERENCE (definitions, rules, facts consulted on demand). Each piece sits on a ladder ranked by how immediately the agent needs it:

1. In-file step: what the agent does every run, in order
2. In-file reference: consulted on demand while running. A flat peer-set (every rule of a review on one rung) is a fine arrangement, not a smell
3. Disclosed reference: pushed into a separate file behind a context pointer, loaded only when the pointer fires

PROGRESSIVE DISCLOSURE is the move down the ladder so the top stays legible. The cleanest test is branching: inline what every branch needs, disclose what only some branches reach. In-file reference that should be disclosed buries the steps and turns attending to them into a coin-flip.

CO-LOCATION is the within-file companion: keep a concept's definition, rules, and caveats under one heading, so reading one part brings its neighbours. Scattering fragments one meaning across many places; duplication repeats one meaning in two.

## Steps And Completion Criteria

Every step ends on a COMPLETION CRITERION: the condition that tells the agent the work is done.

- CLARITY: can the agent tell done from not-done? A vague bound ("understanding reached") invites PREMATURE COMPLETION, attention slipping to being done because later steps pull. Sharpen the bound first. Only if it is irreducibly fuzzy and you observe the rush, hide the later steps behind a real context boundary (a handoff or a subagent dispatch)
- DEMAND: how much it requires. "Every modified model accounted for" forces LEGWORK where "produce a change list" does not. Demand binds reference too: "every rule applied" carries an exhaustiveness bar through flat reference

The strongest criteria are both checkable and exhaustive.

## Leading Words

A LEADING WORD is a compact concept already in the model's pretraining that the agent thinks with while running the document: TIGHT loop, RED-capable, SEAM, TRACER BULLET, DEEP module, BLAST RADIUS, FRONTIER, FOG OF WAR. Repeated as a token, never as a sentence, it anchors a whole region of behaviour in the fewest tokens. In a body it anchors EXECUTION; in a pointer it anchors INVOCATION. Reach for an existing word before coining one: a made-up word recruits no priors, so you pay in definition tokens what a pretrained word gives free.

Hunt restatements a leading word can retire: "fast, deterministic, low-overhead" becomes TIGHT; "a loop you believe in" becomes RED.

## Positive Framing

Steering by prohibition drags the forbidden behaviour into context and makes it MORE available: the negation is a weak modifier the concept overruns. State the target behaviour ("write one-line comments") so the banned one is never spoken. A prohibition earns its place only as a hard guardrail you cannot phrase positively, and even then pair it with the positive target. The NEVER rules in `CLAUDE.md` are such guardrails; new ones must clear that bar.

## Pruning

Apply sentence by sentence when writing or editing:

- SINGLE SOURCE OF TRUTH: is this meaning already owned by a base, a primitive, a rule file, or `CLAUDE.md`? Reference it, never restate it
- THE ENVIRONMENT IS A SOURCE OF TRUTH: `package.json` scripts, config files, directory layout, `--help` output. A document restating them is a CACHE that goes stale. Cache only what looking cannot find: the unwritten convention, the reason behind a choice, the gotcha no config confesses
- RELEVANCE: does this line still bear on what the document does? Stale lines settle into SEDIMENT because adding feels safe and removing feels risky
- NO-OP: would the model behave identically with this sentence removed? Then delete the whole sentence. The test is model-relative: settle disagreements by running the document, not by debate. A leading word too weak to beat the default (thorough) is a no-op; the fix is a stronger word (relentless)

## Failure Modes

Diagnose a misbehaving document against these:

| Failure mode | Symptom | Fix |
|---|---|---|
| Premature completion | It stops before the work is actually done | Sharpen the completion criterion with observable evidence |
| Duplication | Two files give contradictory guidance on one concept | Extract to a base or primitive, reference from both |
| Sediment | Layers of edits nobody removed, each half-contradicting the last | Rewrite the section whole, never patch it again |
| Sprawl | Too long, or grew to cover concerns it does not own | Disclose down the ladder, split, or hand the concern to its owner |
| No-op | Sentences that read well and change nothing | Cut them |
| Weak pointer | A needed file is never read | Sharpen the pointer's wording before inlining the target |

## Checklist

- [ ] Every meaning has one home; everything else points to it
- [ ] Steps are on top; reference only some branches need is disclosed behind a pointer
- [ ] Every step ends on a clear, demanding completion criterion
- [ ] Leading words replace restated triads
- [ ] Targets are stated positively; each remaining prohibition is a hard guardrail
- [ ] No sentence survives the no-op test that should not
