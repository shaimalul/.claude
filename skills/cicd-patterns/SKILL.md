---
name: cicd-patterns
description: CI/CD pipeline patterns for GitHub Actions including testing, building, and deployment stages. Use when writing CI/CD pipelines for GitHub Actions, including test, build, and deployment stages.
---

# CI/CD Patterns Skill

Apply these patterns when setting up CI/CD pipelines.

## GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy
        run: echo "Deploying to staging..."

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy
        run: echo "Deploying to production..."
```

## Pipeline Best Practices

```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Parallel jobs
jobs:
  lint:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
  typecheck:
    runs-on: ubuntu-latest

# Matrix builds
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, macos-latest]

# Environment protection
environment:
  name: production
  url: https://example.com
```

## Deployment Strategies

```yaml
# Blue-Green
- name: Deploy new version
  run: |
    kubectl set image deployment/app app=$IMAGE:$TAG
    kubectl rollout status deployment/app

# Canary
- name: Deploy canary
  run: |
    kubectl apply -f k8s/canary.yaml
    # Monitor metrics
    # If successful, promote to production
```

## Checklist

- [ ] Test stage before build
- [ ] Caching for dependencies
- [ ] Environment protection
- [ ] Manual approval for production
- [ ] Docker layer caching
- [ ] Coverage reporting
- [ ] Secrets management
