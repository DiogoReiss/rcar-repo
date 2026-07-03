# RCar — Sistema de Gestão

Sistema unificado da RCar para operação de **lavajato** e **aluguel de veículos**, com painel administrativo e portal do cliente.

---

## Visão rápida

| Módulo | Descrição |
|---|---|
| **Admin** | KPIs, usuários, serviços, frota, clientes, estoque, templates e financeiro |
| **Lavajato** | Agendamento, fila presencial, atendimento e pagamento |
| **Aluguel** | Disponibilidade, contratos, vistorias e devolução |
| **Portal do Cliente** | Histórico, reservas, agendamentos e documentos |

> Status real do produto: base funcional entregue com lacunas abertas de hardening/qualidade e integrações externas (D4Sign e Pagar.me).  
> Fonte canônica: [`docs/architecture/05-todo.md`](docs/architecture/05-todo.md).

---

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose

---

## Setup rápido

### 1) Instalar dependências

```bash
pnpm install
```

### 2) Configurar ambiente

```bash
cp apps/api/.env.example apps/api/.env
```

### 3) Subir infraestrutura local

```bash
pnpm docker:up
```

Serviços esperados:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (console: `localhost:9001`)

### 4) Rodar migration e seed

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

### 5) Iniciar desenvolvimento

```bash
pnpm dev
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

---

## Estrutura do monorepo

```text
rcar/
├── apps/
│   ├── api/                    # NestJS + Prisma
│   └── web/                    # Angular 21
├── docs/
│   └── architecture/           # Documentação de referência
└── docker-compose.yml
```

---

## Variáveis de ambiente (API)

| Variável | Descrição | Default dev |
|---|---|---|
| `DATABASE_URL` | PostgreSQL | `postgresql://rcar:rcar_secret@localhost:5432/rcar` |
| `JWT_SECRET` | Segredo access token | `dev-secret` |
| `JWT_EXPIRES_IN` | Expiração access token | `15m` |
| `JWT_REFRESH_SECRET` | Segredo refresh token | `dev-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração refresh token | `7d` |
| `REDIS_HOST` | Host Redis | `localhost` |
| `REDIS_PORT` | Porta Redis | `6379` |
| `AWS_BUCKET` | Bucket S3/MinIO | `rcar-documents` |
| `CORS_ORIGIN` | Origem CORS | `http://localhost:4200` |

---

## Scripts principais

### Raiz

```bash
pnpm dev
pnpm build
pnpm docker:up
pnpm docker:down
```

### Frontend (`apps/web`)

```bash
pnpm --filter web start
pnpm --filter web build
pnpm --filter web test:unit
pnpm --filter web test:browser
pnpm --filter web test:e2e
```

### Backend (`apps/api`)

```bash
pnpm --filter api start:dev
pnpm --filter api build
pnpm --filter api start:prod
```

---

## Autenticação e papéis

JWT com access + refresh token (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`).

| Role | Descrição |
|---|---|
| `GESTOR_GERAL` | Acesso total |
| `OPERADOR` | Operação diária (criação/edição) |
| `OPERADOR_LEITURA` | Operação somente leitura |
| `CLIENTE` | Portal do cliente |

---

## Referências de documentação

- **Negócio:** [`docs/architecture/01-business.md`](docs/architecture/01-business.md)
- **Frontend:** [`docs/architecture/02-frontend.md`](docs/architecture/02-frontend.md)
- **Backend:** [`docs/architecture/03-backend.md`](docs/architecture/03-backend.md)
- **Banco de dados (17 models):** [`docs/architecture/04-database.md`](docs/architecture/04-database.md)
- **Status e roadmap canônico:** [`docs/architecture/05-todo.md`](docs/architecture/05-todo.md)
- **Financeiro:** [`docs/architecture/06-financeiro.md`](docs/architecture/06-financeiro.md)
- **Glossário de domínio:** [`docs/architecture/glossario.md`](docs/architecture/glossario.md)
- **ADR (decisões arquiteturais):** [`docs/architecture/adr.md`](docs/architecture/adr.md)

### API

A tabela completa de endpoints foi removida deste README para evitar duplicação.

- Swagger: http://localhost:3000/api/docs
- Resumo técnico por módulo: [`docs/architecture/03-backend.md`](docs/architecture/03-backend.md)

### Banco

Diagrama e detalhamento de schema estão em:

- [`docs/architecture/04-database.md`](docs/architecture/04-database.md)

---

## CI/CD

Pipeline ativo em `.github/workflows/ci.yml` e `.github/workflows/cd.yml`.

---

## Licença

Privado — uso interno RCar.
