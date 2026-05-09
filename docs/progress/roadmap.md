# Phase 2–6: Deep Review Backlog Roadmap (Synced)

**Status:** 🟡 Mixed — base funcional entregue, lacunas críticas ainda abertas
**Fonte de verdade detalhada:** `docs/architecture/05-todo.md`
**Última sincronização:** 2026-05-09

### Status da ordem ativa (5 -> 2 -> 3 -> 4 -> 1)

| Ponto | Status atual | Pendência-chave |
|---|---|---|
| 5 (operacional/UX) | 🟡 | UX evoluiu (financeiro e dialogs), faltam testes e fechamento de loading/empty states remanescentes |
| 2 (documentos/PDF/assinatura) | 🟡 | Renderização HTML->PDF backend já implementada; falta fluxo D4Sign e fechamento frontend |
| 3 (storage) | 🟢 | Presigned real implementado e fluxo frontend fim a fim fechado (CNH, frota e vistorias com ações de abertura via URL assinada) |
| 4 (pagamentos online) | 🔴/📌 | Integração Pagar.me depende de credenciais e webhook homologado |
| 1 (hardening final) | 🟡 | Cobertura unit evoluiu amplamente (backend + frontend centrais) e E2E happy-path em web + API (Supertest), com estabilização de teardown na suíte API e cenários negativos iniciais (auth/guards); faltam E2E transacionais e negativos avançados, Swagger e gates finais de CI/go-live |

---

## 1) Macro status alinhado com `05-todo.md`

| Macro domínio | Status |
|---|---|
| Fundação de plataforma (api/web, core, auth base, infra local) | 🟢 |
| Operação administrativa (users, serviços, frota, clientes) | 🟡 |
| Lavajato (agenda, fila, pagamentos) | 🟡 |
| Aluguel (reserva, contratos, devolução) | 🟡 |
| Financeiro e relatórios | 🟢 |
| Documentos/PDF/assinatura | 🟡 |
| Storage real e uploads | 🟢 |
| Qualidade de testes/e2e/go-live hardening | 🟡 |
| Expansão (PWA, WhatsApp, multi-unidade etc.) | 🔴 |

---

## 2) O que está totalmente concluído

- Backend: base NestJS + Prisma + schema/migrations + módulos principais (`auth`, `users`, `customers`, `fleet`, `wash/lavajato`, `rental`, `reports`, `payments`, `templates`, `mail`, `jobs`, `health`).
- Frontend: base Angular 21 + shell + rotas lazy + áreas admin/lavajato/aluguel + financeiro completo + dashboard com período.
- Frontend: compatibilidade de footer PrimeNG v21 aplicada nos dialogs principais (`#footer`) e refinamento de UX no dialog de fila.
- Storage: trilha de upload/download frontend concluída para CNH, frota e vistorias, incluindo abertura de arquivos com URL assinada.
- Financeiro ponta a ponta (quick wins): endpoints e UI de DRE, receivables, manutenção e custo de estoque.
- Financeiro (frontend) evoluído com presets de período, KPIs adicionais e novos blocos analíticos (aging/top pendências/top rentabilidade).
- Qualidade inicial: testes unitários em api (documents/reports/storage/users/customers/fleet/wash/templates/payments/inventory/rental/lavajato/mail/jobs/queue-events) e web (`app`, `dashboard`, `financeiro.service`, `api.service`, `auth.service`, `storage.service`, `sse.service`, `users.service`, `clientes.service`, `servicos.service`, `frota.service`, `agendamento.service`, `fila.service`).

---

## 3) O que está parcialmente concluído

- **Primeira interação do cliente (UI/UX)**: falta ajustar a experiência inicial para priorizar `reservar`/`alugar` para perfil cliente e posicionar login no header.
- **PDF**: endpoint protegido com renderização real HTML->PDF já implementado; pendente integração completa de consumo no frontend e assinatura digital.
- **Aluguel frontend**: fluxo wizard existe, mas itens do checklist original (form/confirm/services de reserva, abertura detalhada, fechamento final) ainda pendentes.
- **Entrega de veículo (handoff)**: checklist de estado do carro na entrega ao cliente ainda pendente na trilha de vistoria de saída.
- **Testes**: há base real com unit abrangente em serviços e E2E happy-path por área em web + API, com correção recente de robustez no teardown da suíte API e incremento de cenários negativos iniciais (login inválido/guards); cobertura funcional completa (cenários transacionais amplos e negativos avançados) ainda não atingida.
- **Swagger/CI/lint**: estrutura pronta; falta fechamento de cobertura e validações finais de pipeline como gate de release.

---

## 4) O que ainda não iniciou (ou depende de terceiros)

- Integração D4Sign completa (backend webhook + frontend fluxo completo).
- Pagamentos online Pagar.me (credenciais, service, webhook, UX de cobrança online).
- Decisões finais de infraestrutura de produção (hosting/CDN).
- Trilhas de expansão (PWA, WhatsApp, fidelidade, multi-unidade, DETRAN, app mobile).

---

## 5) Gaps de sincronização corrigidos neste ciclo

- Itens historicamente marcados como "não iniciado" em macro roadmap foram atualizados para refletir entregas reais já presentes no código.
- Itens de segurança/qualidade que já possuem entrega parcial (ex.: throttling, health, interceptação de erro, cobertura unit inicial) deixaram de aparecer como 100% pendentes.
- Fases que estavam marcadas como "production-ready" foram reclassificadas para 🟡 quando ainda possuem dependências críticas de negócio (storage real, PDF real, D4Sign, E2E robusto).

---

## 6) Plano de fechamento 100% (execução)

## Wave 1 — Core blockers de negócio (2-3 semanas)

1. Storage real S3/MinIO + uploads fim a fim (CNH/frota/vistorias).
2. Motor PDF real (HTML->PDF) + estabilidade de geração.
3. D4Sign completo (send, webhook, status, download assinado).

**Saída da wave:** documentos e anexos operacionais de ponta a ponta.

## Wave 2 — Confiabilidade e qualidade (2 semanas)

1. Completar suites unitárias backend e frontend das áreas críticas.
2. Construir E2E de fluxos de receita (auth, lavajato, aluguel, financeiro, documentos).
3. Completar Swagger e gates de CI para release sem regressão.

**Saída da wave:** qualidade de release com cobertura previsível e pipeline bloqueante.

## Wave 3 — Fechamento funcional comercial (2 semanas)

1. Pagamentos online (Pagar.me) com webhook e reconciliação.
2. Portal do cliente com dados reais e documentos.
3. Fechamento dos itens pendentes da trilha aluguel frontend, incluindo checklist de entrega do veículo (estado no handoff).
4. Ajuste da experiência inicial do cliente com CTA de reserva/aluguel e login no header.

**Saída da wave:** operação comercial digital completa.

## Wave 4 — Go-live readiness (1 semana)

1. Decisão de infraestrutura (hosting + CDN) e estratégia de deploy/rollback.
2. Hardening operacional (backup, observabilidade, runbooks).
3. UAT final por área de negócio e checklist de aceite.

**Saída da wave:** go-live com risco controlado.

---

## 7) Backlog pós-100%

- PWA/offline.
- WhatsApp.
- Fidelidade.
- Multi-unidade.
- DETRAN.
- App mobile (se necessário).
