# Phase 2–6: Deep Review Backlog Roadmap

**Status:** 🟡 Mixed — core phases delivered, backlog still open
**Prerequisites:** Phase 1 ✅ Complete

---

## Status Sync Notes (2026-05-08)

- Este arquivo consolida **backlog técnico pós-entrega** (deep review), não substitui os TODOs detalhados.
- Referência de status operacional (fonte primária):
  - `docs/todo-backend.md`
  - `docs/todo-frontend.md`
- Verificações rápidas no codebase usadas na sincronização:
  - Backend módulos presentes: `apps/api/src/modules/{auth,customers,fleet,inventory,lavajato,rental,reports,templates,...}`
  - Frontend áreas presentes: `apps/web/src/app/{admin,lavajato,aluguel,core,shared}`
  - CI ativo com build/test web+api: `.github/workflows/ci.yml`
  - Lacunas ainda reais: `apps/api/src/modules/storage/` e `apps/api/src/modules/documents/` ausentes; sem serviço `d4sign`/PDF no backend.
- Quick wins financeiros já entregues (2026-05-08):
  - Backend: `GET /reports/financial-summary`, `/reports/rental/receivables`, `/reports/fleet/maintenance-costs`, `/reports/stock/cost-analysis`
  - Backend: `getDailySummary` e `getMonthlyStats` enriquecidos com custos/métrica de recebíveis
  - Frontend: `/admin/financeiro` com DRE, custos diretos e tabela de contas a receber
- Fechamento do módulo financeiro (2026-05-08):
  - Backend: `GET /payments` standalone + `GET /payments/method-summary`
  - Schema: custo médio ponderado + campos financeiros de manutenção/incidentes
  - Frontend: gráfico de método de pagamento, rentabilidade por veículo, valoração de estoque e export CSV/PDF

### Ordem de execução atualizada (2026-05-08)

- Sequência operacional vigente: **5 -> 2 -> 3 -> 4 -> 1**.
- **Ponto 5 iniciado**: dashboard com seletor de período (`7d`, `30d`, `mês atual`) ligado ao endpoint de gráficos.
- **Ponto 2 iniciado**: fundação backend para geração de PDF com endpoint protegido (`documents/templates/:id/pdf`).

---

## Deep Code Review — Improvement Points

**Last updated:** 2026-05-06

### 🔴 Critical — Security

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| S1 | **No rate limiting on login endpoint** — brute-force attacks can enumerate credentials | `auth.controller.ts` | Credential stuffing |
| S2 | **`forgotPassword` and `resetPassword` are no-ops** — any token or password is accepted without validation | `auth.service.ts:54-67` | Account takeover |
| S3 | **No Helmet middleware** — missing security headers (X-Frame-Options, CSP, HSTS) | `main.ts` | XSS/clickjacking |
| S4 | **Refresh token not invalidated on logout** — reusable until expiry | `auth.service.ts` | Token replay |
| S5 | **JWT stored in localStorage** — vulnerable to XSS; httpOnly cookies are safer | `auth.service.ts (web):66-68` | Token theft |
| S6 | **SSE endpoint `/lavajato/queue/stream` has no auth** — `@UseGuards` is class-level but SSE uses EventSource which can't send Bearer header easily | `lavajato.controller.ts:78` | Data leakage |
| S7 | **No CSRF protection** — relies only on CORS which is insufficient for cookie-based auth | `main.ts` | Cross-site request forgery |

### 🟠 High — Data Integrity & Race Conditions

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| D1 | **Stock debit is not atomic across all products** — each product is debited in a separate transaction; crash mid-loop leaves inconsistent state | `lavajato.service.ts:216-235` | Inventory drift |
| D2 | **Queue position has race condition** — two concurrent `addToQueue` calls read the same `lastEntry.posicao` and assign duplicates | `lavajato.service.ts:96-103` | Duplicate positions |
| D3 | **Availability check doesn't lock vehicle** — user A gets availability, user B creates contract first, user A's create succeeds despite overlap query | `rental.service.ts:96-108` | Double booking |
| D4 | **Soft-delete inconsistency** — customers use `ativo + deletedAt`, vehicles use `status=INATIVO + deletedAt`, but queries don't consistently filter both | Multiple services | Ghost data |
| D5 | **No idempotency on payment creation** — client retry creates duplicate payments | `lavajato.service.ts:162-208` | Double charging |

### 🟡 Medium — Architecture & Performance

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| A1 | **No pagination** — `findAll` endpoints return all records (customers, vehicles, schedules); will degrade as data grows | All `*.service.ts` | Performance |
| A2 | **N+1 in stock debit** — iterates products and runs separate transaction per product instead of batching | `lavajato.service.ts:216` | DB load |
| A3 | **No API health check endpoint** — containers and load balancers can't verify readiness | `main.ts` | Deployment gaps |
| A4 | **No request/response logging** — hard to debug production issues | `main.ts` | Observability |
| A5 | **Frontend services use `firstValueFrom` with `async/await` everywhere** — loses Angular's reactive patterns, can't cancel requests on route change | All admin pages | Memory leaks |
| A6 | **`confirm()` used for destructive actions** — blocks the thread, not accessible, not customizable | `usuarios-list.ts`, `contrato-list.ts` | UX/A11y |
| A7 | **No error boundary in frontend** — unhandled promise rejections silently fail | All `async` methods in components | Silent failures |
| A8 | **ApiService has no interceptor for global error toasts** — each component handles errors differently | `api.service.ts` | UX inconsistency |
| A9 | **SSE EventSource doesn't support auth tokens** — uses EventSource which has no header support; need token-in-query or polyfill | `fila-painel.ts:50-55` | Auth bypass |
| A10 | **Dashboard makes 5 parallel requests** — should be a single `/api/dashboard` endpoint | `dashboard.ts:33-39` | Network overhead |

### 🟢 Low — Code Quality & Testing

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| Q1 | **Only 1 unit test in entire web app** — `app.unit.spec.ts`; zero tests for services, guards, components | `apps/web` | Regression risk |
| Q2 | **Zero unit tests in API** — no `.spec.ts` files at all | `apps/api` | Regression risk |
| Q3 | **Zero E2E tests** — Playwright configured but no test files | `e2e/` | Integration gaps |
| Q4 | **Inconsistent component selectors** — some use `rcar-`, others `lync-` (copilot instructions say `lync`) | Multiple `.ts` | Lint failures |
| Q5 | **`any` types in stock debit** — `quantidadePorUso: any`, `quantidadeAtual: any` | `lavajato.service.ts:214` | Type safety |
| Q6 | **Dead import `computed`** in `dashboard.ts` — imported but unused | `dashboard.ts:1` | Dead code |
| Q7 | **No shared `ConfirmDialog` component** — uses native `confirm()` instead | Frontend | A11y/design |
| Q8 | **`vistoria-chegada.ts:56`** sets kmDevolucao from `res.vehicle` as `any` — wrong cast | `vistoria-chegada.ts` | Runtime bug |
| Q9 | **Models duplicated** — `entities.model.ts` in frontend duplicates backend Prisma types; no shared contract | Both apps | Drift |
| Q10 | **CI doesn't generate Prisma client** — `pnpm --filter api build` may fail in CI without `prisma generate` | `ci.yml` | CI failures |

---

## Prioritized Action Plan

### Sprint 1 — Security Hardening (recommended first)
- [ ] Install & configure `@nestjs/throttler` (rate limit login to 5 req/min)
- [ ] Install `helmet` middleware for security headers
- [ ] Implement real forgot/reset-password flow with time-limited tokens + email
- [ ] Invalidate refresh tokens on logout (store blacklist in Redis)
- [ ] Add `/api/health` endpoint
- [ ] Fix SSE auth (use query-token approach or switch to WebSocket)

### Sprint 2 — Data Integrity
- [ ] Wrap entire stock debit in a single `$transaction` (read + update all products)
- [ ] Use `SELECT FOR UPDATE` or Prisma serializable TX for queue position assignment
- [ ] Add optimistic lock (version column) or `SELECT FOR UPDATE` on vehicle availability during contract creation
- [ ] Add idempotency key to payment endpoints
- [ ] Standardize soft-delete filter pattern (base service or middleware)

### Sprint 3 — Performance & Architecture
- [ ] Add cursor/offset pagination DTO to all list endpoints (reuse `PaginationDto`)
- [ ] Create aggregated `/api/dashboard` endpoint (single query, cache 30s)
- [ ] Add global exception logging middleware
- [ ] Add request/response logging interceptor (NestJS `LoggingInterceptor`)

### Sprint 4 — Frontend Quality
- [ ] Replace `confirm()` with shared `ConfirmDialogComponent`
- [ ] Switch from `firstValueFrom` to proper RxJS patterns or use `resource()` from Angular 19+
- [ ] Add global HTTP error interceptor for toast notifications
- [ ] Fix all `rcar-` selectors to `lync-`
- [ ] Fix `vistoria-chegada.ts` kmDevolucao initialization bug

### Sprint 5 — Testing
- [ ] Write unit tests for `AuthService`, `AuthGuard`, `RolesGuard` (API)
- [ ] Write unit tests for `InventoryService`, `LavajatoService` (API)
- [ ] Write unit tests for key frontend services (AuthService, ApiService)
- [ ] Write Playwright E2E tests for login flow and CRUD happy paths
- [ ] Fix CI pipeline to run `prisma generate` before build

---

## Phase 2: Auth End-to-End + Estoque Foundation ✅

### Backend:
- [x] Start Docker + first migration
- [x] Seed data (admin user, services, vehicles, template, products)
- [x] Common module (decorators, guards, interceptors, filters)
- [x] Auth module (JWT, login/refresh/forgot/reset)
- [x] Inventory module (products CRUD, stock movements)

### Frontend:
- [x] Login, forgot-password, reset-password pages
- [x] Auth service wired to real API
- [x] Estoque placeholder pages + routes

**Milestone:** ✅ User can log in and navigate to estoque pages.

---

## Phase 3: Admin CRUD ✅

### Backend:
- [x] Users module (CRUD with RBAC)
- [x] Customers module (PF/PJ)
- [x] Fleet module (vehicles, availability)
- [x] Wash services catalog (CRUD)
- [x] Inventory low-stock endpoint

### Frontend:
- [x] Dashboard with KPI cards + low-stock alerts
- [x] Admin: Usuarios (list + form)
- [x] Admin: Servicos (list + form)
- [x] Admin: Estoque — Produtos (list + form + movimentações)
- [x] Admin: Frota (list + form)
- [x] Admin: Clientes (list + form, search)

**Milestone:** ✅ Admin can manage all entities.

---

## Phase 4: Lavajato ✅

### Backend:
- [x] Schedule service (create, list by date, status transitions)
- [x] Queue service (walk-in, position, SSE stream)
- [x] Payments module
- [x] Auto-debit stock on service completion

### Frontend:
- [x] Calendário + agendamento form + status actions
- [x] Fila painel (SSE real-time, 2-column layout)
- [x] Atendimentos do dia (KPIs + tables)
- [x] Payment dialogs (schedule + queue)

**Milestone:** ✅ Lavajato fully operational with automatic stock tracking.

---

## Phase 5: Aluguel ✅

### Backend:
- [x] Availability check (period-based, excludes active contracts)
- [x] Contract service (create, open, close, cancel)
- [x] Inspections (saída + chegada with checklist)
- [x] Rental payments

### Frontend:
- [x] Disponibilidade + reserva form (3-step wizard)
- [x] Contrato list + inline abertura + payment dialog
- [x] Vistoria de chegada + devolução (checklist okê/avaria)

**Milestone:** ✅ Rental fully operational.

---

## Phase 6: Supporting & Polish ✅

### Backend:
- [x] Reports module (daily summary, monthly stats, stock report)
- [x] Templates module (CRUD + Handlebars rendering)
- [x] Mail service (Nodemailer, schedule confirmation, password reset, contract ready)
- [x] BullMQ email processor (async email queue)
- [x] Scheduled jobs (daily low-stock alert, morning reminders)
- [x] Swagger already configured in main.ts

### Frontend:
- [x] Template editor + live HTML preview
- [x] D4Sign status badges in contracts list
- [x] Prettier config (.prettierrc)
- [x] GitHub Actions CI (build API, build web, unit tests)

**Milestone:** ✅ Production-ready.

---

## Post-launch Backlog (open)

The following items were intentionally deferred and can be tackled independently:

- [ ] Storage module: actual file upload to MinIO/S3 (CNH, fotos de vistoria)
- [ ] D4Sign full API integration (send doc, webhook, signed PDF download)
- [ ] PDF generation (puppeteer or weasyprint) from rendered templates
- [ ] Portal do Cliente pages (histórico, agendamentos, reservas, documentos)
- [ ] Expandir cobertura E2E (Playwright + cenários backend além do stub)
- [ ] Multi-unit / multi-branch support
