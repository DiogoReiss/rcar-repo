# Phase 2: Completed ✅

**Status:** ✅ Complete  
**Last updated:** 2026-05-06

---

## ✅ All Items Completed

### Documentation
- [x] Updated `01-business.md` — added Gestão de Estoque to Admin module
- [x] Updated `02-frontend.md` — added `estoque/` folder structure
- [x] Updated `03-backend.md` — added inventory module + API endpoints
- [x] Updated `04-database.md` — added Product, StockMovement, ServiceProduct models + seed
- [x] Updated `roadmap.md` — adapted Phase 2 to include Estoque Foundation

### Database (Prisma Schema)
- [x] Added `StockMovementType` enum
- [x] Added `Product` model (with soft delete, estoque mínimo)
- [x] Added `StockMovement` model (with index)
- [x] Added `ServiceProduct` model (N:N between WashService and Product)
- [x] Updated `WashService` with `products` relation
- [x] `prisma generate` passes ✓
- [x] Migration applied (`20260506100613_init`)
- [x] Seed data populated (2 users, 4 services, 5 vehicles, 1 template, 5 products)

### Frontend — Estoque Placeholder Pages
- [x] `admin/estoque/produtos-list/` (component + template + scss)
- [x] `admin/estoque/produto-form/` (component + template + scss)
- [x] `admin/estoque/movimentacoes/` (component + template + scss)
- [x] Updated `admin.routes.ts` with estoque routes
- [x] Added "Estoque" menu item to sidebar
- [x] `pnpm --filter web build` ✓
- [x] `pnpm --filter web test:unit` ✓

### Backend — Common Module
- [x] `common/decorators/roles.decorator.ts`
- [x] `common/decorators/current-user.decorator.ts`
- [x] `common/guards/jwt-auth.guard.ts`
- [x] `common/guards/roles.guard.ts`
- [x] `common/interceptors/transform.interceptor.ts`
- [x] `common/filters/http-exception.filter.ts`
- [x] `common/dto/pagination.dto.ts`
- [x] `common/index.ts` (barrel export)

### Backend — Auth Module
- [x] `modules/auth/dto/login.dto.ts`
- [x] `modules/auth/dto/token-response.dto.ts`
- [x] `modules/auth/dto/forgot-password.dto.ts`
- [x] `modules/auth/dto/reset-password.dto.ts`
- [x] `modules/auth/strategies/jwt.strategy.ts`
- [x] `modules/auth/strategies/refresh-jwt.strategy.ts`
- [x] `modules/auth/auth.service.ts`
- [x] `modules/auth/auth.controller.ts`
- [x] `modules/auth/auth.module.ts`

### Backend — Inventory Module
- [x] `modules/inventory/dto/create-product.dto.ts`
- [x] `modules/inventory/dto/update-product.dto.ts`
- [x] `modules/inventory/dto/create-stock-movement.dto.ts`
- [x] `modules/inventory/inventory.service.ts`
- [x] `modules/inventory/inventory.controller.ts`
- [x] `modules/inventory/inventory.module.ts`

### Backend — Wire Modules
- [x] Import `AuthModule` in `app.module.ts`
- [x] Import `InventoryModule` in `app.module.ts`
- [x] `pnpm --filter api build` ✓
- [x] API starts and all routes mapped ✓

### Backend — Infrastructure
- [x] Docker services running (PostgreSQL, Redis, MinIO)
- [x] `@prisma/adapter-pg` installed for Prisma 7 client engine
- [x] PrismaService updated with pg adapter
- [x] `prisma.config.ts` configured with seed command
- [x] `prisma/seed.ts` with all initial data

### Frontend — Auth Pages
- [x] `auth.service.ts` — calls real API, JWT decoding, token persistence, forgotPassword, resetPassword
- [x] Login page — form with email/password, error display, loading state
- [x] Forgot-password page — form with email, success/error states
- [x] Reset-password page — form with new password + confirm, token from query params
- [x] `auth.interceptor.ts` — already attaches Bearer token ✓
- [x] `refresh-token.interceptor.ts` — already handles 401 refresh ✓

---

## Validation Results

| Check | Result |
|-------|--------|
| `pnpm --filter api build` | ✅ Pass |
| `pnpm --filter web build` | ✅ Pass |
| `pnpm --filter web test:unit` | ✅ Pass (1 test) |
| API starts (`nest start`) | ✅ All routes mapped |
| DB migration | ✅ Applied |
| DB seed | ✅ All data populated |

---

## API Routes Available

```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/inventory/products
GET  /api/inventory/products/low-stock
GET  /api/inventory/products/:id
POST /api/inventory/products
PATCH /api/inventory/products/:id
DELETE /api/inventory/products/:id
POST /api/inventory/movements
GET  /api/inventory/movements
```

---

## Credentials

- **Admin:** admin@rcar.com.br / mudar123
- **Operador:** operador@rcar.com.br / mudar123

---

## Deferred Items (moved to later phases)

- Unit tests for AuthService and AuthGuard → Phase 3
- `forgotPassword` and `resetPassword` full email flow → Phase 6

