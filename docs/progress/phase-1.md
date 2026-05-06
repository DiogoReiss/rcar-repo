# Phase 1: Backend Foundations + Frontend Shell/Routing

**Status:** ✅ Complete  
**Date:** 2026-05-06

---

## Backend — NestJS Init (Steps 1.1–1.8)

### What was done:
- Scaffolded NestJS app in `apps/api` via `@nestjs/cli`
- Removed boilerplate files (controller, service, spec)
- Configured `tsconfig.json` with strict mode and path aliases (`@common/*`, `@modules/*`, `@config/*`)
- Installed core dependencies: `@nestjs/config`, `@nestjs/swagger`, `class-validator`, `class-transformer`
- Created `src/config/app.config.ts` with environment variable management
- Configured `main.ts`: ValidationPipe (whitelist, transform), Swagger docs, CORS, `/api` prefix
- Created `.env.example` and `.env` with all documented variables
- Build verified: `pnpm --filter api build` ✓

### Key decisions:
- Global prefix `/api` so frontend can proxy easily
- Swagger available at `/api/docs`
- ValidationPipe with `whitelist: true` and `forbidNonWhitelisted: true` for security

---

## Backend — Docker Compose (Steps 2.1–2.6)

### What was done:
- Created `docker-compose.yml` at monorepo root with:
  - **PostgreSQL 16**: port 5432, user `rcar`, db `rcar`
  - **Redis 7**: port 6379
  - **MinIO**: ports 9000 (API) + 9001 (console), auto-creates `rcar-documents` bucket
- Created `.dockerignore`
- Scripts `docker:up` / `docker:down` already in root `package.json`

---

## Backend — Prisma + Database Schema (Steps 3.1–3.20)

### What was done:
- Installed Prisma 7 + `@prisma/client`
- Created complete schema with all models:
  - `User` (with roles, soft delete)
  - `Customer` (PF/PJ, CNH, soft delete)
  - `Vehicle` (categories, status, photos)
  - `VehicleMaintenance`
  - `WashService` (catalog)
  - `WashSchedule` (scheduling with status)
  - `WashQueue` (walk-in queue with position)
  - `RentalContract` (full contract with D4Sign)
  - `Inspection` (entry/exit checklists)
  - `ContractIncident` (damages, fines)
  - `Payment` (polymorphic ref to schedule/queue/contract)
  - `Template` (HTML templates for PDF)
  - `AuditLog` (full audit trail)
- Created `PrismaService` (extends PrismaClient, implements OnModuleInit)
- Created `PrismaModule` (global)
- Registered in `AppModule`
- Generated Prisma client
- Build verified ✓

### Note:
- Migration pending until Docker DB is running (`prisma migrate dev --name init`)
- Prisma 7 uses `prisma.config.ts` for datasource URL (not in schema)

---

## Frontend — Layout Shell (Steps 5.1–5.5)

### What was done:
- Created `ShellComponent` (sidebar + header + router-outlet wrapper)
- Created `SidebarComponent` (collapsible navigation with PrimeNG icons, RouterLink)
- Created `HeaderComponent` (user info, toggle button, logout)
- Applied SCSS styles using shared variables (`$sidebar-width`, `$header-height`, etc.)
- Added accessibility features:
  - Skip-link for keyboard navigation
  - ARIA landmarks (`role="navigation"`, `role="banner"`, `role="main"`)
  - `aria-label` on interactive elements

---

## Frontend — Routing (Steps 6.1–6.7)

### What was done:
- Configured `app.routes.ts` with lazy-loading for all feature areas
- Updated `app.config.ts` with `provideHttpClient(withInterceptors([...]))` and `provideAnimationsAsync`
- Created route files:
  - `auth.routes.ts` (login, forgot-password, reset-password)
  - `admin.routes.ts` (dashboard, usuarios, servicos, frota, clientes, templates)
  - `lavajato.routes.ts` (agendamento, fila, atendimentos)
  - `aluguel.routes.ts` (reserva, contratos, devolucao)
  - `portal.routes.ts` (meus-agendamentos, minhas-reservas, meus-documentos, historico)
- Created 16 placeholder components for all routed pages
- Auth guard protects shell routes; unauthenticated users redirected to `/auth/login`
- Build verified ✓, unit tests pass ✓

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm --filter api build` | ✅ Pass |
| `pnpm --filter web build` | ✅ Pass |
| `pnpm --filter web test:unit` | ✅ Pass (1 test) |

