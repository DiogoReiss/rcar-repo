# ADR — Registro Curto de Decisões Arquiteturais

## ADR-001 — Backend com NestJS + Prisma + PostgreSQL

- **Contexto:** necessidade de API modular com tipagem forte e persistência relacional.
- **Decisão:** usar NestJS no backend, Prisma ORM e PostgreSQL.
- **Consequências:** produtividade alta em módulos/DTOs, migrations versionadas e boa manutenibilidade.

## ADR-002 — Frontend com Angular 21 + PrimeNG + NgRx Signals

- **Contexto:** painel rico em CRUD, dashboards e fluxos operacionais.
- **Decisão:** Angular 21 como base, PrimeNG para UI e NgRx Signals para estado compartilhado.
- **Consequências:** padronização de UI, lazy loading por área e composição reativa com signals.

## ADR-003 — JWT access+refresh com RBAC (4 papéis)

- **Contexto:** múltiplos perfis com regras diferentes de leitura/escrita.
- **Decisão:** autenticação JWT (access + refresh) e RBAC com `GESTOR_GERAL`, `OPERADOR`, `OPERADOR_LEITURA`, `CLIENTE`.
- **Consequências:** controle fino de autorização em backend/frontend e suporte explícito a operador somente leitura.

## ADR-004 — Payment polimórfico (lavagem + aluguel)

- **Contexto:** pagamentos de diferentes domínios com visão financeira unificada.
- **Decisão:** model `Payment` com referência polimórfica para lavagem e aluguel.
- **Consequências:** centralização de consultas/relatórios e simplificação da reconciliação.

## ADR-005 — Baixa automática de estoque + custo médio ponderado

- **Contexto:** necessidade de DRE com custo de insumo confiável no lavajato.
- **Decisão:** debitar estoque automaticamente por serviço e recalcular custo por média ponderada nas entradas.
- **Consequências:** COGS mais preciso, rastreabilidade de margem e suporte ao financeiro analítico.
