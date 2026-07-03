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
