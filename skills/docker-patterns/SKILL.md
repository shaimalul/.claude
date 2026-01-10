---
name: docker-patterns
description: Docker best practices including multi-stage builds, security, optimization, and Compose patterns
---

# Docker Patterns Skill

Apply these patterns when working with Docker.

## Multi-Stage Build (Node.js)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER nodeuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

## .dockerignore

```
node_modules
npm-debug.log
Dockerfile*
docker-compose*
.git
.gitignore
.env*
*.md
.vscode
coverage
dist
```

## Docker Compose (Development)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

## Security Best Practices

```dockerfile
# Use specific version tags
FROM node:20.10-alpine3.18

# Run as non-root user
USER node

# Don't run as PID 1 (use dumb-init or tini)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Read-only filesystem
# docker run --read-only ...

# No new privileges
# docker run --security-opt=no-new-privileges ...
```

## Layer Optimization

```dockerfile
# Bad - invalidates cache on any code change
COPY . .
RUN npm ci

# Good - dependencies cached separately
COPY package*.json ./
RUN npm ci
COPY . .
```

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1
```

## Checklist

- [ ] Multi-stage build
- [ ] Non-root user
- [ ] .dockerignore configured
- [ ] Specific version tags
- [ ] Health check defined
- [ ] Layer optimization
- [ ] Minimal base image (alpine)
