# RCar — Sistema de Gestão

Sistema de gestão unificado para a **RCar**, holding que opera dois negócios:

- 🚗 **RCar Renting** — Aluguel de veículos para pessoa física e jurídica
- 🧼 **RCar Lavajato** — Agendamento e atendimento de serviços de lavagem automotiva

Administrado por um painel único: **RCar Admin**.

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Admin** | Dashboard de KPIs, gestão de usuários, serviços, frota, clientes, estoque e templates |
| **Lavajato** | Agendamento online, fila de atendimento presencial, controle de estoque de insumos |
| **Aluguel** | Reservas, contratos, vistorias de saída/chegada e devolução de veículos |
| **Portal do Cliente** | Histórico, agendamentos, reservas e documentos do cliente |

---

## Stack

### Backend (`apps/api`)
| Tecnologia | Versão |
|-----------|--------|
| NestJS | 11 |
| TypeScript | 5 (strict) |
| Prisma ORM | 7 |
| PostgreSQL | 16 |
| JWT (access + refresh) | — |
| Swagger | — |
| BullMQ + Redis | — (Phase 6) |
| MinIO / AWS S3 | — |

### Frontend (`apps/web`)
| Tecnologia | Versão |
|-----------|--------|
| Angular | 21 |
| NgRx Signals | 21 |
| PrimeNG | 21 |
| Vitest | 4 |
| Playwright | 1.59 |

---

## Pré-requisitos

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker** + **Docker Compose**

---

## Setup Rápido

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env` com suas configurações (as defaults funcionam para desenvolvimento local).

### 3. Subir serviços de infra

```bash
pnpm docker:up
```

Isso sobe:
- **PostgreSQL 16** em `localhost:5432`
- **Redis 7** em `localhost:6379`
- **MinIO** em `localhost:9000` (console em `localhost:9001`)

### 4. Rodar a migration e o seed

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

O seed cria:
- Usuário admin: `admin@rcar.com.br` / `mudar123`
- Usuário operador: `operador@rcar.com.br` / `mudar123`
- 4 serviços de lavagem, 5 veículos, 1 template, 5 produtos de estoque

### 5. Iniciar em desenvolvimento

```bash
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Frontend (Angular) | http://localhost:4200 |
| Backend (NestJS) | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/docs |
| MinIO Console | http://localhost:9001 |

---

## Scripts

### Raiz do monorepo

```bash
pnpm dev           # Inicia frontend + backend em modo watch
pnpm build         # Build de produção de todos os apps
pnpm docker:up     # Sobe os containers Docker
pnpm docker:down   # Para os containers Docker
```

### Frontend (`apps/web`)

```bash
pnpm --filter web start          # Dev server
pnpm --filter web build          # Build de produção
pnpm --filter web test:unit      # Testes unitários (Vitest)
pnpm --filter web test:browser   # Testes de integração (Vitest browser)
pnpm --filter web test:e2e       # Testes end-to-end (Playwright)
```

### Backend (`apps/api`)

```bash
pnpm --filter api start:dev      # Dev server com watch
pnpm --filter api build          # Compila para dist/
pnpm --filter api start:prod     # Roda build de produção
```

### Prisma

```bash
cd apps/api

npx prisma migrate dev           # Cria e aplica nova migration
npx prisma db seed               # Popula o banco com dados iniciais
npx prisma studio                # Interface visual do banco
npx prisma generate              # Regenera o client após mudanças no schema
```

---

## Estrutura do Projeto

```
rcar/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schema do banco de dados
│   │   │   ├── migrations/     # Histórico de migrations
│   │   │   └── seed.ts         # Dados iniciais
│   │   └── src/
│   │       ├── common/         # Guards, decorators, interceptors, filters
│   │       ├── modules/
│   │       │   ├── auth/       # JWT auth (login, refresh, recuperação de senha)
│   │       │   └── inventory/  # Estoque de produtos do lavajato
│   │       └── prisma/         # PrismaModule global
│   │
│   └── web/                    # Frontend Angular 21
│       └── src/app/
│           ├── core/
│           │   ├── auth/       # Guards, interceptors, serviço de auth, páginas de login
│           │   ├── layout/     # Shell, Header, Sidebar
│           │   └── store/      # App-level NgRx signal store
│           ├── admin/          # Painel admin (lazy-loaded)
│           │   ├── estoque/    # Gestão de produtos e movimentações
│           │   ├── frota/      # Gestão de veículos
│           │   ├── clientes/   # Gestão de clientes
│           │   ├── servicos/   # Catálogo de serviços
│           │   └── usuarios/   # Gestão de usuários
│           ├── lavajato/       # Módulo lavajato (lazy-loaded)
│           ├── aluguel/        # Módulo aluguel (lazy-loaded)
│           └── portal-cliente/ # Portal do cliente (lazy-loaded)
│
├── docs/
│   ├── architecture/           # Documentação detalhada de arquitetura
│   └── progress/               # Log de progresso por fase
│
└── docker-compose.yml
```

---

## Variáveis de Ambiente

Copie `apps/api/.env.example` para `apps/api/.env` e preencha:

| Variável | Descrição | Default (dev) |
|----------|-----------|---------------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://rcar:rcar_secret@localhost:5432/rcar` |
| `JWT_SECRET` | Segredo para access tokens | `dev-secret` |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_SECRET` | Segredo para refresh tokens | `dev-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `7d` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `AWS_BUCKET` | Bucket S3 / MinIO | `rcar-documents` |
| `CORS_ORIGIN` | Origem permitida pelo CORS | `http://localhost:4200` |

---

## Autenticação

A API usa **JWT** com par de tokens (access + refresh):

```
POST /api/auth/login          → { accessToken, refreshToken }
POST /api/auth/refresh        → { accessToken, refreshToken }
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

O frontend automaticamente:
- Anexa `Authorization: Bearer <token>` em todas as requisições
- Renova o token silenciosamente ao receber `401`
- Redireciona para `/auth/login` se o refresh falhar

### Perfis de acesso

| Role | Descrição |
|------|-----------|
| `GESTOR_GERAL` | Acesso total — admin, relatórios, configurações |
| `OPERADOR` | Acesso operacional — fila, agendamentos, contratos |
| `CLIENTE` | Portal do cliente |

---

## API Reference

Documentação completa via Swagger em:

```
http://localhost:3000/api/docs
```

### Endpoints disponíveis (Phase 2)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Renovar tokens |
| POST | `/api/auth/forgot-password` | Solicitar recuperação de senha |
| POST | `/api/auth/reset-password` | Redefinir senha |
| GET | `/api/inventory/products` | Listar produtos do estoque |
| POST | `/api/inventory/products` | Cadastrar produto |
| GET | `/api/inventory/products/:id` | Detalhe do produto |
| PATCH | `/api/inventory/products/:id` | Atualizar produto |
| DELETE | `/api/inventory/products/:id` | Desativar produto |
| GET | `/api/inventory/products/low-stock` | Produtos abaixo do estoque mínimo |
| POST | `/api/inventory/movements` | Registrar movimentação |
| GET | `/api/inventory/movements` | Histórico de movimentações |

---

## Banco de Dados

**Diagrama simplificado:**

```
users ──────── audit_logs
               
customers ─┬── wash_schedules ──── wash_services ──── service_products ──── products
           ├── wash_queues                                                      │
           └── rental_contracts ─── inspections         stock_movements ───────┘
                    │           └── contract_incidents
                 vehicles ──── vehicle_maintenances

templates
payments
```

**Modelos principais:**

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (com RBAC e soft delete) |
| `customers` | Clientes PF e PJ |
| `vehicles` | Frota de veículos |
| `wash_services` | Catálogo de serviços do lavajato |
| `wash_schedules` | Agendamentos de lavagem |
| `wash_queues` | Fila de atendimento presencial |
| `rental_contracts` | Contratos de aluguel |
| `inspections` | Vistorias de saída/chegada |
| `products` | Produtos/insumos do estoque |
| `stock_movements` | Entradas, saídas e ajustes de estoque |
| `service_products` | Relação produto ↔ serviço (quantidade por uso) |
| `payments` | Pagamentos (polimórfico: lavagem ou aluguel) |
| `templates` | Templates HTML para geração de PDF |
| `audit_logs` | Rastreamento completo de ações críticas |

---

## Progresso do Desenvolvimento

| Fase | Descrição | Status |
|------|-----------|--------|
| **Phase 1** | Backend foundations + Frontend shell/routing | ✅ Completo |
| **Phase 2** | Auth end-to-end + Estoque foundation | ✅ Completo |
| **Phase 3** | Admin CRUD completo | 🔴 Pendente |
| **Phase 4** | Lavajato operacional | 🔴 Pendente |
| **Phase 5** | Aluguel operacional | 🔴 Pendente |
| **Phase 6** | Polish, PDF, D4Sign, notifications | 🔴 Pendente |

Detalhes em [`docs/progress/`](docs/progress/).

---

## Contribuindo

1. Siga as convenções em `.github/copilot-instructions.md`
2. Use `pnpm` — nunca `npm` ou `yarn`
3. Valide com o comando mais restrito possível antes de commitar:
   ```bash
   pnpm --filter web build
   pnpm --filter web test:unit
   pnpm --filter api build
   ```
4. Mantenha componentes Angular com `ChangeDetectionStrategy.OnPush`, `inject()`, `input()`/`output()` e `export default class`

---

## Licença

Privado — uso interno RCar.

