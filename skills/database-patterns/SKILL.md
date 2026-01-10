---
name: database-patterns
description: Database patterns for TypeORM and Prisma including queries, transactions, migrations, and optimization
---

# Database Patterns Skill

Apply these patterns when working with databases in Node.js.

## TypeORM Entity Pattern

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete
  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Organization, (org) => org.users)
  organization: Organization;
}
```

## Prevent N+1 Queries

```typescript
// BAD - N+1 problem
const users = await userRepo.find();
for (const user of users) {
  user.posts = await postRepo.find({ where: { userId: user.id } });
}

// GOOD - Eager loading
const users = await userRepo.find({
  relations: ['posts'],
});

// GOOD - Query builder with join
const users = await userRepo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.isActive = :active', { active: true })
  .getMany();
```

## Transaction Pattern

```typescript
import { DataSource } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // All operations in same transaction
      const order = manager.create(Order, dto);
      await manager.save(order);

      for (const item of dto.items) {
        await manager.decrement(
          Product,
          { id: item.productId },
          'stock',
          item.quantity
        );
      }

      return order;
    });
  }
}
```

## Soft Delete Pattern

```typescript
// Repository method
async softDelete(id: string): Promise<void> {
  await this.repo.update(id, { deletedAt: new Date() });
}

// Query with soft delete filter
async findActive(): Promise<User[]> {
  return this.repo.find({
    where: { deletedAt: IsNull() },
  });
}

// Global soft delete (TypeORM)
@Entity()
@DeleteDateColumn()
export class User {
  @DeleteDateColumn()
  deletedAt: Date;
}
```

## Query Optimization

```typescript
// Select only needed fields
const users = await userRepo.find({
  select: ['id', 'email', 'name'],
  where: { isActive: true },
});

// Use indexes for frequently queried fields
@Entity()
export class User {
  @Index()
  @Column()
  email: string;

  @Index()
  @Column()
  organizationId: string;

  // Composite index
  @Index(['organizationId', 'createdAt'])
}

// Batch operations
await userRepo
  .createQueryBuilder()
  .update(User)
  .set({ isActive: false })
  .where('lastLoginAt < :date', { date: thirtyDaysAgo })
  .execute();
```

## Prisma Patterns

```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

// Query with relations
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true },
});

// Transaction
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  }),
]);
```

## Migration Best Practices

```bash
# TypeORM
npm run typeorm migration:generate -- -n AddUserTable
npm run typeorm migration:run

# Prisma
npx prisma migrate dev --name add_user_table
npx prisma migrate deploy
```

## Checklist

- [ ] Relations loaded efficiently (no N+1)
- [ ] Transactions for multi-step operations
- [ ] Indexes on frequently queried fields
- [ ] Soft delete where appropriate
- [ ] Select only needed fields
- [ ] Batch operations for bulk updates
