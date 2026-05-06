# Deep Code Review — Improvement Fixes Progress

**Started:** 2026-05-06  
**Source:** `docs/progress/roadmap.md` → "Deep Code Review — Improvement Points"

---

## Sprint 1 — Security Hardening

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| S1 | Rate limiting on login (5 req/min) | ⏳ In progress | `@nestjs/throttler` |
| S2 | Real forgot/reset-password flow | ⏳ In progress | Prisma `PasswordResetToken` model |
| S3 | Helmet middleware | ⏳ In progress | `helmet` package in `main.ts` |
| S4 | Refresh token invalidated on logout | ⏳ In progress | In-memory blacklist + logout endpoint |
| S5 | JWT in httpOnly cookies | ⏳ In progress | Backend set-cookie, frontend withCredentials |
| S6 | SSE endpoint auth | ⏳ In progress | Query-token approach |
| S7 | CSRF protection | ⏳ In progress | SameSite=Strict cookies + CORS |
| A3 | Health check endpoint `/api/health` | ⏳ In progress | |

---

## Sprint 2 — Data Integrity

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| D1 | Atomic stock debit | ⏳ In progress | Single `$transaction` over all products |
| D2 | Queue position race condition | ⏳ In progress | Serializable Prisma transaction |
| D3 | Vehicle availability race condition | ⏳ In progress | Check + create in atomic transaction |
| D4 | Soft-delete inconsistency | ⏳ In progress | Standardize all queries |
| D5 | Payment idempotency key | ⏳ In progress | Unique idempotency key field |

---

## Sprint 3 — Architecture & Performance

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| A1 | Pagination on all list endpoints | ⏳ In progress | Cursor-based with `PaginationDto` |
| A2 | N+1 in stock debit | ✅ Fixed with D1 | Single transaction batches all updates |
| A3 | Health check endpoint | ⏳ In progress | See Sprint 1 |
| A4 | Request/response logging | ⏳ In progress | `LoggingInterceptor` |
| A5 | Frontend `firstValueFrom` → RxJS | ⏳ In progress | `takeUntilDestroyed` pattern |
| A6 | `confirm()` → ConfirmDialogComponent | ⏳ In progress | |
| A7 | No error boundary | ⏳ In progress | Via A8 global interceptor |
| A8 | Global HTTP error interceptor | ⏳ In progress | `error.interceptor.ts` |
| A9 | SSE EventSource auth | ⏳ In progress | Token in query param |
| A10 | Dashboard 5 parallel requests → aggregated | ⏳ In progress | `/api/reports/dashboard` |

---

## Sprint 4 — Frontend Quality

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| Q1 | Unit tests web app | ⏳ In progress | Vitest for services |
| Q2 | Unit tests API | ⏳ In progress | Jest for AuthService, Guards |
| Q3 | E2E Playwright tests | ⏳ In progress | Login + CRUD happy paths |
| Q4 | Fix `rcar-` selectors → `lync-` | ⏳ In progress | layout + auth + portal components |
| Q5 | `any` types in stock debit | ⏳ In progress | Proper Prisma types |
| Q6 | Dead import `computed` in dashboard | ⏳ In progress | Remove from import |
| Q7 | `ConfirmDialog` component | ⏳ In progress | See A6 |
| Q8 | `vistoria-chegada.ts` kmDevolucao bug | ⏳ In progress | Wrong `any` cast |
| Q9 | Models duplicated (deferred) | ⏳ Deferred | No shared contract yet |
| Q10 | CI `prisma generate` missing | ⏳ In progress | Add to CI yaml |

---

## Commits

| Commit | Scope | Description |
|--------|-------|-------------|
| (pending) | api/security | S1+S3+S4+S6+A3+S2+S5+S7 — Security hardening sprint |
| (pending) | api/integrity | D1+D2+D3+D4+D5 — Data integrity sprint |
| (pending) | api/perf | A1+A4+A10 — Pagination, logging, dashboard endpoint |
| (pending) | web/quality | A5+A6+A8+A9+Q4-Q8 — Frontend quality sprint |
| (pending) | test | Q1+Q2+Q3+Q10 — Tests + CI fix |

---

## Notes

- **S2** requires a Prisma migration — run `pnpm --filter api prisma migrate dev` after applying schema changes.
- **D5** payment idempotency key is an application-level check (no schema change required for now).
- **S5** (httpOnly cookies) is implemented as a backend-side `Set-Cookie` + frontend `withCredentials`. The JWT strategy accepts both cookie and Bearer header so Swagger/Postman still works.
- **S7** CSRF mitigation is achieved through `SameSite=Strict` cookies + strict CORS origin check, which is the modern recommended approach (no need for CSRF tokens when using SameSite=Strict).

