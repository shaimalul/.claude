---
name: security-patterns
description: Application security patterns including OWASP Top 10 prevention, authentication, and secrets management. Use when implementing authentication, input validation, secrets management, or reviewing code for security vulnerabilities.
user-invocable: false
---

# Security Patterns Skill

Apply these patterns for secure application development.

## OWASP Top 10 Checklist

1. **Injection** - Use parameterized queries
2. **Broken Auth** - Strong password hashing, session management
3. **Sensitive Data** - Encrypt at rest and in transit
4. **XXE** - Disable external entities
5. **Access Control** - Verify authorization on every request
6. **Misconfiguration** - Secure defaults, remove debug info
7. **XSS** - Sanitize output, use CSP
8. **Insecure Deserialization** - Validate input types
9. **Vulnerable Components** - Keep dependencies updated
10. **Logging** - Log security events, don't log secrets

## SQL Injection Prevention

```typescript
// BAD - SQL injection vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD - Parameterized query
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);

// GOOD - ORM
await userRepository.findOne({ where: { id: userId } });
```

## XSS Prevention

```typescript
// BAD - Direct HTML insertion
element.innerHTML = userInput;

// GOOD - Text content
element.textContent = userInput;

// GOOD - Sanitized (when HTML needed)
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

## Password Hashing

```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

## JWT Best Practices

```typescript
import jwt from 'jsonwebtoken';

// Short-lived access tokens
const accessToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Longer-lived refresh tokens
const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

## Security Headers

```typescript
// Express helmet
import helmet from 'helmet';
app.use(helmet());

// Or manual headers
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

// Stricter for auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
```

## Secrets Management

```typescript
// BAD - Hardcoded
const API_KEY = 'sk-1234';

// GOOD - Environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY required');

// GOOD - Secrets manager
const secret = await secretsManager.getSecretValue({
  SecretId: 'api-key',
});
```

## Input Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().positive().max(150),
});

// Validate and sanitize
const result = userSchema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

## Error Message Information Leakage

Never expose internal error details to clients:

```typescript
// Bad - leaks internal details to client
catch (error) {
  res.status(500).json({ message: error.message });
  // Could expose: "ECONNREFUSED 127.0.0.1:5432" or "relation users does not exist"
}

// Good - generic message for client, detailed log for operators
catch (error) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Internal error', errorObj);
  res.status(500).json({ message: 'An error occurred processing your request' });
}
```

This applies to SSE events, WebSocket messages, and any client-facing response.

## Safe Logging (No Sensitive Data in Logs)

Never log full config/response objects - log only IDs and metadata:

```typescript
// Bad - logs full config with prompts, tool schemas, and internal details
logger.error('Agent config not found', error, { agentConfig: prefetchedConfig });
logger.info('Agent loaded', { tools: agentConfig.tools });

// Good - log only identifiers and metadata
logger.error('Agent config not found', error, { agentId: effectiveAgentId });
logger.info('Agent loaded', {
  agentId: effectiveAgentId,
  toolsCount: agentConfig.tools?.length,
  promptLength: agentConfig.prompt.length,
});
```

When to apply: Any log statement that includes a config object, API response, or request payload that could contain prompts, tool definitions, credentials, or internal system details.

## Credential Exposure in Process List (Shell Scripts)

Command-line arguments are visible to all users via `ps aux`. Never pass secrets as curl/CLI arguments:

```bash
# Bad - token visible in process list
curl -H "Authorization: Bearer $TOKEN" "$URL"

# Good - write to temp file, pass via @file reference
local _hdr
_hdr=$(mktemp -t hdr-XXXXXX)
printf 'Authorization: Bearer %s' "$TOKEN" > "$_hdr"
curl -H @"$_hdr" "$URL"
rm -f "$_hdr"
```

When to apply: Any shell script that passes credentials to curl, wget, or CLI tools as arguments.

## URL Encoding in Shell Scripts

Partial URL encoding (e.g., only replacing `/`) breaks on special characters. Use `jq @uri` for full RFC 3986 encoding:

```bash
# Bad - only handles slashes
encoded=$(echo "$path" | sed 's|/|%2F|g')

# Good - full URL encoding
encoded=$(printf '%s' "$path" | jq -sRr @uri)
```

When to apply: Any API call where user-provided file paths or identifiers are interpolated into URLs.

## URL Validation Before Navigation, Href, or Clipboard

Server-supplied URLs used as `href`, `document.location.href`, or clipboard content must be validated to prevent open redirect and `javascript:` injection.

```typescript
// Bad - unvalidated server URL used directly
document.location.href = brief.downloadUrl;
<a href={attachment.url}>Link</a>
copy(brief.viewUrl);

// Good - validate https before use
const isHttpsUrl = (url: string): boolean => url.startsWith('https://');

const safeDownloadUrl = isHttpsUrl(brief.downloadUrl) ? brief.downloadUrl : undefined;
const safeViewUrl = isHttpsUrl(brief.viewUrl) ? brief.viewUrl : undefined;

// Safe navigation
if (safeDownloadUrl) { document.location.href = safeDownloadUrl; }

// Safe href (undefined href renders as no link)
<a href={safeViewUrl}>Link</a>

// Safe clipboard
if (safeViewUrl) { copy(safeViewUrl); }
```

**When to apply:** Any time a URL from API response (or database-backed field) is used as `href`, `document.location.href`, or passed to `copy()`. The `isHttpsUrl` helper is minimal and intentionally inline — no shared utility needed.

## Dependency Security

```bash
npm audit
npm audit fix
yarn audit
npm outdated
```

Use Dependabot or Renovate for automated dependency updates. Run Snyk or `npm audit` in CI/CD and block merges on critical vulnerabilities:

```yaml
# GitHub Actions example
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    # Dependency vulnerability scanning
    - name: NPM Audit
      run: npm audit --audit-level=high

    # SAST scanning
    - name: CodeQL Analysis
      uses: github/codeql-action/analyze@v2

    # Secret scanning
    - name: Gitleaks
      uses: gitleaks/gitleaks-action@v2

    # Container scanning (if applicable)
    - name: Trivy Scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.IMAGE_NAME }}
        severity: 'CRITICAL,HIGH'
```

## Checklist

- [ ] Parameterized queries (no SQL injection)
- [ ] Output sanitization (no XSS)
- [ ] Password hashing (bcrypt/Argon2)
- [ ] JWT with short expiry
- [ ] Security headers configured
- [ ] Rate limiting on sensitive endpoints
- [ ] Secrets from environment/secrets manager
- [ ] Input validation on all endpoints
- [ ] Dependencies regularly updated
- [ ] Security logging enabled
- [ ] Error messages to clients are generic (no internal details)
