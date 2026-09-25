---
name: research
description: Investigate a question against high-trust primary sources in a background agent and capture the cited findings as one Markdown file. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated so it never lands in the main session.
argument-hint: "[question | wayfinder research ticket]"
---

# Research

Spawn a BACKGROUND Task subagent (`general-purpose`) to do the reading, so you keep working while it reads and its context never lands in yours.

## The Subagent's Job

1. Investigate the question against PRIMARY sources: official docs, source code, specs, first-party APIs. Never a secondary write-up of them. Follow every claim back to the source that owns it
2. Route each lookup per the MCP-First Tool Routing section of `CLAUDE.md`, and treat external identifiers per External Fact Verification in `rules/agents.md`
3. Write the findings to ONE Markdown file, citing each claim's source inline. Separate what the sources state from what the subagent infers
4. Save it where the repo already keeps such notes, matching the existing convention. If there is none, put it somewhere sensible and say where
5. Return the file path and a three-line gist

## Inside Wayfinder

When the question is a `wayfinder:research` ticket, the ticket's question is the brief, and the findings are a primary source, not a deliverable:

- Commit the findings file to a throwaway `research/<ticket-slug>` branch, never to the main branch
- Resolve the ticket per the `wayfinder` Work Through The Map steps: the resolution comment is the gist plus a context pointer to the branch and file

## Done When

- [ ] Every claim in the file cites the primary source it came from
- [ ] The user, or the wayfinder ticket, has the file path and the gist
