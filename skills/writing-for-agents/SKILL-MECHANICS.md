# Skill Mechanics

The skill-specific branch of [SKILL.md](SKILL.md): what changes when the document is a skill. Formatting rules for every file type live in `improve-claude`'s File Format Reference, not here.

## Invocation Settings

Each setting spends one of the two loads. Choose by that, not by habit:

| Setting | Cost | Choose when |
|---|---|---|
| Model-invocable (default) | CONTEXT load: the description sits in the window every turn | The model must reach it on its own, or another skill must load it |
| `disable-model-invocation: true` | COGNITIVE load: the user is the index that must remember it | Real side effects (writes files, commits, posts) or a deliberate ritual the user starts |
| `user-invocable: false` | No menu entry, still model-reachable | Pattern libraries, bases, and primitives that load silently when relevant |

A `disable-model-invocation` skill cannot be loaded by another skill, so shared reference two such skills both need lives in a base or primitive, never in either of them.

## Description Field

The description is the skill's top-level context pointer and the ONLY thing the model sees before deciding to invoke. For a model-reachable skill, write it as trigger conditions: the situations, verbs, and vocabulary a user actually types, one trigger per branch. For a `disable-model-invocation` skill it is human-facing: a one-line summary for the `/` menu.

## Supporting Files

Disclosed reference lives beside `SKILL.md` as supporting files, per the official layout at [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills#add-supporting-files). Check that page before restructuring a skill; it can add fields and patterns after this file was written.

- `SKILL.md` links every supporting file by relative path and says when to load it. An unlinked file is dead weight
- Scripts are referenced by path and executed, not loaded into context
- A `SKILL.md` past roughly 250 lines is a signal that a supporting file is waiting to be extracted

## Splitting A Skill

- BY SEQUENCE: split a run of steps where the later steps tempt the agent to rush the one in front of it. Hiding only works across a real context boundary
- BY INVOCATION: split off a model-invocable skill only when a distinct leading word should trigger it on its own, or another skill must reach it. The new description is permanent context load, so that independent reach has to be worth it

## Routers

When user-invocable skills multiply past what the user can hold in their head, the cure is a ROUTER that names the others and when to reach for each, not more skills. In this configuration the router is the Which Entry Point table in `CLAUDE.md`.
