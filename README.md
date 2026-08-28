# Lodgify API (Backend)

Welcome to the official backend repository for the **Lodgify Property & Hotel Management System**. This repository contains a production-ready, highly scalable enterprise API built with [NestJS](https://nestjs.com/).

---

##  Architecture Overview

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

### 3. Error Handling & Domain Errors
We utilize custom domain exceptions (e.g., `DomainError`) mapped to specific business logic error codes (like `ViewingErrorCodes`, `OfferErrorCodes`). This ensures that HTTP responses are strictly typed and predictable. All exceptions thrown across the application are caught by a global exception filter and formatted to comply with standard API error formats (RFC 7807).
```json
{
  "type": "https://api.lodgify.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid parameters provided."
}
```
**Design Decision:** Using custom `DomainError` instead of generic HTTP exceptions allows the frontend to predictably parse error codes and display localized/customized error messages based on the exact failure reason (e.g., `SLOT_UNAVAILABLE`).

### 4. Database & ORM (Prisma)
We use **Prisma ORM** interacting with a PostgreSQL database (hosted on Aiven). 
The `PrismaService` is injected globally across modules to handle data access. We rely on Prisma's implicit transactions or nested writes for complex atomic operations.
**Design Decision:** We intentionally removed the custom `TransactionManager` abstraction in favor of standard Prisma client injection (`this.prisma`). This keeps the service layer clean, reduces abstraction overhead, and leverages Prisma's native nested-write capabilities for atomic operations.

### 5. Multi-Tenancy & Authorization Context
The application supports multi-tenancy inherently through user roles and property ownership relationships. The authentication layer decodes the JWT on incoming requests and injects the User payload into the request context.
You can extract the current user in any controller using the `@Request()` decorator:
```typescript
@Get()
getStats(@Request() req: any) {
   return this.dashboardService.getStats(req.user.id);
}
```

### 6. Authentication & RBAC (Role-Based Access Control)
Authentication is handled via standard JWTs. 
- Use `@UseGuards(JwtAuthGuard)` to protect routes.
- Use `@Roles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN, Role.PROPERTY_OWNER, Role.AGENT)` to restrict access to specific user roles. The `RolesGuard` automatically validates the user's role against the required metadata.
**Design Decision:** Decorator-based RBAC keeps controllers highly readable and decouples authorization enforcement from core business logic.

### 7. Event-Driven Architecture (`EventBus`)
To decouple domain logic from side-effects (e.g., sending emails, updating analytics, notifying agents), we utilize a strictly-typed custom `EventBus` (`AppEvents`).
For example, when a property offer is accepted, we emit a domain event:
```typescript
EventBus.emit('property_sale:milestone_updated', { milestoneId, offerId, status }, 'OffersService');
```
**Design Decision:** A centralized, strictly-typed `EventBus` prevents tight coupling between modules (e.g., Offers and Notifications), ensuring that the core transaction executes quickly without waiting on external I/O tasks. It provides autocomplete and type safety over generic event emitters.

### 8. Core Modules Overview
The platform has evolved significantly and encompasses multiple sophisticated modules:
- **Agent Management Module:** Comprehensive CRM for real estate agents, covering profile verification, property representation authorizations, lead tracking pipelines, automated commission calculations, and performance leaderboards.
- **Property Sales Module:** End-to-end real estate transaction management. Features include offer submission, counter-offer negotiation rounds, earnest deposit handling (escrow integrations), 7-stage sales pipeline tracking, and secure legal document management.
- **Inventory & Operations:** Stock tracking, supplier reliability scoring, low stock alerts, and multi-branch hotel inventory management.
- **Dashboard & Analytics:** Financial reporting, occupancy tracking, and agent performance analytics.
- **Viewings & Offers Coordination:** Seamless scheduling for open houses, private showings, and virtual tours with automated conflict prevention logic.

---

## How to Add a New Feature / Module

We use the standard NestJS modular architecture. If you are adding a new business domain (e.g., "Invoices"), follow this blueprint:

### Step 1: Update the Database Schema
1. Open `prisma/schema.prisma` and add your new models.
2. Run `yarn prisma generate` to update the strictly-typed Prisma client.
3. Run `yarn prisma db push` (or `yarn prisma migrate dev`) to update the DB.

### Step 2: Generate the NestJS Module
Use the NestJS CLI to scaffold the module (this automatically adds it to `app.module.ts`):
```bash
npx nest g module modules/invoices
npx nest g controller modules/invoices/http/invoices
npx nest g service modules/invoices/services/invoices
```

### Step 3: Implement the Service
Inject the `PrismaService` for data access:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(data: any) {
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

##  Getting Started (Local Development)

### Prerequisites
- Node.js (v26.x)
- Yarn v1.x (Strictly use Yarn for package management)
- PostgreSQL (or use the remote Aiven instance)

### Setup Instructions

1. **Install Dependencies**
   ```bash
   yarn install --frozen-lockfile
   ```

2. **Environment Variables**
   Rename or copy `.env.example` to `.env` and fill in the required variables. 
   ```bash
   cp .env.example .env
   ```
   *Note: For features like payments and file uploads to work, ensure `PAYSTACK_SECRET_KEY`, `FRONTEND_URL`, and Google Cloud credentials are provided.*

3. **Sync Database**
   ```bash
   yarn prisma db push
   ```

4. **Start the Development Server**
   ```bash
   yarn start:dev
   ```

5. **View API Documentation (Swagger)**
   Navigate to [http://localhost:3000/docs](http://localhost:3000/docs) in your browser to interact with the API directly.

---

##  Testing

- **Unit Tests**: `yarn test`
- **E2E Tests**: `yarn test:e2e`
- **Test Coverage**: `yarn test:cov`

*Ensure your newly added features are covered by tests before submitting a Pull Request.*
