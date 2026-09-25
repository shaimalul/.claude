# Wayfinder Tracker: Local Markdown

Used when the repo has no GitHub remote. The map lives in `ai_plans/<effort-slug>/`, the same folder `/plan-to-docs` writes its phase docs into when the map clears.

## Layout

```text
ai_plans/<effort-slug>/
├── map.md
└── tickets/
    ├── 01-<ticket-slug>.md
    └── 02-<ticket-slug>.md
```

`<effort-slug>` is kebab-case, max 40 chars. Tickets are numbered from `01` in creation order, one file per ticket, never a combined file.

## Ticket Header

Every ticket file opens with these lines, above its `## Question`:

```markdown
# <ticket title>

Type: research | prototype | grilling | task
Status: open | claimed | resolved | out-of-scope
Blocked by: 03, 05
```

Omit `Blocked by` when nothing gates the ticket.

## Operations

| Operation | How |
|---|---|
| Create map | Write `map.md` with the map body, titled `# <map title>` |
| Create ticket | Write `tickets/NN-<slug>.md` with the header and `## Question` |
| Wire blocking | Set the `Blocked by:` line to the blocking ticket numbers |
| Claim | Set `Status: claimed` and save, before any other work |
| Resolve | Append the answer under `## Answer`, set `Status: resolved` |
| Rule out of scope | Append the reason under `## Answer`, set `Status: out-of-scope` |
| Link | Relative path from `map.md`, e.g. `[<ticket title>](tickets/03-auth-model.md)` |

## Frontier Query

Scan `tickets/` for files with `Status: open` whose every `Blocked by` entry is `resolved`. The lowest number wins.

```bash
grep -l '^Status: open' ai_plans/<effort-slug>/tickets/*.md
```

Local files have no native blocking UI and no assignee, so the frontier is only visible by query. Re-read a ticket's `Status` immediately before claiming it in case a parallel session got there first.
