---
name: api-design
description: RESTful API design patterns, validation, error responses, and HTTP status codes for Node.js backends. Use when designing REST APIs, implementing validation middleware, error responses, or choosing HTTP status codes.
user-invocable: false
---

# API Design Skill

Apply these patterns when designing and implementing APIs.

## RESTful Conventions

```
GET    /resources          → List (with pagination)
GET    /resources/:id      → Get single resource
POST   /resources          → Create resource
PUT    /resources/:id      → Replace resource
PATCH  /resources/:id      → Partial update
DELETE /resources/:id      → Delete resource

# Nested resources
GET    /users/:id/posts    → User's posts
POST   /users/:id/posts    → Create post for user

# Actions (when REST doesn't fit)
POST   /orders/:id/cancel
POST   /users/:id/activate
```

## Status Codes (ALWAYS use http-status-codes)

```typescript
import { StatusCodes } from 'http-status-codes';

// Success
StatusCodes.OK                    // 200 - GET, PUT, PATCH
StatusCodes.CREATED               // 201 - POST success
StatusCodes.NO_CONTENT            // 204 - DELETE success

// Client Errors
StatusCodes.BAD_REQUEST           // 400 - Validation error
StatusCodes.UNAUTHORIZED          // 401 - Not authenticated
StatusCodes.FORBIDDEN             // 403 - Not authorized
StatusCodes.NOT_FOUND             // 404 - Resource not found
StatusCodes.CONFLICT              // 409 - Duplicate resource
StatusCodes.UNPROCESSABLE_ENTITY  // 422 - Business logic error
StatusCodes.TOO_MANY_REQUESTS     // 429 - Rate limited

// Server Errors
StatusCodes.INTERNAL_SERVER_ERROR // 500 - Unexpected error
```

## Response Formats

```typescript
// Success with data
{
  "data": { ... }
}

// Success with pagination
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}

// Error response
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

## Validation with Zod

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// Validation middleware
export const validate = (schema: z.Schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};
```

## Validation with class-validator (NestJS)

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## Pagination Pattern

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

async findPaginated(params: PaginationParams): Promise<PaginatedResponse<User>> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const [data, total] = await this.repo.findAndCount({
    skip,
    take: limit,
  });

  return {
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}
```

## Checklist

- [ ] Using http-status-codes (never raw numbers)
- [ ] Consistent response format
- [ ] Validation at controller level
- [ ] Proper error response structure
- [ ] Pagination for list endpoints
- [ ] RESTful resource naming
