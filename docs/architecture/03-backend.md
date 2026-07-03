# RCar — Arquitetura Backend (NestJS)

## Stack

- NestJS 11 + TypeScript strict
- Prisma ORM + PostgreSQL
- JWT (access + refresh) com RBAC
- Swagger (`/api/docs`)
- BullMQ + Redis
- Storage S3/MinIO por URLs assinadas

---

## Estrutura de módulos (apps/api/src/modules)

### Resumo módulo a módulo (estado atual)

1. **auth** — autenticação, refresh, recuperação/reset de senha e cadastro de cliente.
2. **users** — CRUD de usuários e gestão de papéis.
3. **customers** — CRUD e histórico operacional de clientes.
4. **fleet** — gestão de veículos, disponibilidade e manutenção.
5. **wash** — catálogo de serviços de lavagem.
6. **lavajato** — agendamento, fila presencial (SSE), atendimentos e pagamentos de lavagem.
7. **rental** — disponibilidade, contratos, abertura/fechamento e vistorias.
8. **payments** — consolidação/consulta de pagamentos por filtros.
9. **documents** — geração de PDF a partir de templates e fluxos documentais.
10. **storage** — upload/download por URL assinada (S3/MinIO).
11. **reports** — dashboards e relatórios operacionais/financeiros.
12. **inventory** — produtos, movimentações e alertas de estoque.
13. **jobs** — tarefas assíncronas e jobs recorrentes.
14. **mail** — envio de e-mails transacionais.
15. **templates** — CRUD/preview de templates de documentos.
16. **health** — endpoint de saúde da aplicação.

---

## RBAC e autorização

Roles ativas:

- `GESTOR_GERAL`
- `OPERADOR`
- `OPERADOR_LEITURA`
- `CLIENTE`

Padrão esperado:

- Endpoints de leitura: permitem `GESTOR_GERAL`, `OPERADOR` e `OPERADOR_LEITURA` (conforme domínio).
- Endpoints de escrita: restritos a `GESTOR_GERAL` e `OPERADOR`.
- Portal do cliente: restrição por `CLIENTE` + escopo do próprio recurso.
- Endpoints internos também podem exigir `features` por módulo via `RequiresFeatures` + `FeaturesGuard`.
- `GESTOR_GERAL` faz bypass de `features`; `CLIENTE` não acessa módulos internos.
- JWT carrega `features` e o refresh recalcula a lista a partir do banco para refletir mudanças administrativas.

---

## Integrações externas

| Integração | Situação |
|---|---|
| SMTP (mail) | 🟢 Implementado |
| D4Sign | 🔴 Planejado — não implementado |
| Pagar.me | 🔴 Planejado — não implementado |
| WhatsApp API | 🔴 Planejado — não implementado |

---

## Qualidade e pipeline

- CI e CD existem em `.github/workflows/ci.yml` e `.github/workflows/cd.yml`.
- Swagger ativo em ambiente local.
- Testes unitários e E2E já presentes, com cobertura ainda parcial para cenários avançados.

---

## Destaques recentes — Rental

- `PATCH /rental/contracts/:id/open` e `PATCH /rental/contracts/:id/close` aceitam `fotos?: string[]` nas DTOs de operação.
- `openContract` e `closeContract` persistem `Inspection.fotos` com os anexos enviados no payload.
- `closeContract` mantém a regra de cálculo de `valorTotalReal` somando incidentes com `cobradoCliente !== false`.

### Seam `RentalRepository` + evento de domínio `ContratoFechado`

- Todo acesso Prisma do módulo Contrato foi centralizado no seam `RentalRepository` (`abstract class` provida por `PrismaRentalRepository`). O `RentalService` passou a orquestrar regras de negócio e falar apenas com essa interface — sem `prisma.*` nem `include` espalhados, e com um adaptador in-memory usado nos testes.
- `closeContract` deixou de chamar `PaymentsService` diretamente dentro de um `try/catch` que engolia falhas de cobrança. Após a transação de devolução commitar, o serviço publica o evento de domínio `ContratoFechado` no `DomainEventsService` (barramento in-process global em `common/events`).
- A Pagamento assina o evento via `ContractClosedListener` e executa a auto-cobrança do saldo em aberto. As falhas de pagamento agora vivem — e são logadas — no módulo Pagamento, não são silenciadas no Contrato.
- O `DomainEventsService` é `@Global`, então nenhum módulo importa o outro para o evento (evita ciclos de DI); o `RentalModule` só importa `PaymentsModule` pelo `PayableRegistry`.

---

## Destaques recentes — Pagamentos (seam `PayableStrategy`)

- A resolução de cobráveis deixou de ser uma cadeia `if (refType === …)` dentro do `PaymentsService`.
- Cada módulo de domínio implementa sua própria `PayableStrategy` (`RentalPayableStrategy`, `WashSchedulePayableStrategy`, `WashQueuePayableStrategy`) e se registra no `PayableRegistry` no bootstrap.
- `PaymentsService` apenas chama `PayableRegistry.resolve(refType, refId)`; adicionar um novo cobrável (ex.: incidente) é um novo arquivo em um único módulo, sem alterar o `PaymentsService`.
- `ContractClosedListener` reage ao evento `ContratoFechado` do Contrato e dispara a auto-cobrança (`getBalance` + `startCharge`) sem que o Contrato conheça o `PaymentsService`.

---

## Destaques recentes — Atendimento/Estoque (evento `AtendimentoConcluido`)

- A baixa automática de estoque deixou de ser um método privado escondido em `LavajatoService` (`debitStock`) chamado dentro de `updateScheduleStatus`/`advanceQueue`. Ao concluir o atendimento, o serviço publica o evento de domínio `AtendimentoConcluido` no `DomainEventsService` global.
- O módulo de estoque assina o evento via `StockDeductionService` e executa a baixa. Bugs e falhas de baixa passam a viver — e ser logados — no módulo de inventário, não silenciados no fluxo do lavajato.
- A regra de custo médio ponderado (ADR-005) foi isolada na função pura `calculateStockMovement` (`stock-movement-calculator.ts`), testável sem banco. A persistência foi movida para o seam `InventoryRepository` (`PrismaInventoryRepository`), que também mantém a baixa automática atômica (D1) em uma única transação, ignorando produtos que ficariam negativos.
- `InventoryService.createMovement` passou a compor `calculateStockMovement` + `InventoryRepository`, separando cálculo de persistência.
