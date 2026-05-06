# Phase 2–6: Remaining Work Roadmap

**Status:** ✅ All Phases Complete (2–6)
**Prerequisites:** Phase 1 ✅ Complete

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

## Post-launch Backlog

The following items were intentionally deferred and can be tackled independently:

- [ ] Storage module: actual file upload to MinIO/S3 (CNH, fotos de vistoria)
- [ ] D4Sign full API integration (send doc, webhook, signed PDF download)
- [ ] PDF generation (puppeteer or weasyprint) from rendered templates
- [ ] Portal do Cliente pages (histórico, agendamentos, reservas, documentos)
- [ ] E2E tests (Playwright)
- [ ] Multi-unit / multi-branch support
