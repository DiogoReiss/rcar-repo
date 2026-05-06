# Phase 2–6: Remaining Work Roadmap

**Status:** ✅ Phase 2 Complete  
**Prerequisites:** Phase 1 ✅ Complete

---

## Phase 2: Auth End-to-End + Estoque Foundation

**Depends on:** Docker running (for DB migration)

### Backend (BE 4–6):
- [ ] Start Docker: `pnpm docker:up`
- [ ] Run first migration: `prisma migrate dev --name init`
- [ ] Create seed data (admin user, sample services, vehicles, template, products)
- [ ] Build Common module (decorators, guards, interceptors, filters)
- [ ] Build Auth module (JWT strategy, login/refresh/forgot/reset endpoints)
- [ ] Build Inventory module (products CRUD, stock movements)

### Frontend (FE 8):
- [ ] Implement login page with form components
- [ ] Implement forgot-password / reset-password pages
- [ ] Wire auth.service to real API endpoints
- [ ] Admin: Estoque — produtos-list (placeholder page with route)
- [ ] Admin: Estoque — produto-form (placeholder page with route)
- [ ] Admin: Estoque — movimentacoes (placeholder page with route)
- [ ] Unit tests for auth service and guards

**Milestone:** User can log in, see admin dashboard, and navigate to estoque pages.

---

## Phase 3: Admin CRUD

### Backend (BE 7–10, 11a):
- [ ] Users module (CRUD with RBAC)
- [ ] Customers module (PF/PJ, CNH upload)
- [ ] Fleet module (vehicles, availability check)
- [ ] Storage module (S3/MinIO upload)
- [ ] Wash services catalog (CRUD)
- [ ] Inventory: full product-service linking (ServiceProduct)
- [ ] Inventory: low-stock alerts endpoint

### Frontend (FE 7, 9–12):
- [ ] Shared components (data-table, confirm-dialog, file-upload, status-badge, pipes, directives)
- [ ] Admin: Usuarios (list + form)
- [ ] Admin: Servicos (list + form)
- [ ] Admin: Estoque — Produtos (list + form + movimentações completas)
- [ ] Admin: Frota (list + form + detail)
- [ ] Admin: Clientes (list + form + detail)

**Milestone:** Admin can manage all entities including inventory.

---

## Phase 4: Lavajato

### Backend (BE 11b, 11c, 13):
- [ ] Schedule service (availability, booking)
- [ ] Queue service (walk-in, position, SSE)
- [ ] Payments module
- [ ] Auto-debit stock on service completion (ServiceProduct quantities)

### Frontend (FE 13–15):
- [ ] Calendario + agendamento form
- [ ] Fila painel (SSE real-time)
- [ ] Atendimentos do dia
- [ ] Payment dialog
- [ ] Stock low alerts on dashboard

**Milestone:** Lavajato fully operational with automatic stock tracking.

---

## Phase 5: Aluguel

### Backend (BE 12):
- [ ] Reservation service (availability, pricing)
- [ ] Contract service (open, extend, close, inspections)

### Frontend (FE 16–18):
- [ ] Disponibilidade + reserva form
- [ ] Contrato list + abertura + vistoria
- [ ] Devolução + fechamento

**Milestone:** Rental fully operational.

---

## Phase 6: Supporting & Polish

### Backend (BE 14–20):
- [ ] Documents/Templates + PDF generation
- [ ] D4Sign integration
- [ ] Notifications (email)
- [ ] BullMQ jobs (email, PDF, reminders)
- [ ] Reports module (including stock reports)
- [ ] Swagger decoration
- [ ] Lint/CI
- [ ] E2E tests

### Frontend (FE 19–21):
- [ ] Template editor + preview
- [ ] D4Sign status badges
- [ ] ESLint + Prettier
- [ ] Final build validation

**Milestone:** Production-ready.

---

## How to Continue

Run phases sequentially. For each phase, tell me:
- "Proceed with Phase 2" — I'll start Docker, run migrations, build auth + inventory
- Or pick specific steps if you want fine-grained control

All progress will be documented in `docs/progress/phase-{N}.md`.

