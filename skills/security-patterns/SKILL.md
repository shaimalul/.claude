---
name: security-patterns
description: Application security patterns including OWASP Top 10 prevention, authentication, and secrets management
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
