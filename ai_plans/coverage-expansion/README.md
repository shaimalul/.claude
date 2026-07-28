# Coverage Expansion

Extend coverage across three layers of this configuration repo: deterministic static validation (free, `scripts/tests/`), behavioural LLM evals (paid, `evals/` via promptfoo and OpenRouter), and agent plus skill composition.

The plan is shaped by one empirical finding. An ablation run with an EMPTY system prompt showed that 3 of the 6 existing eval cases pass without their artifact loaded, meaning they measure the base model rather than this repo. The skills encode contrarian process rules and fail correctly without their file; the three agent cases encode industry consensus and pass regardless. Adding volume in that style would mostly produce more cases that measure nothing. So the acceptance criterion for every paid case is not "it passes" but "it FAILS without its artifact", enforced by a question-only control prompt.

## Verified Findings

| # | Finding | Evidence |
|---|---------|----------|
| 1 | 3 of 6 eval cases are vacuous | Empty-system-prompt ablation. `architect-agent` asserts `icontains: ADR` and the base model's own answer opens with "Architecture Decision Record (ADR)" |
| 2 | Nothing validates agent `skills:` wiring | 8 of 11 agents declare the field. Renaming a skill directory breaks them silently |
| 3 | CI cache key is frozen | `evals.yml:37` key `${{ runner.os }}-promptfoo-v1` never varies. Actions caches are immutable per key, so every case added after the first run is a permanent miss forever |
| 4 | Node version drift | `evals.yml:28` floats on `node-version: 20` while `.nvmrc` pins `20.20.0`. A runner on 20.19.x makes promptfoo refuse to start |
| 5 | Installer SSOT violation | `setup.sh:42` and `:53` `sed "s\|__HOME__\|$HOME\|g"` duplicates `merge-settings.js:30` `templateRaw.replace(/__HOME__/g, homeDir)` |
| 6 | Grader is unpinned | `OPENROUTER_API_KEY` does not appear in promptfoo's grader credential list. Defaults are pricier than the model under test, and grading burned more tokens than the evals themselves (53,618 vs 32,488) |
| 7 | Static suite is not in CI | Only the paid workflow runs. `npm test` has 4 red items today |

## Decisions Locked

| Decision | Choice |
|----------|--------|
| Layer rule | Artifact property goes to Layer 1 (free); model behaviour goes to Layer 2 (paid); build a deterministic proxy first where one catches the realistic failure |
| Case acceptance | A paid case must FAIL under the question-only control before it may merge |
| Composition rendering | One pure module `evals/lib/compose-prompt.js` owns all logic; `evals/prompts/agent-loader.js` is a thin adapter |
| Artifact addressing | Eval cases address artifacts BY NAME via `config-inventory`, never by relative `file://` path |
| Composition claim | Tested as content compatibility only. Never described as "agent loads X". Retrieval fidelity is a non-gating canary |
| Tier C | 16 skills exempt via `behavioral-coverage:` frontmatter, not a central list. COV-05 ceiling 20 |
| Coverage gate ordering | Reporter lands early to target the work; blocking COV assertions land last, once they can pass |
| Failure behaviour | Fail loud, never silently pass. Fork PRs are the sole skip exception. Never `pull_request_target` |
| Gate strength | Static job blocks. Eval job is report-only |
| Case slicing | Case authoring is ONE phase with an internal, resumable batch ledger |
| Branching | Continue on the current branch. No baseline commit, no per-phase branches |

### Accepted risk on branching

You chose to continue on `merge-work-config` as-is, which carries 138 uncommitted changes intermingled with this work. A phase that goes wrong cannot be reverted by discarding a branch; recovery means manual surgery on the working tree. Phases 3 and 4 are the ones to be careful with, since they rewrite the installer and delete existing eval cases. Consider running `/commit-all` at any clean point to create a recovery marker.

## Phase Index

| # | File | Blocked by | Delivers | Done When |
|---|------|------------|----------|-----------|
| 1 | [01-ci-foundation.md](01-ci-foundation.md) | None | Green suite enforced by CI on every push, all 4 workflow defects fixed | `npm test` exits 0 and CI runs it on push |
| 2 | [02-frontmatter-wiring.md](02-frontmatter-wiring.md) | 1 | Agent `skills:` lists are parsed and validated | INT-16 fails when a skill is renamed |
| 3 | [03-installer-ssot.md](03-installer-ssot.md) | 1 | One implementation of template rendering, covered by tests | `setup.sh` contains zero `sed`, render tests pass |
| 4 | [04-eval-restructure.md](04-eval-restructure.md) | 1 | Vacuous cases gone, control prompt proves the rest are real | Control run shows every retained case fails without its artifact |
| 5 | [05-composition-harness.md](05-composition-harness.md) | 2, 4 | Agent plus skill composition rendered by one pure, free-tested module | `compose-prompt` unit tests pass with zero API calls |
| 6 | [06-coverage-reporter.md](06-coverage-reporter.md) | 4 | A list of exactly which artifacts lack behavioural coverage | `npm run coverage:evals` prints the uncovered set |
| 7 | [07-case-expansion.md](07-case-expansion.md) | 5, 6 | Roughly 90 control-verified cases across all tiers | Every batch in the ledger ticked, full suite green |
| 8 | [08-coverage-gate-and-nightly.md](08-coverage-gate-and-nightly.md) | 7 | Coverage ratchets shut, nightly sweep catches model drift | COV-01..05 pass as blocking assertions |

Phases 2 and 3 have the same single blocker and no edge between them, so they may run in either order or together. Phase 4 is also unblocked by phase 1 and is independent of 2 and 3.

## How to Use

1. Work the FRONTIER: any phase whose blockers are all done. Phases 2, 3 and 4 are all on the frontier once 1 lands
2. Run `/implement-phase ai_plans/coverage-expansion/0N-phase.md`
3. Complete verification, tick Done When, clear context, move to the next frontier phase

Do NOT start a phase whose blockers are unfinished.

Phase 7 is the exception to one-phase-one-context. It carries an internal batch ledger; re-run `/implement-phase` against it repeatedly and it resumes at the first unticked batch.

## Protected Files

`CLAUDE.md`, `rules/*.md`, `agents/*.md` and `skills/*/SKILL.md` are protected configuration. Phases 4, 6 and 7 touch skill and agent frontmatter or content, and those edits MUST route through `/improve-claude` rather than direct edits. Each affected phase repeats this warning.

## Out of Scope

- LLM-graded base and consumer duplication. INT-12 already decides it deterministically
- Pairwise description similarity across 50 skills. Quadratic, with guaranteed false positives on skills related by design
- `icontains` on long prose phrases. Goes red when someone improves wording
- Golden snapshots of composed system prompts
- `claude -p` on every PR. It stays a manual canary
- A rule that every skill is loaded by at least one agent. Most skills are user-invoked by design, and the rule would create pressure to pad `skills:` lists
- Tests for npm scripts, or for promptfoo's own behaviour
- A coverage-percentage target on the eval suite

## Cost Reference

haiku-4.5 at $1/M input, $5/M output. 6 cases cost $0.055; roughly 150 cases cost about $1.25 per run at about 2 minutes with `-j 10`. Cost is NOT the binding constraint. Flakiness and maintenance are. This estimate holds only once the grader is pinned (see finding 6).

## Generated

Created by `/plan-to-docs` on 2026-07-28.
