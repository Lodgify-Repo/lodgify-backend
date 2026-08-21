# Lodgify API (Backend)

Welcome to the official backend repository for the **Lodgify Property & Hotel Management System**. This repository contains a production-ready, highly scalable enterprise API built with [NestJS](https://nestjs.com/).

---

## 🏗 Architecture Overview

The system is designed with enterprise-scale patterns to ensure maintainability, security, and developer productivity. Before you contribute, please familiarize yourself with the core architectural decisions that drive this API.

### 1. Global Prefixing & Versioning
All API endpoints are globally prefixed and versioned. 
By default, controllers will be accessible at: `http://localhost:3000/api/v1/[controller-path]`

### 2. Standardized Responses (`TransformInterceptor`)
To keep frontend consumption predictable, all successful HTTP responses are automatically wrapped in a standardized envelope by the global `TransformInterceptor`. You do not need to wrap your controller returns; just return your data directly.
```json
{
  "data": { ...your data... },
  "meta": { "timestamp": "...", "path": "..." }
}
```

### 3. RFC 7807 Error Handling (`EnterpriseExceptionFilter`)
All exceptions thrown across the application (e.g., `NotFoundException`, `BadRequestException`) are caught by a global exception filter and formatted to comply with the RFC 7807 standard for API errors. 
```json
{
  "type": "https://api.lodgify.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid parameters provided."
}
```
*Note: Always throw standard NestJS HTTP Exceptions or custom domain exceptions (mapped via `DomainErrorCode`).*

### 4. Database & Implicit Transactions (`TransactionManager`)
We use **Prisma ORM** interacting with a PostgreSQL database. 
To keep service layers clean, we implemented a custom `TransactionManager` backed by Node's `AsyncLocalStorage`. 

When you wrap an operation in `TransactionManager.run()`, the active transaction client is securely injected into the context. Our abstract `BaseService` intercepts Prisma calls and uses the transaction client automatically if one is active. **You never need to prop-drill the `tx` variable down to nested service calls.**

### 5. Multi-Tenancy Context
The application supports multi-tenancy. The `TenantContextMiddleware` securely decodes the JWT (or API Key) on incoming requests and injects the Tenant Payload into the request context.
You can extract the current tenant easily in any controller using the custom decorator:
```typescript
@Get()
getStats(@ActiveTenant() tenant: TenantPayload) {
   return this.dashboardService.getStats(tenant.id);
}
```

### 6. Authentication & RBAC (Role-Based Access Control)
Authentication is handled via Passport.js and JWTs. 
- Use `@UseGuards(JwtAuthGuard)` to protect routes.
- Use `@Roles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN)` to restrict access to specific user roles. The `RolesGuard` automatically validates the user's role against the required metadata.

### 7. Background Jobs & Caching
- **Caching**: We use `ioredis` directly via the `CacheService` for high-performance memory caching. It gracefully degrades if Redis is unavailable locally.
- **Queues**: We use `BullMQ` via the `QueueService` for background tasks and async event processing.

### 8. Event-Driven Architecture
We use `@nestjs/event-emitter` to decouple domain logic from side-effects. For example, when a booking is created or a payment succeeds, domain events are emitted which trigger asynchronous listeners (e.g., sending email receipts via Handlebars templates) without blocking the main request cycle.

### 9. Audit Logging
Critical entity changes and actions are automatically tracked via a built-in database audit logging system, ensuring full traceability and compliance for enterprise operations.

### 10. Third-Party Integrations
The system integrates natively with **Paystack** for secure payment processing, alongside Google Cloud and Google Maps for storage and location services.

---

## 🛠 How to Add a New Feature / Module

We use the standard NestJS modular architecture. If you are adding a new business domain (e.g., "Invoices"), follow this blueprint:

### Step 1: Update the Database Schema
1. Open `prisma/schema.prisma` and add your new models.
2. Run `npx prisma generate` to update the strictly-typed Prisma client.
3. Run `npx prisma db push` (or `npx prisma migrate dev`) to update your local DB.

### Step 2: Generate the NestJS Module
Use the NestJS CLI to scaffold the module (this automatically adds it to `app.module.ts`):
```bash
nest g module modules/invoices
nest g controller modules/invoices/http/invoices
nest g service modules/invoices/services/invoices
```

### Step 3: Implement the Service
Extend the `Service` base class to inherit built-in logging and contextual database querying abilities:
```typescript
import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';

@Injectable()
export class InvoicesService extends Service {
  constructor() {
    super('InvoicesService');
  }

  async createInvoice(data: any) {
    // Automatically uses a transaction if called within TransactionManager.run()
    return await this.prisma.invoice.create({ data });
  }
}
```

### Step 4: Implement the Controller
1. Validate incoming data using DTOs (`class-validator`).
2. Apply `JwtAuthGuard` and `RolesGuard` as needed.
3. Keep the controller thin—delegate business logic to the service.

```typescript
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(Role.HOTEL_MANAGER)
  @Post()
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(dto);
  }
}
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Yarn
- PostgreSQL (or Docker to run one)
- Redis (Optional, but recommended for BullMQ and Caching)

### Setup Instructions

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Environment Variables**
   Rename or copy `.env.example` to `.env` and fill in the required variables. 
   ```bash
   cp .env.example .env
   ```
   *Make sure `DATABASE_URL` points to a valid local Postgres instance.*
   *Note: For features like payments and file uploads to work, ensure `PAYSTACK_SECRET_KEY`, `GOOGLE_MAPS_KEY`, and GCS credentials are provided.*

3. **Sync Database**
   ```bash
   npx prisma db push
   ```

4. **Start the Development Server**
   ```bash
   yarn start:dev
   ```

5. **View API Documentation (Swagger)**
   Navigate to [http://localhost:3000/docs](http://localhost:3000/docs) in your browser to interact with the API directly!

---

## 🧪 Testing

- **Unit Tests**: `yarn test`
- **E2E Tests**: `yarn test:e2e`
- **Test Coverage**: `yarn test:cov`

*Ensure your newly added features are covered by tests before submitting a Pull Request.*
