# RCar — Arquitetura de Banco (PostgreSQL + Prisma)

## Visão Geral

- SGBD: PostgreSQL
- ORM: Prisma
- Schema fonte: `apps/api/prisma/schema.prisma`

---

## Enum de papéis (`UserRole`)

```prisma
enum UserRole {
  GESTOR_GERAL
  OPERADOR
  OPERADOR_LEITURA
  CLIENTE
}
```

---

## Modelos Prisma (17)

| # | Model | Papel no domínio |
|---|---|---|
| 1 | `User` | Usuários internos/cliente com RBAC |
| 2 | `Customer` | Cadastro de clientes PF/PJ |
| 3 | `Vehicle` | Frota de veículos |
| 4 | `VehicleMaintenance` | Histórico e custo de manutenção da frota |
| 5 | `WashService` | Catálogo de serviços do lavajato |
| 6 | `WashSchedule` | Agendamentos de lavagem |
| 7 | `WashQueue` | Fila presencial de atendimento |
| 8 | `RentalContract` | Contratos de aluguel |
| 9 | `Inspection` | Vistorias de saída/chegada |
| 10 | `ContractIncident` | Ocorrências/incidentes vinculados ao contrato |
| 11 | `Payment` | Pagamento polimórfico (lavagem/aluguel) |
| 12 | `Template` | Templates de documentos |
| 13 | `Product` | Produtos/insumos de estoque |
| 14 | `StockMovement` | Movimentações de estoque (entrada/saída/ajuste) |
| 15 | `ServiceProduct` | Relação N:N entre serviço e produto consumido |
| 16 | `AuditLog` | Rastreabilidade de ações críticas |
| 17 | `PasswordResetToken` | Fluxo seguro de recuperação de senha |

---

## Relações de alto nível

- `Customer` se relaciona com `WashSchedule`, `WashQueue`, `RentalContract` e `Payment`.
- `Vehicle` se relaciona com `RentalContract` e `VehicleMaintenance`.
- `RentalContract` se relaciona com `Inspection`, `ContractIncident` e `Payment`.
- `WashService` se relaciona com `WashSchedule`, `WashQueue` e `ServiceProduct`.
- `Product` se relaciona com `StockMovement` e `ServiceProduct`.
- `User` se relaciona com `AuditLog`.

---

## Observações de domínio

- Pagamentos são centralizados no model `Payment` com referência polimórfica.
- Estoque suporta custo médio ponderado via movimentações.
- `PasswordResetToken` sustenta o fluxo de recuperação de senha no módulo de auth.
- `User.features` (`String[]`, default `[]`) armazena feature flags por usuário interno para autorização modular.
