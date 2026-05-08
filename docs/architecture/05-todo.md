# RCar — TODO (Roadmap de Implementação)

## Legenda

- 🔴 Não iniciado
- 🟡 Em andamento
- 🟢 Concluído
- 📌 Bloqueado (dependência externa)

---

## Fase 1 — MVP (Core funcional)

### Infraestrutura

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🟡     | Setup monorepo (pnpm workspaces: `apps/web`, `apps/api`) |
| 🔴     | Configurar Angular 21 com standalone APIs            |
| 🔴     | Configurar NestJS com Prisma + PostgreSQL             |
| 🔴     | Docker Compose (PostgreSQL + Redis + MinIO)           |
| 🔴     | CI/CD pipeline (lint, test, build)                    |
| 🔴     | Configurar variáveis de ambiente (.env.example)       |
| 🔴     | Setup Prisma schema + migration inicial               |
| 🔴     | Seed com dados iniciais (admin, serviços, frota)      |

### Autenticação

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: módulo auth (login, refresh, forgot/reset password) |
| 🔴     | Backend: JWT strategy + guards                       |
| 🔴     | Backend: RBAC (roles decorator + guard)              |
| 🔴     | Frontend: tela de login                              |
| 🔴     | Frontend: auth service + interceptors                |
| 🔴     | Frontend: guards de rota (auth + role)               |
| 🔴     | Frontend: fluxo de recuperação de senha              |

### Admin — Gestão de Usuários

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/users                             |
| 🔴     | Frontend: listagem de usuários com filtro             |
| 🔴     | Frontend: formulário criar/editar usuário            |
| 🔴     | Frontend: ativar/desativar usuário                   |

### Admin — Catálogo de Serviços (Lavajato)

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/wash/services                     |
| 🔴     | Frontend: listagem de serviços                       |
| 🔴     | Frontend: formulário criar/editar serviço            |
| 🔴     | Frontend: toggle ativar/desativar                    |

### Admin — Gestão da Frota

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/fleet                             |
| 🔴     | Backend: upload de fotos (S3/MinIO)                  |
| 🔴     | Frontend: listagem de veículos com status            |
| 🔴     | Frontend: formulário criar/editar veículo            |
| 🔴     | Frontend: detalhe com histórico                      |

### Admin — Gestão de Clientes

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/customers                         |
| 🔴     | Backend: upload CNH (S3/MinIO)                       |
| 🔴     | Frontend: listagem com filtro PF/PJ                  |
| 🔴     | Frontend: formulário criar/editar (PF e PJ)          |
| 🔴     | Frontend: detalhe com histórico unificado            |

### Lavajato — Agendamento

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: lógica de disponibilidade (slots por duração)|
| 🔴     | Backend: CRUD /api/wash/schedule                     |
| 🔴     | Frontend: calendário com horários disponíveis        |
| 🔴     | Frontend: formulário de agendamento                  |
| 🔴     | Frontend: painel do operador (agendamentos do dia)   |
| 🔴     | Frontend: alterar status do agendamento              |

### Lavajato — Fila Presencial

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/wash/queue                        |
| 🔴     | Frontend: painel de fila em tempo real               |
| 🔴     | Frontend: formulário adicionar à fila                |
| 🔴     | Frontend: controles de status (aguardando → concluído)|

### Lavajato — Pagamentos

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: POST /api/payments (registro manual)        |
| 🔴     | Frontend: modal de registro de pagamento             |
| 🔴     | Frontend: seleção de método (dinheiro, pix, cartão)  |

### Aluguel — Reservas

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: /api/fleet/available (veículos disponíveis por período)|
| 🔴     | Backend: CRUD /api/rental/reservations               |
| 🔴     | Backend: cálculo de preço (diária × período)         |
| 🔴     | Frontend: seleção de categoria + período             |
| 🔴     | Frontend: exibição de preço estimado                 |
| 🔴     | Frontend: confirmação de reserva                     |

### Aluguel — Contratos

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: POST /api/rental/contracts (abertura)       |
| 🔴     | Backend: lógica de vistoria de saída                 |
| 🔴     | Frontend: formulário de abertura (vincular veículo)  |
| 🔴     | Frontend: checklist de vistoria + upload fotos       |
| 🔴     | Frontend: listagem de contratos ativos               |
| 🔴     | Frontend: detalhe do contrato                        |

### Aluguel — Devolução

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: POST /api/rental/contracts/:id/close        |
| 🔴     | Backend: lógica comparativo saída vs. chegada        |
| 🔴     | Frontend: vistoria de chegada (checklist + fotos)    |
| 🔴     | Frontend: tela de extras (km, combustível, avaria)   |
| 🔴     | Frontend: fechamento do contrato                     |

### Admin — Templates e PDF

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: CRUD /api/documents/templates               |
| 🔴     | Backend: renderização HTML→PDF (Puppeteer)           |
| 🔴     | Frontend: editor de template (HTML com variáveis)    |
| 🔴     | Frontend: preview com dados de exemplo               |
| 🔴     | Frontend: botão "Gerar PDF" em contratos/recibos     |

### Integração D4Sign (Assinatura Digital)

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Criar conta D4Sign e obter credenciais               |
| 🔴     | Backend: D4SignService (envio + consulta + webhook)   |
| 🔴     | Backend: endpoint webhook para callbacks             |
| 🔴     | Frontend: botão "Enviar para Assinatura"             |
| 🔴     | Frontend: badge de status da assinatura              |

### Notificações por E-mail

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: módulo de e-mail (Nodemailer + templates HBS)|
| 🔴     | E-mail: confirmação de agendamento                   |
| 🔴     | E-mail: confirmação de reserva                       |
| 🔴     | E-mail: lembrete de devolução (D-1)                  |
| 🔴     | E-mail: recuperação de senha                         |

---

## Fase 2 — Financeiro e Pagamentos Online

> Detalhado em [`06-financeiro.md`](./06-financeiro.md)

### 2a. Relatórios financeiros (quick wins)

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: `GET /reports/financial-summary` (DRE simplificado: receita - custos = margem) |
| 🔴     | Backend: custo de insumos e manutenção no `getDailySummary` / `getMonthlyStats` |
| 🔴     | Backend: baixa automática de estoque ao concluir serviço (`ServiceProduct`) |
| 🔴     | Backend: `GET /payments` standalone com filtros (data, tipo, status, método) |
| 🔴     | Frontend: página `/admin/financeiro` com DRE visual + gráficos |
| 🔴     | Frontend: card "Contas a receber" (contratos sem pagamento total) |
| 🔴     | Frontend: rentabilidade por veículo (receita - manutenção) |

### 2b. Pagamentos online (Pagar.me)

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Criar conta Pagar.me e obter credenciais             |
| 🔴     | Backend: PagarmeService (criar cobrança Pix/cartão)  |
| 🔴     | Backend: webhook de confirmação de pagamento         |
| 🔴     | Frontend: fluxo de pagamento online (lavajato)       |
| 🔴     | Frontend: cobrança no fechamento de aluguel          |

---

## Fase 3 — Análise Avançada, UX e Portal

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | Backend: /api/reports/fleet-occupation               |
| 🔴     | Backend: análise custo-benefício preventiva vs. corretiva |
| 🔴     | Frontend: export CSV/PDF de relatórios financeiros   |
| 🔴     | Frontend: dashboard com seletor de período (7d/30d/mês) |
| 🔴     | Frontend: portal do cliente (meus agendamentos, reservas, histórico)|
| 🔴     | Audit log: registrar ações críticas                  |
| 🔴     | UX: loading skeletons, toasts, empty states          |
| 🔴     | Schema: `custoAquisicao` em Vehicle + depreciation schedule |

---

## Fase 4 — Expansão

| Status | Tarefa                                              |
|--------|-----------------------------------------------------|
| 🔴     | PWA: manifest + service worker para acesso offline   |
| 🔴     | Notificações WhatsApp (API oficial ou Evolution API) |
| 🔴     | Programa de fidelidade (pontos por lavagem)          |
| 🔴     | Multi-unidade (field `unidade_id` + filtro global)   |
| 🔴     | Integração DETRAN (validação de CNH)                 |
| 🔴     | App mobile nativo (se necessário após PWA)           |

---

## Decisões Técnicas Pendentes

| Decisão                              | Opções                                      | Status |
|--------------------------------------|---------------------------------------------|--------|
| Design System do frontend            | **PrimeNG**                                 | 🟢     |
| Hosting                              | AWS / GCP / VPS (Hetzner, DigitalOcean)     | 🔴     |
| CDN para assets/fotos                | CloudFront / Cloudflare R2                  | 🔴     |
| Monorepo tool                        | **pnpm workspaces puro**                    | 🟢     |
| Real-time na fila (WebSocket vs SSE) | **SSE nativo**                              | 🟢     |
| Editor de templates                  | **textarea + preview**                      | 🟢     |

---

## Próximos Passos Imediatos

1. **Definir monorepo**: setup do workspace com `apps/web` (Angular) e `apps/api` (NestJS)
2. **Docker Compose**: PostgreSQL + Redis + MinIO para dev local
3. **Schema Prisma**: aplicar migration inicial com seed
4. **Auth completa**: backend + frontend login funcional
5. **CRUD de Serviços**: primeiro fluxo end-to-end para validar arquitetura

