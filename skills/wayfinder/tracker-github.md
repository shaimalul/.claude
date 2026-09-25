# Wayfinder Tracker: GitHub

Used when the repo's remote is on GitHub. Every operation goes through the `gh` CLI, which infers the repo from `git remote -v` and fills `{owner}/{repo}` in `gh api` paths automatically.

## Labels

Create the labels once per repo if they are missing. `--force` makes this idempotent:

```bash
for l in map research prototype grilling task; do
  gh label create "wayfinder:$l" --force
done
```

## Ids

GitHub's sub-issue and dependency endpoints take the issue's numeric DATABASE id, not its `#number` or `node_id`:

```bash
gh api repos/{owner}/{repo}/issues/<number> --jq .id
```

## Operations

| Operation | Command |
|---|---|
| Create map | `gh issue create --label wayfinder:map --title "..." --body-file <file>` |
| Read map | `gh issue view <map> --json title,body,url` |
| Create ticket | `gh issue create --label wayfinder:<type> --title "..." --body-file <file>` |
| Attach ticket to map | `gh api --method POST repos/{owner}/{repo}/issues/<map>/sub_issues -F sub_issue_id=<ticket-db-id>` |
| Wire blocking | `gh api --method POST repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by -F issue_id=<blocker-db-id>` |
| Claim | `gh issue edit <ticket> --add-assignee @me` (the session's FIRST write) |
| Resolve | `gh issue comment <ticket> --body-file <answer>`, then `gh issue close <ticket>` |
| Rule out of scope | `gh issue close <ticket> --reason "not planned" --comment "<why>"` |
| Update map body | `gh issue edit <map> --body-file <file>` |

Write multi-line bodies to a file in the scratchpad and pass `--body-file`, never inline.

## Frontier Query

List the map's children in map order, then keep the open, unassigned ones with no open blocker:

```bash
gh api repos/{owner}/{repo}/issues/<map>/sub_issues --paginate \
  --jq '.[] | select(.state=="open" and (.assignees|length)==0)
        | {number, title, blocked: (.issue_dependencies_summary.blocked_by // null)}'
```

`issue_dependencies_summary.blocked_by` counts OPEN blockers only, so `0` means unblocked. If the field comes back `null`, check the ticket directly with `gh api repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by --jq '[.[] | select(.state=="open")] | length'`. The first unblocked ticket wins.

## Fallbacks

Where the repo has sub-issues or dependencies disabled, the relevant endpoint errors. Degrade, and say so to the user once:

- No sub-issues: keep a task list of child links in the map body, and put `Part of #<map>` at the top of each ticket body
- No dependencies: put `Blocked by: #<n>, #<n>` at the top of the ticket body. A ticket is unblocked when every issue on that line is closed
