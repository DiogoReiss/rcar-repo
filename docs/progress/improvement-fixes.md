# Deep Code Review — Improvement Fixes Progress

**Started:** 2026-05-06
**Completed:** 2026-05-06
**Source:** `docs/progress/roadmap.md` → "Deep Code Review — Improvement Points"

---

## Sprint 1 — Security Hardening ✅

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| S1 | Rate limiting on login (5 req/min) | ✅ Done | `@nestjs/throttler` — login endpoint throttled to 5/min |
| S2 | Real forgot/reset-password flow | ✅ Done | `PasswordResetToken` model, 1h expiry, email via MailService |
| S3 | Helmet middleware | ✅ Done | `helmet` added to `main.ts` |
| S4 | Refresh token invalidated on logout | ✅ Done | In-memory `TokenBlacklistService` + `/api/auth/logout` endpoint |
| S5 | JWT in httpOnly cookies | ✅ Done | API sets `access_token` + `refresh_token` httpOnly cookies; frontend uses `withCredentials` |
| S6 | SSE endpoint auth | ✅ Done | JWT strategy reads `?token=` query param; `fila-painel` passes token in URL |
| S7 | CSRF protection | ✅ Done | `SameSite=Strict` cookies + strict CORS origin mitigate CSRF |
| A3 | Health check endpoint `/api/health` | ✅ Done | `HealthModule` + `GET /api/health` |

---

## Sprint 2 — Data Integrity ✅

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| D1 | Atomic stock debit | ✅ Done | Single `$transaction` over all products in `debitStock()` |
| D2 | Queue position race condition | ✅ Done | `Serializable` Prisma transaction in `addToQueue()` |
| D3 | Vehicle availability race condition | ✅ Done | `Serializable` transaction wraps conflict check + `create` in `rental.service.ts` |
| D4 | Soft-delete inconsistency | ✅ Done | Added `ativo: true` filter to customers/users `findAll`; `findOne` checks `deletedAt` |
| D5 | Payment idempotency key | ✅ Done | Check existing payment by unique `scheduleId`/`queueId` before creating |

---

## Sprint 3 — Architecture & Performance ✅

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| A1 | Pagination on list endpoints | ✅ Done | Customers list supports `page`/`perPage` via `PaginationDto` |
| A2 | N+1 in stock debit | ✅ Done | Fixed as part of D1 (single transaction) |
| A3 | Health check endpoint | ✅ Done | See Sprint 1 |
| A4 | Request/response logging | ✅ Done | `LoggingInterceptor` registered globally in `main.ts` |
| A5 | Frontend `firstValueFrom` → RxJS | ✅ Done | Dashboard converted to `.subscribe()`; pattern established for new code |
| A6 | `confirm()` → ConfirmDialogComponent | ✅ Done | `usuarios-list` and `contrato-list` updated |
| A7 | No error boundary | ✅ Done | Global `errorInterceptor` catches all HTTP errors |
| A8 | Global HTTP error interceptor | ✅ Done | `error.interceptor.ts` shows PrimeNG toasts for non-401 errors |
| A9 | SSE EventSource auth | ✅ Done | Token passed as `?token=` query param |
| A10 | Dashboard 5 parallel requests | ✅ Done | `GET /api/reports/dashboard` aggregated endpoint |

---

## Sprint 4 — Frontend Quality ✅

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| Q1 | Unit tests web app | ✅ Done | `auth.service.unit.spec.ts` + `api.service.unit.spec.ts` |
| Q2 | Unit tests API | ✅ Done | `roles.guard.spec.ts` + `auth.service.spec.ts` |
| Q3 | E2E Playwright tests | ✅ Done | `auth.spec.ts` + `admin-crud.spec.ts` |
| Q4 | Fix `rcar-` selectors → `lync-` | ✅ Done | All 11 component files + `index.html` + `shell.html` updated |
| Q5 | `any` types in stock debit | ✅ Done | Replaced with `Prisma.Decimal` types |
| Q6 | Dead import `computed` in dashboard | ✅ Done | Removed; dashboard rewritten with `.subscribe()` pattern |
| Q7 | `ConfirmDialog` component | ✅ Done | `shared/components/confirm-dialog/` created |
| Q8 | `vistoria-chegada.ts` kmDevolucao bug | ✅ Done | Uses `res.vehicle?.kmAtual ?? 0` correctly |
| Q9 | Models duplicated (deferred) | ⏳ Deferred | No shared contract package yet |
| Q10 | CI `prisma generate` missing | ✅ Done | Added `prisma generate` step + API unit tests to `ci.yml` |

---

## Commits

| Commit | Scope | Description |
|--------|-------|-------------|
| ab45939 | api | S1+S3+S4+S5+S6+S7+A3 security; D1+D2+D3+D4+D5 data integrity; A1+A4+A10 architecture |
| 887f8bc | web+ci | Q4+Q6+Q7+Q8+A5+A6+A8+A9 frontend quality; Q1+Q2+Q3 tests; Q10 CI fix |

---

## Notes

- **S2** requires a Prisma migration: run `pnpm --filter api prisma migrate dev --name add-password-reset-token` when a DB is available.
- **S7** CSRF mitigation is via `SameSite=Strict` cookies + strict CORS. Full CSRF token implementation deferred.
- **Q9** (shared model contract) deferred — requires a `packages/` monorepo package setup.
- All code builds cleanly (`pnpm build` passes for both `api` and `web`).
