---
name: docker-patterns
description: Docker conventions for multi-stage builds, non-root users, build secrets, and image slimming. Use when writing Dockerfiles or .dockerignore files.
globs: "Dockerfile*,.dockerignore"
user-invocable: false
---

# Docker Patterns

Keep Dockerfiles minimal. Health probes and multi-arch builds belong to the orchestrator and CI, not the image definition.

## Base Images

ALWAYS use a slim base, and pull through a registry mirror in CI to avoid Docker Hub rate limits.

```dockerfile
# Good - Alpine (smallest attack surface)
FROM node:22-alpine AS builder

# Good - registry mirror (avoids Docker Hub pull limits)
FROM public.ecr.aws/docker/library/node:22-alpine AS builder

# Bad - full Debian unnecessarily
FROM node:22-bullseye
```

## Multi-Stage Build

Two stages: `builder` (install + compile) then a clean runtime stage that copies only what runs. Never carry build toolchains or dev dependencies into the runtime image.

```dockerfile
# Good - standard Node.js pattern
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
USER node
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 8080
CMD ["node", "dist/main.js"]
```

```dockerfile
# Good - Next.js standalone output pattern
FROM node:22-alpine
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --chown=nextjs:nodejs ./.next/standalone /app/
COPY --chown=nextjs:nodejs ./.next/static /app/.next/static
COPY --chown=nextjs:nodejs ./public /app/public
USER nextjs
CMD ["node", "server.js"]
```

## Non-Root User

| Base Image | Pattern |
|------------|---------|
| `node:*-alpine` | `USER node` (built-in uid 1000) |
| `node:*-slim` | `RUN groupadd -r appuser && useradd -r -g appuser appuser` |
| Next.js | `addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs` |

NEVER leave user unset (defaults to root).

## Private Registry Credentials

Use BuildKit secret mounts. The secret is available only for that `RUN` and never lands in a layer:

```dockerfile
# Good - BuildKit secret mount, nothing persisted
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm ci

# Bad - ENV bakes the token into the image permanently
ENV NPM_TOKEN=$NPM_TOKEN
RUN npm ci
```

`ARG` is better than `ENV` but still recoverable from build history. Prefer secret mounts for anything genuinely sensitive.

## .dockerignore

Keep the build context small. A bloated context slows every build and risks copying secrets into the image.

```
# Good - typical .dockerignore
.git
.gitignore
.github/
node_modules
dist/
coverage/
*.md
.env*
.DS_Store
npm-debug.log
```

Excluding `node_modules` is correct when the builder stage runs `npm ci` itself. Only keep it in the context if your pipeline deliberately passes prebuilt dependencies in as an artifact.

## Health Checks

Do NOT add `HEALTHCHECK` when deploying to Kubernetes. Liveness and readiness probes are configured in the deployment manifest; defining both creates two sources of truth and conflicting restart signals. `HEALTHCHECK` is appropriate only for plain Docker or Compose deployments.

## Multi-Architecture

Multi-arch (`linux/amd64` + `linux/arm64`) is handled in CI by `docker buildx`, not in the Dockerfile. Keep the Dockerfile architecture-neutral: avoid hardcoded arch strings in downloaded binary URLs, and use `$TARGETARCH` where an arch-specific artifact is unavoidable.

## Checklist

- [ ] Slim base image, pinned by tag, pulled via a mirror in CI
- [ ] Two-stage build (builder -> runtime); no build toolchain in the runtime stage
- [ ] Non-root user in runtime stage
- [ ] Registry credentials via BuildKit secret mounts, never `ENV`
- [ ] `.dockerignore` keeps the build context small and excludes `.env*`
- [ ] No `HEALTHCHECK` when Kubernetes probes are in use
- [ ] Dockerfile is architecture-neutral (buildx handles multi-arch)
