# Phase 2–6: Deep Review Backlog Roadmap (Synced)

**Status:** 🟡 Mixed — base funcional entregue, lacunas críticas ainda abertas
**Fonte de verdade detalhada:** `docs/architecture/05-todo.md`
**Última sincronização:** 2026-05-08

### Status da ordem ativa (5 -> 2 -> 3 -> 4 -> 1)

| Ponto | Status atual | Pendência-chave |
|---|---|---|
| 5 (operacional/UX) | 🟡 | Expandir testes e fechar UX de estados de carregamento/vazio |
| 2 (documentos/PDF/assinatura) | 🟡 | Implementar renderização HTML->PDF real e fluxo D4Sign |
| 3 (storage) | 🟡 | Integrar S3/MinIO real e upload frontend fim a fim |
| 4 (pagamentos online) | 🔴/📌 | Integração Pagar.me depende de credenciais e webhook homologado |
| 1 (hardening final) | 🟡 | Cobertura de testes, Swagger completo e gates finais de CI/go-live |

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
| Storage real e uploads | 🟡 |
| Qualidade de testes/e2e/go-live hardening | 🟡 |
| Expansão (PWA, WhatsApp, multi-unidade etc.) | 🔴 |

---

## 2) O que está totalmente concluído

- Backend: base NestJS + Prisma + schema/migrations + módulos principais (`auth`, `users`, `customers`, `fleet`, `wash/lavajato`, `rental`, `reports`, `payments`, `templates`, `mail`, `jobs`, `health`).
- Frontend: base Angular 21 + shell + rotas lazy + áreas admin/lavajato/aluguel + financeiro completo + dashboard com período.
- Financeiro ponta a ponta (quick wins): endpoints e UI de DRE, receivables, manutenção e custo de estoque.
- Qualidade inicial: testes unitários em api (documents/reports/storage) e web (`app`, `dashboard`, `financeiro.service`, `api.service`, `auth.service`).

---

## 3) O que está parcialmente concluído

- **Storage**: scaffold backend de URL assinada pronto; integração real S3/MinIO e fluxo de upload frontend ainda pendentes.
- **PDF**: endpoint protegido e scaffold de geração prontos; falta motor real HTML->PDF.
- **Aluguel frontend**: fluxo wizard existe, mas itens do checklist original (form/confirm/services de reserva, abertura detalhada, fechamento final) ainda pendentes.
- **Testes**: há base real, mas cobertura funcional completa (unit+e2e) ainda não atingida.
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
3. Fechamento dos itens pendentes da trilha aluguel frontend.

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
