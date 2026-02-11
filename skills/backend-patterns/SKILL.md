---
name: backend-patterns
description: Node.js/Express and NestJS backend patterns including three-layer architecture, service patterns, and repository patterns
---

# Backend Patterns Skill

Apply these patterns when writing Node.js/Express or NestJS backend code.

## Three-Layer Architecture (STRICT)

```
Controller Layer → Service Layer → Repository Layer
     (HTTP)        (Business)        (Data)
```

**Rules:**
- Controllers ONLY handle HTTP request/response
- Services contain ALL business logic
- Repositories handle ALL database operations
- Never skip layers (Controller → Repository is WRONG)

## Controller Pattern

```typescript
// Keep controllers thin - delegate to services
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return UserResponseDto.fromEntity(user);
  }
}
```

## Service Pattern

```typescript
// Business logic lives here
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Validation, business rules, orchestration
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.create({ ...dto, password: hashedPassword });
  }
}
```

## Repository Pattern

```typescript
// Data access only - no business logic
@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }
}
```

## NestJS Module Organization

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Only export services, not repositories
})
export class UsersModule {}
```

## Express Middleware Pattern

```typescript
// Wrap async handlers
export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Centralized error handling
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(status).json({ status: 'error', message: err.message });
};
```

## DTO Transformation

```typescript
// Never expose internal models directly
export class UserResponseDto {
  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // Exclude: password, internal IDs, soft delete flags
    };
  }
}
```

## Refactoring Patterns

### When You See DB Query in Controller → Extract to Repository

```typescript
// Before (bad) - controller does data access
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users WHERE active = true');
  res.json(users);
});

// After (good) - repository handles data access
// repositories/userRepository.ts
export const userRepository = {
  findActive: async (filters?: UserFilters): Promise<User[]> => {
    return db.query('SELECT * FROM users WHERE active = true', filters);
  },
  findById: async (id: string): Promise<User | null> => {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  },
};

// controllers/userController.ts
app.get('/users', async (req, res) => {
  const users = await userRepository.findActive(req.query);
  res.json(users);
});
```

### When You See Business Logic in Controller → Extract to Service

```typescript
// Before (bad) - controller does business logic
app.post('/orders', async (req, res) => {
  const items = req.body.items;
  let total = 0;
  for (const item of items) {
    const product = await productRepo.findById(item.productId);
    if (product.stock < item.quantity) throw new Error('Out of stock');
    total += product.price * item.quantity;
  }
  if (req.user.membershipLevel === 'gold') total *= 0.9;
  const order = await orderRepo.create({ userId: req.user.id, items, total });
  await emailService.sendConfirmation(req.user.email, order);
  res.json(order);
});

// After (good) - service handles business logic
// services/orderService.ts
export const orderService = {
  create: async (userId: string, items: OrderItem[]): Promise<Order> => {
    await validateStock(items);
    const total = await calculateTotal(items, userId);
    const order = await orderRepository.create({ userId, items, total });
    await notificationService.sendOrderConfirmation(order);
    return order;
  },
};

// controllers/orderController.ts
app.post('/orders', async (req, res) => {
  const order = await orderService.create(req.user.id, req.body.items);
  res.json(toOrderResponse(order));
});
```

### When You See Validation Logic Scattered → Centralize with Zod

```typescript
// Before (bad) - validation in controller
app.post('/users', async (req, res) => {
  if (!req.body.email) throw new Error('Email required');
  if (!req.body.email.includes('@')) throw new Error('Invalid email');
  if (!req.body.password || req.body.password.length < 8) throw new Error('Password too short');
  // ...
});

// After (good) - validation schema
// validators/userValidator.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// middleware/validate.ts
export const validate = (schema: z.Schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.flatten() });
  }
  req.body = result.data;
  next();
};

// controllers/userController.ts
app.post('/users', validate(createUserSchema), asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(StatusCodes.CREATED).json(toUserResponse(user));
}));
```

### When You See Config/Secrets Hardcoded → Extract to Config Module

```typescript
// Before (bad) - hardcoded values
const db = new Database('postgres://user:pass@localhost:5432/mydb');
const stripe = new Stripe('sk_live_xxx');

// After (good) - centralized config
// config/index.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
} as const;

// Validate required env vars on startup
const required = ['DATABASE_URL', 'STRIPE_SECRET_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

## HTTP Status Codes

**Never use raw numbers** - use the `http-status-codes` package:

```typescript
// Bad - what does 429 mean?
if (response.status === 429) throw new Error('Rate limited');
res.status(404).json({ error: 'Not found' });
res.status(500).json({ error: 'Server error' });

// Good - self-documenting
import { StatusCodes } from 'http-status-codes';

if (response.status === StatusCodes.TOO_MANY_REQUESTS) throw new Error('Rate limited');
res.status(StatusCodes.NOT_FOUND).json({ error: 'Not found' });
res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error' });
```

## Dependency Injection Pattern

For testability, use interfaces and Context for DI:

```typescript
// types/services.ts
interface IDataItemService {
  getAll(filters?: DataItemFilters): Promise<DataItem[]>;
  getById(id: string): Promise<DataItem | null>;
  classify(id: string): Promise<ClassificationResult>;
}

// context/DependencyContext.tsx
const DependencyContext = createContext<{ dataItemService: IDataItemService } | null>(null);

export const DependencyProvider: React.FC<{
  overrides?: { dataItemService?: IDataItemService };
  children: React.ReactNode;
}> = ({ overrides, children }) => (
  <DependencyContext.Provider value={{ dataItemService: overrides?.dataItemService ?? dataItemService }}>
    {children}
  </DependencyContext.Provider>
);

export const useDataItemService = () => {
  const ctx = useContext(DependencyContext);
  if (!ctx) throw new Error('Missing DependencyProvider');
  return ctx.dataItemService;
};
```

## Feature Parity Checklist (Dual Code Paths)

When adding a new code path alongside a legacy path (e.g., feature flag branches):

```
// Before shipping a new path, verify feature parity:
// [ ] Text/data streaming
// [ ] Chart extraction
// [ ] Tool execution tracking
// [ ] Tool prefix application
// [ ] Error handling (type guards, generic client messages)
// [ ] Logging (correct levels, no sensitive data)
// [ ] Correlation ID propagation
```

When to apply: Any time you add a new implementation behind a feature flag while keeping the legacy path.

## Error Message Security

Never leak internal error details to clients:

```typescript
// Bad - leaks internal details
const errorEvent = {
  message: error.message,  // Could expose "ECONNREFUSED to db:5432"
};

// Good - generic message for client, detailed log for ops
logger.error('Request failed', errorObj);  // Internal
const errorEvent = {
  message: ERROR_MESSAGES.PROCESSING_ERROR,  // Generic for client
};
```

## Avoid Duplicate Expensive Calls

Cache results of expensive operations within the same request flow:

```typescript
// Bad - calls the same API twice
const config = await getConfig(token, customerId);
const messages = buildMessages(config.prompt);
const tools = (await getConfig(token, customerId)).tools;  // DUPLICATE

// Good - reuse result
const config = await getConfig(token, customerId);
const messages = buildMessages(config.prompt);
const tools = config.tools;  // REUSE
```

## Immutable Request/Response Objects

Never mutate shared request or response objects. Use adapters:

```typescript
// Bad - mutates shared Express response object
request.streamWriter.write = interceptor.intercept.bind(interceptor);

// Good - Proxy-based adapter
const interceptedWriter = new Proxy(request.streamWriter, {
  get(target, prop) {
    if (prop === 'write') return interceptor.intercept.bind(interceptor);
    return Reflect.get(target, prop);
  },
});
```

## Checklist

- [ ] Controller only handles HTTP, delegates to service
- [ ] Service contains business logic
- [ ] Repository handles data access only
- [ ] DTOs used for API responses
- [ ] Async handlers wrapped for error catching
- [ ] Centralized error handling middleware
- [ ] Validation uses Zod schemas with validate middleware
- [ ] Config/secrets loaded from environment variables
- [ ] HTTP status codes use `http-status-codes` package
- [ ] Interfaces defined for testability (DI pattern)
- [ ] No non-null assertions (!) - use early validation guards
- [ ] Error messages to clients are generic (no internal details)
- [ ] Dual code paths have feature parity
- [ ] No duplicate expensive API/DB calls in same flow
