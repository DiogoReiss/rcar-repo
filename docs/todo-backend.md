# RCar — TODO Backend + Database (NestJS + Prisma + PostgreSQL)

## Legenda

- 🔴 Não iniciado
- 🟡 Em andamento
- 🟢 Concluído

---

## 1. Inicialização do Projeto NestJS

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 1.1 | Criar app NestJS em `apps/api` via `@nestjs/cli` (`nest new api --strict --package-manager pnpm`) |
| 🟢 | 1.2 | Remover arquivos boilerplate (`app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`) |
| 🟢 | 1.3 | Configurar `tsconfig.json` com strict mode e path aliases |
| 🟢 | 1.4 | Instalar dependências core: `@nestjs/config`, `@nestjs/swagger`, `class-validator`, `class-transformer` |
| 🟢 | 1.5 | Criar `src/config/app.config.ts` com validação de variáveis de ambiente (Joi ou class-validator) |
| 🟢 | 1.6 | Configurar `main.ts`: global pipes (ValidationPipe), global filters, Swagger, CORS, prefix `/api` |
| 🟢 | 1.7 | Criar `.env.example` com todas as variáveis documentadas |
| 🟢 | 1.8 | Verificar build: `pnpm --filter api build` |

---

## 2. Docker Compose (Infraestrutura Local)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 2.1 | Criar `docker-compose.yml` na raiz do monorepo |
| 🟢 | 2.2 | Serviço `postgres`: imagem `postgres:16-alpine`, porta 5432, volume persistente, variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| 🟢 | 2.3 | Serviço `redis`: imagem `redis:7-alpine`, porta 6379 |
| 🟢 | 2.4 | Serviço `minio`: imagem `minio/minio`, porta 9000 (API) + 9001 (console), credenciais default, bucket inicial `rcar-documents` |
| 🟢 | 2.5 | Criar script `pnpm docker:up` e `pnpm docker:down` no root `package.json` |
| 🟢 | 2.6 | Adicionar `.dockerignore` |
| 🔴 | 2.7 | Documentar no README como subir o ambiente local |

---

## 3. Prisma + Database Schema

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 3.1 | Instalar Prisma: `prisma` (dev) + `@prisma/client` |
| 🟢 | 3.2 | Inicializar Prisma: `npx prisma init` — gera `prisma/schema.prisma` e atualiza `.env` |
| 🟢 | 3.3 | Configurar datasource com `DATABASE_URL` do `.env` |
| 🟢 | 3.4 | Criar model `User` (id uuid, nome, email unique, senha_hash, role enum, ativo, timestamps, soft delete) |
| 🟢 | 3.5 | Criar model `Customer` (id uuid, tipo PF/PJ, nome, cpf_cnpj unique, email, telefone, endereco json, campos CNH, campos PJ, timestamps, soft delete) |
| 🟢 | 3.6 | Criar model `Vehicle` (id uuid, placa unique, modelo, ano, cor, categoria, status enum, fotos[], km_atual, timestamps, soft delete) |
| 🟢 | 3.7 | Criar model `VehicleMaintenance` (id, vehicle_id FK, descricao, custo decimal, data, created_at) |
| 🟢 | 3.8 | Criar model `WashService` (id, nome, descricao, preco decimal, duracao_min, ativo, timestamps) |
| 🟢 | 3.9 | Criar model `WashSchedule` (id, customer_id FK nullable, nome/telefone avulso, service_id FK, data_hora, status enum, observacoes, timestamps) |
| 🟢 | 3.10 | Criar model `WashQueue` (id, customer_id FK nullable, nome avulso, service_id FK, veiculo_placa, status enum, posicao, timestamps, concluido_at) |
| 🟢 | 3.11 | Criar model `RentalContract` (id, customer_id FK, vehicle_id FK, modalidade enum, datas retirada/devolução, valores decimais, seguro, status enum, km, combustível, observações, pdf_url, d4sign_id, timestamps) |
| 🟢 | 3.12 | Criar model `Inspection` (id, contract_id FK, tipo SAIDA/CHEGADA, checklist json, fotos[], observacoes, created_at) |
| 🟢 | 3.13 | Criar model `ContractIncident` (id, contract_id FK, tipo enum, descricao, valor decimal, fotos[], data, created_at) |
| 🟢 | 3.14 | Criar model `Payment` (id, ref_type enum, schedule_id FK unique nullable, queue_id FK unique nullable, contract_id FK nullable, customer_id FK nullable, valor decimal, metodo enum, status enum, pagarme_tx_id, observacoes, timestamps) |
| 🟢 | 3.15 | Criar model `Template` (id, nome, tipo enum, conteudo_html text, variaveis[], ativo, timestamps) |
| 🟢 | 3.16 | Criar model `AuditLog` (id, user_id FK, acao, entidade, entidade_id, detalhes json, ip, created_at) |
| 🟢 | 3.17 | Adicionar índices recomendados (schedules por data+status, contracts por status+customer, payments por ref_type, queue por posição, vehicles por status, audit_log por data) |
| 🟢 | 3.18 | Rodar primeira migration: `prisma/migrations/20260506100613_init/migration.sql` aplicada |
| 🟢 | 3.19 | Criar `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`) |
| 🟢 | 3.20 | Registrar `PrismaModule` como import global em `app.module.ts` |

---

## 4. Seed de Dados Iniciais

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 4.1 | Criar `prisma/seed.ts` |
| 🟢 | 4.2 | Seed: usuário admin (`admin@rcar.com.br`, role GESTOR_GERAL, senha hash `mudar123`) |
| 🟢 | 4.3 | Seed: 3+ serviços de lavagem (Lavagem Simples, Lavagem Completa, Polimento) com preço e duração |
| 🟢 | 4.4 | Seed: 5 veículos da frota com placas, modelos, categorias variadas |
| 🟢 | 4.5 | Seed: 1 template de contrato de locação padrão com variáveis |
| 🟢 | 4.6 | Configurar script `prisma.seed` no `package.json` do api |
| 🔴 | 4.7 | Rodar seed e validar contra banco real: `pnpm --filter api prisma:seed` |

---

## 5. Módulo Common (Infraestrutura transversal)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 5.1 | Criar decorator `@Roles(...roles)` em `src/common/decorators/roles.decorator.ts` |
| 🟢 | 5.2 | Criar decorator `@CurrentUser()` em `src/common/decorators/current-user.decorator.ts` |
| 🟢 | 5.3 | Criar `JwtAuthGuard` em `src/common/guards/jwt-auth.guard.ts` |
| 🟢 | 5.4 | Criar `RolesGuard` em `src/common/guards/roles.guard.ts` (com spec) |
| 🟢 | 5.5 | `TransformInterceptor` removido intencionalmente (A14) — endpoints retornam shape direta; paginação usa `{ data, total, page, perPage, totalPages }` por convenção |
| 🟢 | 5.6 | Criar `LoggingInterceptor` (log de request/response com duração) — registrado globalmente em `main.ts` |
| 🟢 | 5.7 | Criar `AllExceptionsFilter` (`@Catch()`) mapeando Prisma P1xxx→503, P2xxx→4xx, além do `HttpExceptionFilter` original |
| 🟢 | 5.8 | Criar `PaginationDto` (page, perPage) em `src/common/dto/pagination.dto.ts` |
| 🟡 | 5.9 | Guards/interceptors globais: `AllExceptionsFilter` e `LoggingInterceptor` registrados em `main.ts`; `JwtAuthGuard` e `RolesGuard` aplicados por controller (não globalmente) — padrão intencional |

---

## 6. Módulo Auth

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 6.1 | Instalar `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` |
| 🟢 | 6.2 | Criar `src/modules/auth/auth.module.ts` (importa JwtModule, PassportModule, MailModule) |
| 🟢 | 6.3 | Criar `src/modules/auth/strategies/jwt.strategy.ts` (valida access token, extrai user do payload) |
| 🟢 | 6.4 | Criar `src/modules/auth/strategies/refresh-jwt.strategy.ts` (valida refresh token) |
| 🟢 | 6.5 | Criar `src/modules/auth/auth.service.ts` (login, refresh, logout, forgotPassword, resetPassword) com httpOnly cookies, token blacklist e brute-force protection via `LoginAttemptsService` |
| 🟢 | 6.6 | Criar `src/modules/auth/auth.controller.ts` (POST /login, POST /refresh, POST /logout, POST /forgot-password, POST /reset-password, GET /me) |
| 🟢 | 6.7 | Criar DTOs: `LoginDto`, `TokenResponseDto`, `ForgotPasswordDto`, `ResetPasswordDto` |
| 🟢 | 6.8 | JWT config integrado ao `auth.module.ts` via `ConfigService` (secret, expiresIn, refreshSecret) |
| 🟢 | 6.9 | `auth.service.spec.ts` existe |
| 🔴 | 6.10 | Teste E2E: POST /api/auth/login com credenciais válidas e inválidas (arquivo stub em `test/app.e2e-spec.ts` sem cenários reais) |

---

## 7. Módulo Users (Admin)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 7.1 | Criar `src/modules/users/users.module.ts` |
| 🟢 | 7.2 | Criar `src/modules/users/users.service.ts` (findAll paginado, findOne, create, update, softDelete) |
| 🟢 | 7.3 | Criar `src/modules/users/users.controller.ts` (GET /, POST /, GET /:id, PATCH /:id, DELETE /:id) com `@Roles('GESTOR_GERAL')` |
| 🟢 | 7.4 | Criar DTOs: `CreateUserDto`, `UpdateUserDto` com validação (email unique, role enum, senha min 8 chars) |
| 🔴 | 7.5 | Testes unitários: users.service |
| 🔴 | 7.6 | Teste E2E: CRUD completo /api/users |

---

## 8. Módulo Customers

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 8.1 | Criar `src/modules/customers/customers.module.ts` |
| 🟢 | 8.2 | Criar `src/modules/customers/customers.service.ts` (findAll com filtro PF/PJ e busca, findOne com histórico, create, update) |
| 🟢 | 8.3 | Criar `src/modules/customers/customers.controller.ts` (GET /, POST /, GET /:id, PATCH /:id) |
| 🟢 | 8.4 | Criar DTOs: `CreateCustomerDto`, `UpdateCustomerDto` (validação: cpf_cnpj formato, telefone, campos condicionais PF/PJ) |
| 🔴 | 8.5 | Implementar upload de CNH via Storage service (depende do módulo Storage — ver item 10) |
| 🔴 | 8.6 | Testes unitários: customers.service |

---

## 9. Módulo Fleet

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 9.1 | Criar `src/modules/fleet/fleet.module.ts` |
| 🟢 | 9.2 | Criar `src/modules/fleet/fleet.service.ts` (findAll com filtro status/categoria, findOne com histórico de manutenções, create, update, findAvailable, addMaintenance, completeMaintenance) |
| 🟢 | 9.3 | Criar `src/modules/fleet/fleet.controller.ts` (GET /, POST /, GET /:id, PATCH /:id, DELETE /:id, GET /available, GET /:id/maintenances, POST /:id/maintenances, PATCH /:id/complete-maintenance) |
| 🟢 | 9.4 | Criar DTOs: `CreateVehicleDto`, `UpdateVehicleDto`, `CreateMaintenanceDto` (com `setMantencao` flag) |
| 🔴 | 9.5 | Implementar upload de fotos via Storage service (depende do módulo Storage — ver item 10) |
| 🟢 | 9.6 | Endpoints de manutenção: `POST /fleet/:id/maintenances` (registra e opcionalmente coloca MANUTENCAO), `PATCH /fleet/:id/complete-maintenance` (retorna para DISPONIVEL), `GET /fleet/:id/maintenances` (histórico) |
| 🔴 | 9.7 | Testes unitários: fleet.service (incluindo lógica de disponibilidade e manutenção) |

---

## 10. Módulo Storage (S3/MinIO)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 10.1 | Instalar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` |
| 🔴 | 10.2 | Criar `src/config/storage.config.ts` (region, bucket, endpoint para MinIO local, credentials) |
| 🔴 | 10.3 | Criar `src/modules/storage/storage.module.ts` |
| 🔴 | 10.4 | Criar `src/modules/storage/storage.service.ts` (upload buffer/stream, getSignedUrl, delete) |
| 🔴 | 10.5 | Testar upload contra MinIO local |

---

## 11. Módulo Wash (Lavajato)

### 11a. Catálogo de Serviços (`/wash/services`)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 11a.1 | Criar `src/modules/wash/wash.module.ts` |
| 🟢 | 11a.2 | Criar `src/modules/wash/wash.service.ts` (findAll, findOne, create, update, remove/soft-delete) |
| 🟢 | 11a.3 | Criar `src/modules/wash/wash.controller.ts` (GET /wash/services, POST, GET /:id, PATCH /:id, DELETE /:id) |
| 🟢 | 11a.4 | Criar DTOs: `CreateWashServiceDto`, `UpdateWashServiceDto` |
| 🔴 | 11a.5 | Testes unitários |

### 11b. Agendamentos (`/lavajato/schedules`)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 11b.1 | Criar `src/modules/lavajato/lavajato.service.ts` com `getSchedules`, `createSchedule`, `updateScheduleStatus`, `cancelSchedule` |
| 🟢 | 11b.2 | Criar `src/modules/lavajato/lavajato.controller.ts` com rotas GET/POST/PATCH/DELETE de schedules |
| 🟢 | 11b.3 | Criar DTOs: `CreateScheduleDto`, `UpdateScheduleDto` |
| 🟢 | 11b.4 | Implementar lógica de disponibilidade: `GET /lavajato/schedules/availability?date=&serviceId=` — slots livres por duração do serviço, sem sobreposição. `GET /lavajato/schedules?month=YYYY-MM` para sumário mensal. Frontend: `MiniCalendarComponent` com dots por dia, layout de coluna dupla (sidebar + lista), slot picker visual no dialog de novo agendamento. |
| 🔴 | 11b.5 | Testes unitários da lógica de disponibilidade |

### 11c. Fila Presencial (`/lavajato/queue`)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 11c.1 | `lavajato.service.ts` com `getQueue`, `addToQueue` (posição auto-increment), `advanceQueue`, `removeFromQueue` |
| 🟢 | 11c.2 | `lavajato.controller.ts` com rotas GET /queue, POST /queue, PATCH /:id/advance, DELETE /:id |
| 🟢 | 11c.3 | DTOs: `CreateQueueEntryDto`, `CreatePaymentDto` |
| 🟢 | 11c.4 | SSE endpoint `GET /lavajato/queue/stream` com `@Sse` e `QueueEventsService` (push on change, não polling) |
| 🔴 | 11c.5 | Testes unitários |

---

## 12. Módulo Rental (Aluguel)

### 12a. Reservas / Disponibilidade

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 12a.1 | Criar `src/modules/rental/rental.module.ts` |
| 🟢 | 12a.2 | Criar `src/modules/rental/rental.service.ts` com `checkAvailability` (veículos não conflitantes por período) |
| 🟢 | 12a.3 | Lógica de preço integrada ao `create` (diária × dias, sem módulo separado) |
| 🟢 | 12a.4 | Criar `src/modules/rental/rental.controller.ts` com `GET /rental/available`, `GET/POST /rental/contracts`, `GET /:id` |
| 🟢 | 12a.5 | Criar DTOs: `CreateContractDto`, `OpenContractDto`, `CloseContractDto` |
| 🔴 | 12a.6 | Testes unitários: rental.service (checkAvailability, cálculo de valor) |

### 12b. Contratos (ciclo de vida)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 12b.1 | `rental.service.ts` com `openContract` (atualiza veículo para ALUGADO + cria Inspection de saída), `closeContract` (devolução + cálculo extras), `cancelContract` |
| 🟢 | 12b.2 | `PATCH /:id/open`, `PATCH /:id/close`, `PATCH /:id/cancel` no controller |
| 🟢 | 12b.3-12b.5 | `registerPayment` para contratos; vistoria de chegada e saída via `CloseContractDto`/`OpenContractDto` |
| 🔴 | 12b.6 | Testes unitários: contract lifecycle (abertura, fechamento, cancelamento) |

---

## 13. Módulo Payments (standalone)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟡 | 13.1 | Pagamentos **embedded** nos módulos lavajato (`POST /schedules/:id/payment`, `POST /queue/:id/payment`) e rental (`POST /contracts/:id/payment`) — sem módulo standalone |
| 🔴 | 13.2 | Criar `src/modules/payments/payments.module.ts` com `PaymentsService` e `PaymentsController` standalone (GET /payments com filtros) |
| 🔴 | 13.3 | Testes unitários |
| 🔴 | 13.4 | Agregação por método de pagamento (`PIX`, `DINHEIRO`, `CARTAO_*`) para consumo do dashboard financeiro |

---

## 14. Módulo Documents (Templates + PDF)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 14.1 | Criar `src/modules/templates/templates.module.ts` |
| 🟢 | 14.2 | Criar `src/modules/templates/templates.service.ts` com CRUD + `preview` (interpolação de variáveis) |
| 🟢 | 14.3 | Criar `src/modules/templates/templates.controller.ts` (GET /, POST, GET /:id, PATCH /:id, POST /:id/preview) |
| 🔴 | 14.4 | Geração de PDF real: instalar `puppeteer`, criar `pdf-generator.service.ts` que renderiza HTML e retorna Buffer |
| 🔴 | 14.5 | Criar `src/modules/documents/services/d4sign.service.ts` (sendForSignature, getStatus, handleWebhook) |
| 🔴 | 14.6 | Endpoint webhook D4Sign: `POST /webhooks/d4sign` |
| 🔴 | 14.7 | Testes unitários: template interpolation, pdf-generator (mock puppeteer) |

---

## 15. Módulo Notifications (E-mail)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 15.1 | Instalar `nodemailer` (sem `@nestjs-modules/mailer` — integração direta do transporter) |
| 🟢 | 15.2 | Criar `src/modules/mail/mail.module.ts` e `mail.service.ts` com transporter configurado via `ConfigService` |
| 🟢 | 15.3 | Implementar `sendScheduleConfirmation`, `sendPasswordReset`, `sendContractReady` |
| 🔴 | 15.4 | Adicionar templates HTML mais ricos (Handlebars ou string templates) para os e-mails |
| 🔴 | 15.5 | Testes unitários: mail.service (mock transporter) |

---

## 16. Jobs Assíncronos (BullMQ + Redis)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 16.1 | Instalar `@nestjs/bull`, `bull` e `@nestjs/schedule` |
| 🟢 | 16.2 | Configurar BullModule com Redis via `ConfigService` em `jobs.module.ts` |
| 🟢 | 16.3 | Queue `email` com `EmailProcessor` — processa jobs `send` do BullMQ |
| 🔴 | 16.4 | Queue `pdf-generation` + processor (depende de item 14.4) |
| 🟢 | 16.5 | Cron jobs diários: `checkLowStock` (08h — alerta de estoque mínimo) e `sendDailyReminders` (07h — lembrete de agendamentos do dia) |
| 🔴 | 16.6 | Testes unitários dos processors |

---

## 17. Módulo Reports

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 17.1 | Criar `src/modules/reports/reports.module.ts` |
| 🟢 | 17.2 | `reports.service.ts` com `getDailySummary`, `getMonthlyStats` |
| 🟢 | 17.3 | `getStockReport`, `getDashboardKpis`, `getChartsData` (serviços semanais, hora de pico, receita, uso de produtos) |
| 🟢 | 17.4 | Criar `reports.controller.ts` (GET /reports/daily, /monthly, /stock, /dashboard, /charts) com `@Roles('GESTOR_GERAL')` |
| 🔴 | 17.5 | Testes unitários |
| 🟢 | 17.6 | `getFinancialSummary(from, to)` — DRE simplificado: receita lavajato + aluguel - custos insumos - custos manutenção = margem bruta |
| 🟢 | 17.7 | `getMaintenanceCosts(from, to)` — custo de manutenção por veículo e por período |
| 🟢 | 17.8 | `getRentalReceivables()` — contratos encerrados com saldo pendente (faturado vs. pago) |
| 🟢 | 17.9 | `getStockCostAnalysis(from, to)` — COGS: custo de insumos consumidos por período |
| 🟢 | 17.10 | Adicionar `custoInsumos` e `custoManutencao` ao `getDailySummary` e `getMonthlyStats` |
| 🟢 | 17.11 | Endpoints: `GET /reports/financial-summary`, `/fleet/maintenance-costs`, `/rental/receivables`, `/stock/cost-analysis` |

---

## 17b. Automação Financeira

> Referência: [`docs/architecture/06-financeiro.md`](../../docs/architecture/06-financeiro.md)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 17b.1 | Baixa automática de estoque ao concluir `WashSchedule`/`WashQueue`: criar `StockMovement` (SAIDA) para cada `ServiceProduct` vinculado ao serviço |
| 🔴 | 17b.2 | Custo médio ponderado: recalcular `Product.custoUnitario` a cada `StockMovement` de ENTRADA com `custoUnitario` informado |
| 🔴 | 17b.3 | Schema migration: adicionar `tipo`, `status`, `fornecedor` em `VehicleMaintenance` |
| 🔴 | 17b.4 | Schema migration: adicionar `custoUnitario` em `StockMovement` |
| 🔴 | 17b.5 | Schema migration: adicionar `cobradoCliente` em `ContractIncident`, novos `IncidentType` (KM_EXCEDENTE, COMBUSTIVEL) |

---

## 18. Swagger / Documentação da API

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 18.1 | Configurar Swagger em `main.ts` (título, versão, description, bearerAuth + cookieAuth) |
| 🟢 | 18.2 | `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` nos controllers principais |
| 🔴 | 18.3 | Adicionar `@ApiProperty` em **todos** os DTOs (cobertura parcial) |
| 🔴 | 18.4 | Validar que Swagger UI (`/api/docs`) está completo e sem erros com `@ApiResponse` em cada endpoint |

---

## 19. Lint, Formato e CI

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 19.1 | `eslint.config.mjs` existe com `@typescript-eslint` |
| 🔴 | 19.2 | Configurar Prettier (`.prettierrc` não existe em `apps/api`) |
| 🟢 | 19.3 | Scripts `pnpm lint` e `pnpm test` no `package.json` do api |
| 🟢 | 19.4 | Build limpo: `pnpm --filter api build` passa sem erros |

---

## 20. Testes E2E (Supertest)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 20.1 | `test/jest-e2e.json` e `test/app.e2e-spec.ts` existem (stub apenas) |
| 🔴 | 20.2 | Criar helper de setup: banco de teste isolado, seed mínimo, cleanup entre testes |
| 🔴 | 20.3 | E2E: Auth (login válido/inválido, refresh, forgot/reset) |
| 🔴 | 20.4 | E2E: Users CRUD com RBAC (operador não pode criar user) |
| 🔴 | 20.5 | E2E: Wash services CRUD |
| 🔴 | 20.6 | E2E: Schedule (criar agendamento, verificar disponibilidade, alterar status) |
| 🔴 | 20.7 | E2E: Rental (reservar → abrir contrato → vistoria → fechar) |
| 🔴 | 20.8 | E2E: Payments (registrar pagamento para wash e rental) |

---

## 21. Módulos Extras Implementados (fora do plano original)

| Status | Item | Descrição |
|--------|------|-----------|
| 🟢 | InventoryModule | `src/modules/inventory/` — CRUD de produtos (`Product`) e movimentações de estoque (`StockMovement`) com `GET/POST /inventory/products`, `GET/POST /inventory/movements`, controle de `quantidadeAtual` e `estoqueMinimo` |
| 🟢 | HealthModule | `src/modules/health/` — endpoint `GET /health` para uptime checks |
| 🟢 | ThrottlerModule | Rate limiting global (60 req/min/IP) + override 5/min para login protegendo contra brute force |
| 🟢 | TokenBlacklistService | Invalidação de refresh tokens em memória (logout + rotação) |
| 🟢 | LoginAttemptsService | Rastreamento de falhas de login por IP/email para bloqueio temporário |
