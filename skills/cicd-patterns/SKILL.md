---
name: cicd-patterns
description: GitHub Actions CI/CD patterns including reusable workflows, test/build/deploy staging, caching, OIDC cloud auth, environments, and release versioning. Use when writing or reviewing GitHub Actions workflows.
globs: ".github/workflows/*.yml,.github/workflows/*.yaml"
user-invocable: false
---

# CI/CD Patterns (GitHub Actions)

Conventions for pipelines that test, build, and deploy a service. The shape is the same across providers: a fast feedback stage on every push, an image build on merge, and a gated deploy per environment.

## Pipeline Shape

```
push / PR  ->  lint + test (every commit, fast, parallel)
merge main ->  build image -> push to registry -> deploy staging
tag / approval -> promote same image -> deploy prod
```

Build the artifact ONCE and promote the identical image through environments. Rebuilding per environment means staging never actually validated what ships to prod.

## Reusable Workflows over Copy-Paste

Centralize pipeline logic in one repo and call it. This is SSOT applied to CI.

```yaml
# .github/workflows/release.yml
name: release

on:
  push:
    branches: [main]
  pull_request:

jobs:
  release:
    uses: your-org/ci-templates/.github/workflows/service-release.yml@v1
    with:
      service: surveys-bff
      namespace: surveys
    secrets: inherit
```

Pin reusable workflows and third-party actions to a tag or SHA, never `@main`. An unpinned action is remote code you re-fetch on every run.

Prefer `secrets: inherit` over enumerating secrets when the called workflow is in your own org; enumerate explicitly when calling anything external.

## Test Stage

Run the fast checks in parallel and fail the job on the first real signal:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: root
          POSTGRES_PASSWORD: root
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --coverage
```

Use `node-version-file: .nvmrc` rather than a hardcoded version so CI and local development read the same source of truth. The equivalent for Python is `python-version-file: .python-version`.

Always `npm ci`, never `npm install`, in CI - `ci` honors the lockfile exactly and fails when it is out of sync.

## Build and Push

```yaml
  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Tag images with the immutable commit SHA, not only `latest`. A moving tag makes rollbacks and incident forensics guesswork.

## Cloud Auth: OIDC, Not Long-Lived Keys

Federate into the cloud provider with short-lived tokens. Never store static access keys as repo secrets.

```yaml
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
          aws-region: us-east-1
```

Grant `permissions:` at the narrowest scope that works. The default token is broad; declare an explicit block on every job that touches anything.

## Environments and Deploy Gates

Use GitHub Environments for per-environment secrets and required reviewers, rather than encoding approval logic in `if:` conditions.

```yaml
  deploy-prod:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
    concurrency:
      group: deploy-production
      cancel-in-progress: false
    steps:
      - run: ./scripts/deploy.sh ${{ github.sha }}
```

Set `concurrency` on deploy jobs with `cancel-in-progress: false`. Two overlapping deploys to one environment is a race; cancelling a half-finished deploy is worse than queueing it.

For PR/test jobs the opposite applies - cancel superseded runs:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

## Release Versioning

Drive the version bump from PR labels or Conventional Commits, not manual edits:

| Label | Bump |
|-------|------|
| `release:patch` | `1.0.0` -> `1.0.1` (default) |
| `release:minor` | `1.0.0` -> `1.1.0` |
| `release:major` | `1.0.0` -> `2.0.0` |

Validate that the committed `package.json` version matches the release tag before publishing, so the registry and the repo never disagree.

## Gotchas

Do not override triggering rules on inherited jobs
When extending a reusable workflow, add inputs and services. Rewriting the `on:`/`if:` conditions is how pipelines silently stop running.

Never interpolate untrusted input into `run:`
`${{ github.event.pull_request.title }}` inside a shell line is a script injection. Pass it through `env:` and reference `"$TITLE"` instead.

```yaml
# Bad - PR title is attacker-controlled and executes as shell
- run: echo "Building ${{ github.event.pull_request.title }}"

# Good - passed as an environment variable, quoted
- env:
    TITLE: ${{ github.event.pull_request.title }}
  run: echo "Building $TITLE"
```

`pull_request_target` runs with write permissions and repo secrets
Never combine it with a checkout of the PR head. If you do not specifically need it, use `pull_request`.

Temporary branch overrides must be removed before merge
Pointing a deploy at a feature branch to test the pipeline is fine; leaving it in means the real environment stops deploying. Treat it as a test-only escape hatch.

## Checklist

- [ ] Pipeline logic lives in a reusable workflow, not copy-pasted per repo
- [ ] All actions and reusable workflows pinned to a tag or SHA (never `@main`)
- [ ] `permissions:` declared explicitly and minimally on every job
- [ ] Cloud auth via OIDC, no long-lived access keys in secrets
- [ ] Artifact built once and promoted; image tagged with commit SHA
- [ ] Language version read from `.nvmrc` / `.python-version`, not hardcoded
- [ ] Dependencies installed with `npm ci` (lockfile-exact)
- [ ] Deploy jobs use `environment:` with required reviewers for prod
- [ ] `concurrency` set: cancel-in-progress for CI, queued for deploys
- [ ] No `${{ }}` interpolation of untrusted input into `run:` blocks
- [ ] Release version bump driven by labels or commit convention
