# RCar — TODO Unificado (Backend + Frontend + Arquitetura)

## Legenda

- 🔴 Não iniciado
- 🟡 Em andamento
- 🟢 Concluído
- 📌 Bloqueado (dependência externa)

---

## Objetivo deste arquivo (2026-05-08)

- Este arquivo passa a ser a **fonte consolidada** dos TODOs de implementação.
- Conteúdo incorporado sem perda de escopo a partir de:
  - `docs/todo-backend.md`
  - `docs/todo-frontend.md`
- `docs/progress/roadmap.md` deve refletir o mesmo status macro (sincronizado na mesma data).

### Ordem de execução ativa

1. **Ponto 5**: operacional/UX e escala (dashboard + qualidade de experiência)
2. **Ponto 2**: documentos, PDF e assinatura
3. **Ponto 3**: storage real S3/MinIO
4. **Ponto 4**: pagamentos online
5. **Ponto 1**: hardening final de testes/segurança/go-live

### Status real da ordem ativa (auditado no código)

| Ponto | Situação | O que já está pronto | O que falta para fechar |
|---|---|---|---|
| 5 | 🟡 Em andamento | Seletor de período dashboard no backend+frontend e cobertura inicial | Cobertura de testes mais ampla, UX de carregamento/empty states e estabilização final da trilha |
| 2 | 🟡 Em andamento | Endpoint protegido `documents/templates/:id/pdf` com renderização HTML->PDF real (Puppeteer), validações e testes iniciais | Fluxo completo de assinatura D4Sign + expansão de geração/consumo no frontend |
| 3 | 🟡 Em andamento | Módulo `storage` com presigned URLs S3/MinIO (AWS SDK), testes atualizados e upload de CNH integrado no frontend | Expandir fluxo de upload/download fim a fim para frota/vistorias e consumo de download assinado no frontend |
| 4 | 🔴 Não iniciado (📌 externo) | Estrutura de pagamentos internos já existe | Integração Pagar.me (credenciais, serviço, webhook e UX de cobrança online) |
| 1 | 🟡 Em andamento | Hardening parcial já aplicado (throttling, health, melhorias auth, testes unitários ampliados em serviços backend centrais incluindo `lavajato/mail/jobs` e serviços frontend críticos incluindo `storage/sse`) + E2E happy-path de rotas principais web com cenário transacional de criação em admin | Cobertura unit/E2E remanescente em cenários avançados, Swagger completo, fechamento de lint/CI e checklist de go-live |

**Conclusão:** ainda não é possível fechar todos os pontos; `5`, `2`, `3` e `1` estão parcialmente implementados, e `4` depende de integração externa.

---

## Snapshot Consolidado (done/partial/not started)

| Área | Backend | Frontend | Consolidado |
|---|---|---|---|
| Fundação de projeto (setup, build, env, monorepo) | 🟢 | 🟢 | 🟢 |
| Docker + banco + seed | 🟢 (seed validação em banco real pendente) | n/a | 🟡 |
| Common/core (guards, interceptors, auth base, layout, rotas) | 🟢 | 🟢 | 🟢 |
| Admin CRUD (usuários, serviços, frota, clientes) | 🟢 (uploads pendentes) | 🟢 | 🟡 |
| Lavajato (agenda/fila/pagamentos) | 🟢 (testes pendentes) | 🟢 | 🟡 |
| Aluguel (disponibilidade, contrato, devolução) | 🟢 (testes pendentes) | 🟡 | 🟡 |
| Templates + PDF | 🟢 (motor HTML->PDF real no backend) | 🟡 | 🟡 |
| D4Sign | 🔴 | 🔴 | 🔴 |
| Storage real S3/MinIO | 🟡 (presigned real) | 🟡 (upload CNH integrado, cobertura parcial) | 🟡 |
| Financeiro e relatórios | 🟢 | 🟢 | 🟢 |
| E-mail + jobs | 🟢 (templates ricos/testes pendentes) | n/a | 🟡 |
| Testes (unit/integration/e2e) | 🟡 | 🟡 | 🟡 |
| CI/lint/swagger hardening | 🟡 | 🟡 | 🟡 |

---

## Backlog Unificado por Domínio

## 1) Fundação e Plataforma

### 1.1 Backend (Infra + DB + Common + Auth base)

- 🟢 Inicialização NestJS concluída (`apps/api`, strict mode, aliases, config, build).
- 🟢 Infra local concluída (`postgres`, `redis`, `minio`, scripts docker).
- 🔴 Documentação operacional de ambiente local no README ainda pendente.
- 🟢 Prisma/schema/migrations e `PrismaService` concluídos.
- 🔴 Execução/validação do seed contra banco real ainda pendente.
- 🟢 Common module concluído (decorators, guards, logging interceptor, filters, paginação DTO).
- 🟡 Aplicação de guards permanece por controller (intencional), não global.
- 🟢 Auth module concluído (login/refresh/logout/forgot/reset + strategies + DTOs + spec do service).
- 🔴 E2E real de auth ainda pendente (há stub em `test/app.e2e-spec.ts`).

### 1.2 Frontend (setup + testes base + core + shell + rotas + shared)

- 🟢 Angular 21, build, aliases, environments concluídos.
- 🟢 Stack de testes configurada (Vitest unit/browser + Playwright + scripts).
- 🟢 Dependências core e PrimeNG configurados.
- 🟢 Core concluído (`ApiService`, auth service/interceptors/guards, store base).
- 🟢 Shell/layout e acessibilidade base concluídos.
- 🟢 Roteamento lazy por áreas concluído.
- 🟢 Biblioteca shared concluída (`confirm-dialog`, `entity-dialog`, `form-field`, `lync-btn`, `row-menu`, pipes, directives, wizard).

---

## 2) Admin Operacional

### 2.1 Usuários

- 🟢 Backend CRUD users + RBAC concluído.
- 🔴 Backend unit tests users.service pendentes.
- 🔴 Backend E2E CRUD users pendente.
- 🟢 Frontend listagem + dialog create/edit + ativar/desativar + service com signals concluídos.
- 🔴 Frontend unit tests da feature pendentes.

### 2.2 Serviços (Lavajato)

- 🟢 Backend CRUD wash/services concluído.
- 🔴 Backend unit tests pendentes.
- 🟢 Frontend listagem + dialog create/edit + toggle + service concluídos.
- 🔴 Frontend unit tests pendentes.

### 2.3 Frota

- 🟢 Backend CRUD + disponibilidade + manutenção (registrar/concluir/histórico) concluídos.
- 🔴 Upload real de fotos por storage pendente.
- 🔴 Backend unit tests da feature pendentes.
- 🟢 Frontend listagem + dialog + detail + ações de manutenção no menu concluídos.
- 🔴 Frontend unit tests pendentes.

### 2.4 Clientes

- 🟢 Backend CRUD e histórico concluídos.
- 🔴 Upload real de CNH por storage pendente.
- 🔴 Backend unit tests pendentes.
- 🟢 Frontend listagem + dialog + detail/histórico em dialog + paginação concluídos.

---

## 3) Lavajato

### 3.1 Agendamento

- 🟢 Backend schedules + disponibilidade por slots + sumário mensal concluídos.
- 🔴 Unit tests de disponibilidade pendentes.
- 🟢 Frontend calendário dia/semana, form, painel do dia, status e service concluídos.
- 🔴 Unit tests pendentes.

### 3.2 Fila presencial

- 🟢 Backend queue CRUD + SSE em tempo real concluídos.
- 🔴 Unit tests pendentes.
- 🟢 Frontend painel kanban, fluxo de avanço, dialog de detalhes e SSE concluídos.
- 🔴 Unit tests pendentes.

### 3.3 Pagamentos

- 🟢 Backend pagamentos embedded concluídos e módulo `payments` standalone com filtros/summary/reconciliation concluído.
- 🔴 Unit tests do módulo standalone pendentes.
- 🟢 Frontend dialogs e seleção de método concluídos.
- 🔴 Unit tests pendentes.

---

## 4) Aluguel

### 4.1 Backend

- 🟢 Disponibilidade, ciclo completo de contrato (open/close/cancel), inspeções e pagamentos concluídos.
- 🔴 Unit tests de disponibilidade e lifecycle pendentes.

### 4.2 Frontend

- 🟢 `disponibilidade` implementada.
- 🔴 `reserva-form`, `reserva-confirmacao`, `ReservaService` ainda pendentes no checklist original.
- 🟢 `contrato-list` e `contrato-detail` implementados.
- 🔴 `contrato-abertura`, `vistoria-saida`, `ContratoService` ainda pendentes no checklist original.
- 🟢 `vistoria-chegada` implementada.
- 🔴 `fechamento`, integração total de pagamento na devolução e testes ainda pendentes.
- 🟢 fluxo wizard de reserva (`lync-wizard-dialog`) já adotado.

---

## 5) Documentos, PDF e Assinatura

### 5.1 Templates e PDF

- 🟢 Backend templates CRUD + preview concluídos.
- 🟢 `POST /documents/templates/:id/pdf` com renderização HTML->PDF real (Puppeteer), validação de conteúdo e filename normalizado.
- 🟢 Frontend templates list + editor inline + preview live concluídos.
- 🔴 Botão "Gerar PDF" em contratos/recibos e consumo completo do fluxo no frontend pendentes.

### 5.2 D4Sign

- 🔴 Backend `D4SignService`, webhook e fluxo completo pendentes.
- 🔴 Frontend botão "Enviar para Assinatura", badge robusto e service dedicado pendentes.

---

## 6) Storage e Uploads

- 🟡 Backend `storage` com integração real de URLs assinadas via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- 🔴 Testes de upload real contra MinIO pendentes.
- 🟡 Frontend com `lync-file-upload` e integração de upload de CNH em clientes; pendente expandir para frota/vistorias e fluxo de download assinado.

---

## 7) Financeiro e Analytics

- 🟢 Backend financeiro entregue: `financial-summary`, receivables, maintenance-costs, stock-cost-analysis, enrich daily/monthly.
- 🟢 Backend automações financeiras entregues (baixa de estoque, custo médio ponderado, migrações correlatas).
- 🟢 Frontend `/admin/financeiro` entregue com cards, gráficos, receivables, rentabilidade, valoração e export CSV/PDF.
- 🟢 Dashboard com seletor de período (`7d/30d/mês`) entregue no endpoint + frontend + cobertura inicial.
- 🟡 Cobertura de testes do dashboard ainda parcial.

---

## 8) E-mail, Jobs e Operações

- 🟢 Mail module com env + envios principais implementado.
- 🔴 Templates HTML mais ricos pendentes.
- 🔴 Unit tests de mail e processors pendentes.
- 🟢 Jobs BullMQ e crons principais implementados.
- 🔴 Queue dedicada de geração de PDF pendente (dependente de motor PDF real).

---

## 9) Qualidade, Testes, Swagger e CI

### 9.1 Backend

- 🟢 Testes unitários adicionados para módulos de negócio backend (`documents`, `reports`, `storage`, `users`, `customers`, `fleet`, `wash`, `templates`, `payments`, `inventory`, `rental`, `lavajato`, `mail`, `jobs`, `queue-events`).
- 🟡 Suite unit backend ainda pendente em profundidade de cenários avançados e integrações (não apenas happy path).
- 🔴 E2E real com Supertest pendente.
- 🟡 Swagger configurado, mas cobertura total de `@ApiProperty`/`@ApiResponse` ainda parcial.
- 🔴 Prettier dedicado no `apps/api` pendente.

### 9.2 Frontend

- 🟢 Unit tests existentes em serviços/componentes centrais (`app`, `dashboard`, `financeiro.service`, `api.service`, `auth.service`, `storage.service`, `sse.service`, `users.service`, `clientes.service`, `servicos.service`, `frota.service`, `agendamento.service`, `fila.service`).
- 🟡 Cobertura unit frontend evoluiu, porém ainda faltam specs de componentes/fluxos finais (aluguel/templates/portal em maior profundidade).
- 🟡 Playwright com happy-path para autenticação + rotas principais de `admin`, `lavajato`, `aluguel` e `portal`, incluindo cenário transacional básico de criação em admin; ainda parcial para fluxos transacionais completos.
- 🔴 Checklist de lint frontend em `todo-frontend` continua pendente (21.1-21.4) até validação final de pipeline.

---

## 10) Decisões Técnicas e Dependências Externas

| Tema | Situação |
|---|---|
| Design System frontend | 🟢 PrimeNG adotado |
| Monorepo | 🟢 pnpm workspaces |
| Real-time fila | 🟢 SSE adotado |
| Editor templates | 🟢 textarea + preview |
| Hosting produção | 🔴 pendente decisão |
| CDN para assets/fotos | 🔴 pendente decisão |
| Credenciais D4Sign | 📌 pendente externo |
| Credenciais Pagar.me | 📌 pendente externo |

---

## 10.1) Matriz de cobertura da fusão (sem perda de informação)

### Origem `docs/todo-backend.md`

| Seções originais | Cobertura neste arquivo |
|---|---|
| 1 (Inicialização NestJS), 2 (Docker), 3 (Prisma/Schema), 4 (Seed), 5 (Common), 6 (Auth) | Seção `1) Fundação e Plataforma` |
| 7 (Users), 8 (Customers), 9 (Fleet) | Seção `2) Admin Operacional` |
| 10 (Storage) | Seção `6) Storage e Uploads` |
| 11 (Wash/Lavajato) | Seção `3) Lavajato` |
| 12 (Rental) | Seção `4) Aluguel` |
| 13 (Payments standalone) | Seções `3.3 Pagamentos` e `7) Financeiro e Analytics` |
| 14 (Documents/Templates/PDF/D4Sign) | Seção `5) Documentos, PDF e Assinatura` |
| 15 (Notifications/Mail), 16 (Jobs) | Seção `8) E-mail, Jobs e Operações` |
| 17 e 17b (Reports e automação financeira) | Seção `7) Financeiro e Analytics` |
| 18 (Swagger), 19 (Lint/CI), 20 (E2E), 21 (Módulos extras) | Seção `9) Qualidade, Testes, Swagger e CI` e `1.1 Backend` |

### Origem `docs/todo-frontend.md`

| Seções originais | Cobertura neste arquivo |
|---|---|
| 1 (Inicialização Angular), 2 (Testes), 3 (Dependências), 4 (Core), 5 (Layout), 6 (Rotas), 7 (Shared) | Seção `1.2 Frontend` |
| 8 (Auth Frontend) | Seção `1.2 Frontend` |
| 9 (Usuários), 10 (Serviços), 11 (Frota), 12 (Clientes) | Seção `2) Admin Operacional` |
| 13 (Agendamento), 14 (Fila), 15 (Pagamentos) | Seção `3) Lavajato` |
| 16 (Reserva), 17 (Contratos), 18 (Devolução) | Seção `4) Aluguel` |
| 19 (Templates/PDF), 20 (D4Sign) | Seção `5) Documentos, PDF e Assinatura` |
| 21 (Lint/CI) | Seção `9.2 Frontend` |
| 22 (Dashboard/Analytics), 24 (Financeiro) | Seção `7) Financeiro e Analytics` |
| 23 (UX cross-cutting) | Seções `1.2 Frontend`, `2) Admin Operacional`, `3) Lavajato` e `4.2 Frontend` |

---

## 11) Diferenças encontradas entre `05-todo.md` e `roadmap.md` (agora alinhadas)

### Antes da sincronização

- `05-todo.md` marcava grandes blocos como 🔴 mesmo com ampla implementação já entregue.
- `roadmap.md` listava itens de segurança e qualidade já mitigados (ex.: throttling/login hardening e expansão de unit tests iniciais).
- `roadmap.md` tratava fases 2-6 como "entregues" sem refletir pendências funcionais reais (D4Sign, storage real, PDF real, e2e robusto).

### Estado alinhado

- **Totalmente concluído (🟢):** fundação de apps, core auth/base, módulos principais de negócio, financeiro base, dashboard com período, jobs e mail base.
- **Parcialmente concluído (🟡):** storage, PDF, cobertura de testes, swagger completo, e2e, frontend aluguel (partes), uploads reais.
- **A iniciar (🔴/📌):** D4Sign completo, pagamentos online, decisões de infraestrutura final, fases de expansão (PWA, WhatsApp, multi-unidade).

---

## 12) Plano completo para fechar 100% do projeto (business coverage)

## Fase A — Fechamento de lacunas críticas (2-3 semanas)

1. **Storage real**
   - Integrar S3/MinIO real no backend (upload/delete/presigned URLs).
   - Conectar uploads de CNH/fotos de frota e vistoria.
   - Critério de saída: upload/download/deleção funcionando em ambiente local e staging.
2. **PDF real**
   - Substituir scaffold por renderização HTML->PDF real.
   - Introduzir worker/queue de PDF para geração assíncrona quando necessário.
   - Critério de saída: contratos/recibos gerados com layout final e testes automatizados.
3. **D4Sign ponta a ponta**
   - Serviço backend + webhook + persistência de status.
   - Fluxo frontend de envio e acompanhamento.
   - Critério de saída: assinatura real homologada com callback e download assinado.

## Fase B — Qualidade técnica e confiabilidade (2 semanas)

1. **Backend unit + integration**
   - Priorizar `users`, `customers`, `fleet`, `lavajato`, `rental`, `payments`.
2. **Frontend unit**
   - Priorizar CRUDs admin, fluxos lavajato, reserva/contrato/devolução e templates.
3. **E2E**
   - Fluxos críticos: login, abertura-fechamento de contrato, pagamento, geração de PDF, envio assinatura.
4. **Swagger/CI**
   - Completar `@ApiProperty`/`@ApiResponse`.
   - Pipeline com gates de lint+test+build para api/web.

## Fase C — Cobertura de negócio final (2 semanas)

1. **Pagamentos online (Pagar.me)**
   - Cobrança Pix/cartão + webhook + reconciliação.
2. **Portal do cliente completo**
   - Meus agendamentos, reservas, documentos e histórico com dados reais.
3. **Operação administrativa final**
   - Relatórios exportáveis completos, toasts/empty/loading states padronizados.

## Fase D — Go-live readiness (1 semana)

1. **Hardening de produção**
   - Secrets, backup, observabilidade e runbooks.
2. **Decisões de infraestrutura**
   - Hosting + CDN + estratégia de deploy/rollback.
3. **Checklist de aceite**
   - UAT por área (Lavajato, Aluguel, Financeiro, Administração).
   - Critério de saída: sem blockers funcionais, sem gaps regulatórios e sem falhas críticas abertas.

## Backlog pós-100% (expansão)

- PWA/offline.
- Notificações WhatsApp.
- Programa de fidelidade.
- Multi-unidade.
- Integração DETRAN.
- App mobile (se necessário).

