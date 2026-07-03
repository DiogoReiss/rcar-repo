# RCar — Status e Roadmap Consolidado (Fonte Canônica)

**Data de atualização:** 2026-07-03  
**Papel deste documento:** fonte consolidada e única de status/roadmap do projeto.

---

## Legenda

- 🔴 Não iniciado
- 🟡 Parcial / em evolução
- 🟢 Concluído
- 📌 Dependência externa

---

## Snapshot executivo (estado real do código)

| Área | Status | Observação |
|---|---|---|
| Fundação (monorepo, api/web, auth base) | 🟢 | Base funcional entregue |
| Admin operacional (usuários, clientes, frota, serviços, estoque) | 🟢 | Entregue com evolução contínua de UX/testes |
| Lavajato (agenda, fila, atendimento, pagamentos) | 🟢 | Fluxo operacional ativo |
| Aluguel (disponibilidade, contratos, vistorias, devolução) | 🟡 | Funcional, com pendências de cobertura e refinos |
| Templates + PDF | 🟢 | Geração HTML→PDF implementada |
| Storage S3/MinIO | 🟢 | Presigned URLs e fluxo web implementados |
| Financeiro e relatórios | 🟢 | Dashboard, KPIs e análises principais disponíveis |
| Mail + jobs | 🟢 | Base entregue |
| Qualidade de testes/hardening | 🟡 | Cobertura parcial em cenários avançados |
| CI/CD | 🟢 | Workflows `ci.yml` e `cd.yml` ativos |
| D4Sign | 🔴📌 | Planejado, não implementado |
| Pagar.me | 🔴📌 | Planejado, não implementado |
| Acordos em lote / cobrança recorrente | 🔴 | Planejado, não implementado |

---

## Inventário técnico consolidado

- **Prisma:** 17 models (User, Customer, Vehicle, VehicleMaintenance, WashService, WashSchedule, WashQueue, RentalContract, Inspection, ContractIncident, Payment, Template, Product, StockMovement, ServiceProduct, AuditLog, PasswordResetToken).
- **UserRole:** `GESTOR_GERAL`, `OPERADOR`, `OPERADOR_LEITURA`, `CLIENTE`.
- **Módulos API (16):** auth, customers, documents, fleet, health, inventory, jobs, lavajato, mail, payments, rental, reports, storage, templates, users, wash.
- **Áreas Web:** admin, aluguel, lavajato, portal-cliente, além de core/shared.

---

## Conteúdo absorvido de documentos históricos

Este arquivo incorpora o que seguia válido de documentos de progresso e implementação já arquivados/removidos do repositório.

Consolidações mantidas:

- papel da role `OPERADOR_LEITURA` como perfil somente leitura;
- dark theme como melhoria já aplicada no frontend;
- visão de waves (fechamento de lacunas → qualidade → comercial → go-live);
- pendências externas de D4Sign/Pagar.me;
- CI/CD já entregue.

---

## Backlog prioritário (próximos ciclos)

### P0 — Bloqueadores de negócio

1. **D4Sign** (🔴📌): envio, webhook, atualização de status e download assinado.
2. **Pagar.me** (🔴📌): cobrança online, webhook e reconciliação financeira.

### P1 — Qualidade e robustez

1. Cobertura de testes unitários/e2e para cenários transacionais e negativos avançados.
2. Fechamento de hardening técnico para go-live.
3. Completar cobertura Swagger onde faltar documentação detalhada.

### P2 — Fechamento funcional de produto

1. ✅ Fluxo principal de aluguel no frontend concluído (disponibilidade, reserva, abertura, devolução com incidentes/fotos e fechamento).
2. Evoluir portal do cliente com maior profundidade de dados/documentos.
3. Melhorias de responsividade/mobile e polimento de UX.

### P3 — Expansão

- Acordos em lote e cobrança recorrente.
- WhatsApp.
- PWA/offline.
- Multi-unidade.

---

## Waves de entrega (referência operacional)

1. **Wave 1 — Lacunas críticas:** D4Sign e pendências comerciais externas.
2. **Wave 2 — Confiabilidade:** testes avançados, hardening e documentação técnica.
3. **Wave 3 — Fechamento comercial:** portal, UX mobile e fluxos finais de aluguel.
4. **Wave 4 — Go-live:** operação, observabilidade, UAT e checklist final.

---

## Critério de “pronto para operação ampliada”

- Fluxos críticos com cobertura de teste suficiente.
- Sem dependências externas bloqueando assinatura/pagamento online.
- Pipeline CI/CD estável com gates de qualidade.
- Checklist de hardening/go-live validado.
