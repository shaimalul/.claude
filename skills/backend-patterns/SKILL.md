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

## Checklist

- [ ] Controller only handles HTTP, delegates to service
- [ ] Service contains business logic
- [ ] Repository handles data access only
- [ ] DTOs used for API responses
- [ ] Async handlers wrapped for error catching
- [ ] Centralized error handling middleware
