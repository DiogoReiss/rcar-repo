# RCar — Deep Code Review #2

**Date:** 2026-05-06  
**Base commit:** 250029e (after Deep Review #1 fixes)  
**Scope:** Full codebase re-audit post improvement-fixes sprint

---

## 🔴 Critical — Security

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| S8 | **`bcrypt` work factor inconsistency** — `users.service.ts` uses 10 rounds but `auth.service.ts` (password reset) uses 12. NIST recommends ≥ 12 | `users.service.ts:39`, `auth.service.ts` | Weaker password hashing for user creation |
| S9 | **`authGuard` relies only on in-memory signal** — after a cookie expires on the server (15 min), the frontend guard still returns `true` until the next API call returns 401. An expired-cookie session is effectively invisible to routing | `auth.guard.ts` | Silent auth bypass in routing layer |
| S10 | **Password minimum length is only 6 chars** — `LoginDto` enforces `@MinLength(6)` and `CreateUserDto` likely the same. NIST SP 800-63B recommends minimum 8. | `auth/dto/login.dto.ts`, `users/dto/create-user.dto.ts` | Weak password policy |
| S11 | **No account lockout after failed login attempts** — ThrottlerGuard limits 5 req/min per IP, but not per account. Distributed attacks from multiple IPs can still enumerate credentials slowly | `auth.controller.ts` | Credential stuffing via distributed attack |
| S12 | **SSE token exposed in server access logs** — passing `?token=<jwt>` as query param means the token appears in Nginx/proxy access logs and browser history | `lavajato.controller.ts`, `fila-painel.ts` | Token leakage via logs |

---

## 🟠 High — Data Integrity & Race Conditions

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| D6 | **`rental.service.ts` `registerPayment` has no idempotency check** — D5 only fixed lavajato payments. Rental contract payments can still be duplicated on client retry | `rental.service.ts:registerPayment` | Double charging for rentals |
| D7 | **`closeContract` doesn't prevent double-closing** — there's no guard against calling `closeContract` on an already-`ENCERRADO` contract, which would create a duplicate inspection, re-update the vehicle km, and may emit another payment | `rental.service.ts:closeContract` | Duplicate data on retry |
| D8 | **`openContract` doesn't update vehicle status atomically with contract** — wait, it does use `$transaction`. But the transaction can fail after the contract update if the vehicle update fails, leaving an orphaned `ATIVO` contract without `ALUGADO` vehicle | `rental.service.ts:openContract` | Status inconsistency |
| D9 | **`inventory.createMovement` is not idempotent** — a network retry creates a second stock movement and double-debits/credits inventory | `inventory.service.ts:createMovement` | Inventory drift on retry |

---

## 🟡 Medium — Architecture & Performance

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| A11 | **Pagination missing on 5 endpoints** — `fleet.findAll`, `inventory.findAllProducts`, `rental.findAll`, `inventory.findMovements` (`take: 100` hardcoded), `wash.findAll`. All return unbounded result sets | `fleet.service.ts`, `inventory.service.ts`, `rental.service.ts`, `wash.service.ts` | Performance degradation at scale |
| A12 | **`firstValueFrom` / `async-await` still used in 14 frontend service files** — only `dashboard.ts` was converted. Every other component (frota service, lavajato, aluguel, etc.) still blocks and loses cancellation on destroy | `frota.service.ts`, `clientes.service.ts`, `usuarios.service.ts`, `servicos.service.ts`, and 10 component files | Memory leaks / uncancelled HTTP requests |
| A13 | **Frontend pagination not wired to UI** — `clientes.service.ts` now calls paginated API but the list component has no page controls and doesn't pass `page`/`perPage` | `clientes-list/clientes-list.ts`, `clientes-list.html` | Silently only shows first 50 customers |
| A14 | **No response envelope / transform interceptor in use** — `TransformInterceptor` exists and is imported in `common/interceptors` but is never registered globally. Pagination responses are ad-hoc objects with no standard shape | `main.ts`, `common/interceptors/transform.interceptor.ts` | Inconsistent API response shapes |
| A15 | **SSE stream sends a static `{ ping: true }` every 3 seconds regardless of real changes** — all clients poll the full queue on every ping even when nothing changed | `lavajato.controller.ts:queueStream` | Unnecessary DB load; 3 s latency is also a poor UX |
| A16 | **No `DestroyRef` / `takeUntilDestroyed` in components with observable subscriptions** — `fila-painel.ts` has an open `.subscribe()` in `onAdvance`/`onPay` that never unsubscribes | `fila-painel.ts`, and others using `.subscribe()` directly | Memory leaks |
| A17 | **`templates-list.ts` still uses `firstValueFrom`** — template preview and list fetching are async/await, not reactive | `templates-list.ts` | Memory leaks, inconsistent pattern |
| A18 | **`frota.service.ts` uses `firstValueFrom` and holds state with `signal` but no error state** — errors during vehicle load are silently swallowed | `frota.service.ts` | Silent failures |

---

## 🟢 Low — Code Quality & Testing

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| Q11 | **`wash.service.ts` has no `remove` / soft-delete method** — services can only be deactivated via `update({ ativo: false })`, which is not exposed in the controller with a proper `DELETE` endpoint | `wash.service.ts`, `wash.controller.ts` | No delete UX for wash services |
| Q12 | **`templates.service.ts` `findAll` includes inactive templates only if `ativo: true` filter** — but `findAll` returns active only with no way to list inactive; admin may need to recover a deactivated template | `templates.service.ts` | Admin UX gap |
| Q13 | **`PaginationDto` `page` default is 1 but computed `skip` is `(page-1)*perPage`** — if a bad client sends `page=0`, skip becomes `-20`, which is a Prisma error | `customers.service.ts:findAll` | Potential runtime error |
| Q14 | **No `@SkipThrottle()` on health endpoint** — the health check is throttled at 60 req/min, which could block load balancer probes in high-concurrency environments | `health.controller.ts` | Health check false negatives |
| Q15 | **`auth.service.unit.spec.ts` uses `require()` inside a spec** — `jest.spyOn(router, 'navigate')` references `require('@angular/router').Router` which is not valid ESM style and will likely fail in Vitest | `auth.service.unit.spec.ts` | Broken unit test |
| Q16 | **No `@IsUUID()` or `@IsUUID('4')` validation on route `:id` params** — a malformed UUID like `abc` reaches Prisma and causes a database error instead of a clean 400 | All controllers with `:id` params | Unhandled DB errors |
| Q17 | **`TemplateType` enum is not shared** — `TemplateType` enum values are defined in `@rcar/shared-types` but the template form component likely uses string literals | `templates-list.ts`, `shared-types/index.ts` | Type drift risk |
| Q18 | **`import { takeUntilDestroyed } from '@angular/core/rxjs-interop'` imported in dashboard but `DestroyRef` not injected** — the import was added but never used (dashboard uses `.subscribe()` without `takeUntilDestroyed`) | `dashboard.ts` — removed, but pattern not adopted elsewhere | Inconsistent lifecycle management |

---

## Prioritized Action Plan

### Sprint A — Quick wins ✅ (committed 74e228c)
- [x] **S8**: Standardized bcrypt to 12 rounds in `users.service.ts`
- [x] **S10**: Raised password minimum to 8 chars in `CreateUserDto` and `LoginDto`
- [x] **Q13**: Added `safePage = Math.max(1, page)` guard in `findAll` customers
- [x] **Q14**: Added `@SkipThrottle()` to `HealthController`
- [x] **D6**: Added idempotency check to `rental.service.ts:registerPayment`
- [x] **D7**: Guarded `closeContract` against already-closed contracts (checks `ENCERRADO` before throwing)
- [x] **Q15**: Fixed broken unit test — removed `require()`, uses injected `Router`

### Sprint B — Frontend reactivity (1–2 days)
- [ ] **A12**: Convert all 14 remaining `firstValueFrom` / async-await service calls to `Observable` + `takeUntilDestroyed`
- [ ] **A13**: Add pagination controls to `clientes-list` HTML and wire `page` to `clientes.service.ts`
- [ ] **A16**: Add `takeUntilDestroyed` to all open `.subscribe()` calls in components

### Sprint C — API pagination (1 day)
- [ ] **A11**: Add pagination to `fleet.findAll`, `rental.findAll`, `inventory.findAllProducts`, `inventory.findMovements`, `wash.findAll`

### Sprint D — Architecture (2–3 days)
- [ ] **A14**: Register `TransformInterceptor` globally in `main.ts` OR delete it — pick one consistent response shape
- [ ] **A15**: Replace SSE ping-only stream with a proper change-push: emit queue snapshot on actual state change (use an in-process event emitter or Redis pub/sub)
- [ ] **S9**: Add a token freshness check — on route activation, silently call `GET /api/auth/me` to validate cookie; redirect to login on 401
- [ ] **S12**: Move SSE auth to a short-lived signed URL or WebSocket with proper auth handshake

### Sprint E — Security hardening (1 day)
- [ ] **S11**: Add per-account login attempt counter (store failed attempts in a Redis key per email, lock after 10 failures for 15 min)
- [ ] **Q16**: Add a global `ParseUUIDPipe` to all `:id` route params
- [ ] **D8**: Verify `openContract` transaction cannot create a partially-applied state (already uses `$transaction` — add re-read and status guard)
- [ ] **D9**: Add idempotency key header support to `inventory.createMovement`


