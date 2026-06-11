# Próximos Passos — Roadmap RCar

**Data de análise:** 2026-06-11  
**Fonte:** `docs/architecture/05-todo.md` e `docs/progress/roadmap.md`

---

## Status Atual do Projeto

### Ordem de Execução Ativa
1. **Ponto 5** — Operacional/UX e escala 🟡
2. **Ponto 2** — Documentos, PDF e assinatura 🟡
3. **Ponto 3** — Storage real S3/MinIO ✅ **CONCLUÍDO**
4. **Ponto 4** — Pagamentos online 🔴 (bloqueado por integração externa)
5. **Ponto 1** — Hardening final 🟡

---

## 🎯 Próximas Prioridades Imediatas

### Wave Atual: Fechamento de Lacunas Críticas

#### 1. D4Sign — Assinatura Digital (Alta Prioridade)
**Status:** 🔴 Não iniciado  
**Dependência:** Credenciais D4Sign 📌

**Backend**
- [ ] Criar `D4SignService` (`apps/api/src/modules/documents/services/d4sign.service.ts`)
- [ ] Implementar envio de documento para assinatura
- [ ] Implementar webhook de conclusão de assinatura
- [ ] Persistir status de assinatura no contrato (`d4signId`, `d4signStatus`)
- [ ] Endpoint para consultar status: `GET /documents/sign/:id/status`
- [ ] Download de documento assinado

**Frontend**
- [ ] Botão "Enviar para Assinatura" no detalhe do contrato
- [ ] Badge de status da assinatura (pendente/assinado/cancelado)
- [ ] Service dedicado `D4signService` para comunicação com backend
- [ ] Fluxo de acompanhamento e notificação ao concluir

**Testes**
- [ ] Unit tests backend (service + controller)
- [ ] E2E: enviar documento, receber webhook, atualizar status

**Critério de saída:** Assinatura real homologada com callback e download assinado funcionando

---

#### 2. Aluguel Frontend — Completar Fluxo (Média-Alta Prioridade)
**Status:** 🟡 Parcial

**Reserva**
- [ ] `reserva-form` — formulário de criação de reserva
- [ ] `reserva-confirmacao` — tela de confirmação de reserva
- [ ] `ReservaService` — service para gerenciar reservas

**Contrato**
- [ ] `contrato-abertura` — wizard de abertura de contrato
- [ ] `vistoria-saida` — checklist operacional de entrega do veículo (estado no handoff)
- [ ] `ContratoService` — service completo de contratos

**Devolução**
- [ ] `fechamento` — wizard de fechamento com pagamento de extras
- [ ] Integração total de pagamento na devolução
- [ ] Cálculo automático de extras (combustível, KM excedente, avarias)

**Testes**
- [ ] Unit tests dos services e componentes
- [ ] E2E: fluxo completo reserva → abertura → devolução

---

#### 3. Testes e Qualidade (Alta Prioridade)
**Status:** 🟡 Parcial

**Backend Unit Tests (prioridade)**
- [ ] `users.service.spec.ts`
- [ ] `customers.service.spec.ts`
- [ ] `fleet.service.spec.ts`
- [ ] `lavajato.service.spec.ts` (cenários avançados)
- [ ] `rental.service.spec.ts` (disponibilidade + lifecycle)
- [ ] `payments.service.spec.ts` (módulo standalone)

**Frontend Unit Tests (prioridade)**
- [ ] Feature `usuarios` (list + form)
- [ ] Feature `servicos` (CRUD)
- [ ] Feature `frota` (CRUD + manutenção)
- [ ] Feature `agendamento` (calendário)
- [ ] Feature `fila` (painel SSE)
- [ ] Feature `templates` (editor + preview)

**E2E Transacionais**
- [ ] Fluxo: login → criar agendamento → concluir → pagamento
- [ ] Fluxo: login → criar reserva → abrir contrato → devolver
- [ ] Fluxo: login → gerar PDF → enviar assinatura → download
- [ ] Cenários negativos avançados (validações, permissões, estados inválidos)

**CI/CD**
- [ ] Completar Swagger (`@ApiProperty` / `@ApiResponse`) em todos os endpoints
- [ ] Pipeline com gates de lint + test + build
- [ ] Validação automática de breaking changes no schema

---

#### 4. UX e Experiência do Cliente (Média Prioridade)
**Status:** 🟡 Parcial

**Landing Page Pública**
- [ ] Enriquecer conteúdo comercial (benefícios, diferenciais, depoimentos)
- [ ] Toggle explícito entre "Agendar Lavagem" e "Alugar Carro"
- [ ] CTAs claros e objetivos
- [ ] Responsividade mobile-first completa

**Portal do Cliente**
- [ ] Meus agendamentos (histórico + próximos)
- [ ] Minhas reservas (histórico + ativas)
- [ ] Meus documentos (CNH, contratos assinados)
- [ ] Histórico de pagamentos

**Mobile Readiness**
- [ ] Header/sidebar responsivos
- [ ] Tabelas adaptáveis (scroll horizontal ou cards)
- [ ] Dialogs e forms otimizados para mobile
- [ ] Navegação touch-friendly

---

## 🚀 Waves de Entrega (Planejamento)

### Wave 1: Core Blockers de Negócio (2-3 semanas)
✅ Storage real S3/MinIO — **CONCLUÍDO**  
✅ Motor PDF real (HTML→PDF) — **CONCLUÍDO**  
🔴 D4Sign completo — **PENDENTE**

### Wave 2: Confiabilidade e Qualidade (2 semanas)
- Completar suites unitárias backend e frontend
- E2E de fluxos críticos
- Swagger completo + gates de CI

### Wave 3: Fechamento Funcional Comercial (2 semanas)
- Pagamentos online (Pagar.me) 📌 **Bloqueado por credenciais**
- Portal do cliente completo
- Aluguel frontend completo
- Landing page otimizada
- Mobile readiness

### Wave 4: Go-Live Readiness (1 semana)
- Hardening de produção (secrets, backup, observabilidade)
- Decisões de infraestrutura (hosting + CDN)
- UAT final por área de negócio

---

## 📊 Matriz de Priorização

| Item | Impacto | Esforço | Prioridade | Bloqueador? |
|------|---------|---------|------------|-------------|
| D4Sign backend + frontend | Alto | Médio | **P0** | Sim (credenciais) |
| Aluguel frontend completo | Alto | Alto | **P1** | Não |
| Backend unit tests críticos | Alto | Médio | **P1** | Não |
| Frontend unit tests críticos | Médio | Médio | **P2** | Não |
| E2E transacionais | Alto | Alto | **P1** | Não |
| Swagger completo | Médio | Baixo | **P2** | Não |
| Portal do cliente | Médio | Médio | **P2** | Não |
| Landing page otimizada | Baixo | Baixo | **P3** | Não |
| Mobile readiness | Médio | Médio | **P2** | Não |
| Pagamentos online (Pagar.me) | Alto | Médio | **P0** | Sim (credenciais) |

---

## 🎬 Ação Imediata Recomendada

### Esta Semana (11-17 Jun 2026)
1. **Obter credenciais D4Sign** → desbloquear assinatura digital
2. **Completar aluguel frontend** → `reserva-form`, `contrato-abertura`, `fechamento`
3. **Expandir backend unit tests** → users, customers, fleet, rental

### Próximas 2 Semanas (18 Jun - 1 Jul 2026)
1. **Finalizar D4Sign** → backend + frontend + testes
2. **Expandir frontend unit tests** → features admin + lavajato
3. **Criar E2E transacionais** → fluxos críticos de receita

### Próximo Mês (Jul 2026)
1. **Obter credenciais Pagar.me** → desbloquear pagamentos online
2. **Portal do cliente completo** → dados reais + documentos
3. **Landing page otimizada** → conteúdo + mobile

---

## 🎯 Critérios de Conclusão 100%

- ✅ Todas as features de negócio implementadas e testadas
- ✅ Cobertura de testes > 80% (unit + E2E)
- ✅ Swagger completo e validado
- ✅ Pipeline CI/CD com gates bloqueantes
- ✅ UAT aprovado por todas as áreas
- ✅ Sem blockers funcionais críticos
- ✅ Infraestrutura de produção decidida e validada

---

## 📦 Backlog Pós-100%

- PWA/offline
- Notificações WhatsApp
- Programa de fidelidade
- Multi-unidade
- Integração DETRAN
- App mobile (se necessário)
- **Bulk operations** para clientes com múltiplos veículos
- **Cobrança recorrente** consolidada por acordo mestre
- **Troca de veículo** na renovação com pool disponível

