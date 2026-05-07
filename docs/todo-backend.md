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
| 🔴 | 3.18 | Rodar primeira migration: `npx prisma migrate dev --name init` |
| 🟢 | 3.19 | Criar `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`) |
| 🟢 | 3.20 | Registrar `PrismaService` como provider global |

---

## 4. Seed de Dados Iniciais

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 4.1 | Criar `prisma/seed.ts` |
| 🔴 | 4.2 | Seed: usuário admin (`admin@rcar.com.br`, role GESTOR_GERAL, senha hash `mudar123`) |
| 🔴 | 4.3 | Seed: 3+ serviços de lavagem (Lavagem Simples, Lavagem Completa, Polimento) com preço e duração |
| 🔴 | 4.4 | Seed: 5 veículos da frota com placas, modelos, categorias variadas |
| 🔴 | 4.5 | Seed: 1 template de contrato de locação padrão com variáveis |
| 🔴 | 4.6 | Configurar script `prisma.seed` no `package.json` do api |
| 🔴 | 4.7 | Rodar seed e validar: `pnpm --filter api prisma:seed` |

---

## 5. Módulo Common (Infraestrutura transversal)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 5.1 | Criar decorator `@Roles(...roles)` em `src/common/decorators/roles.decorator.ts` |
| 🔴 | 5.2 | Criar decorator `@CurrentUser()` em `src/common/decorators/current-user.decorator.ts` |
| 🔴 | 5.3 | Criar `JwtAuthGuard` em `src/common/guards/jwt-auth.guard.ts` |
| 🔴 | 5.4 | Criar `RolesGuard` em `src/common/guards/roles.guard.ts` |
| 🔴 | 5.5 | Criar `TransformInterceptor` (padroniza resposta `{ data, meta }`) |
| 🔴 | 5.6 | Criar `LoggingInterceptor` (log de request/response com duração) |
| 🔴 | 5.7 | Criar `HttpExceptionFilter` (padroniza erros `{ statusCode, message, error, timestamp }`) |
| 🔴 | 5.8 | Criar `PaginationDto` (page, perPage, sort) e `ApiResponseDto<T>` |
| 🔴 | 5.9 | Registrar guards, interceptors e filters globalmente no `main.ts` |

---

## 6. Módulo Auth

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 6.1 | Instalar `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` |
| 🔴 | 6.2 | Criar `src/modules/auth/auth.module.ts` (importa JwtModule, PassportModule) |
| 🔴 | 6.3 | Criar `src/modules/auth/strategies/jwt.strategy.ts` (valida access token, extrai user do payload) |
| 🔴 | 6.4 | Criar `src/modules/auth/strategies/refresh-jwt.strategy.ts` (valida refresh token) |
| 🔴 | 6.5 | Criar `src/modules/auth/auth.service.ts` (login: valida credenciais, gera tokens; refresh: gera novo par; forgotPassword: gera token + dispara email; resetPassword: valida token e atualiza senha) |
| 🔴 | 6.6 | Criar `src/modules/auth/auth.controller.ts` (POST /login, POST /refresh, POST /forgot-password, POST /reset-password) |
| 🔴 | 6.7 | Criar DTOs: `LoginDto`, `TokenResponseDto`, `ForgotPasswordDto`, `ResetPasswordDto` |
| 🔴 | 6.8 | Criar config `src/config/jwt.config.ts` (secret, expiresIn, refreshSecret, refreshExpiresIn) |
| 🔴 | 6.9 | Testes unitários: auth.service (mock PrismaService + JwtService) |
| 🔴 | 6.10 | Teste E2E: POST /api/auth/login com credenciais válidas e inválidas |

---

## 7. Módulo Users (Admin)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 7.1 | Criar `src/modules/users/users.module.ts` |
| 🔴 | 7.2 | Criar `src/modules/users/users.service.ts` (findAll paginado, findOne, create, update, softDelete) |
| 🔴 | 7.3 | Criar `src/modules/users/users.controller.ts` (GET /, POST /, GET /:id, PATCH /:id, DELETE /:id) com `@Roles('GESTOR_GERAL')` |
| 🔴 | 7.4 | Criar DTOs: `CreateUserDto`, `UpdateUserDto` com validação (email unique, role enum, senha min 8 chars) |
| 🔴 | 7.5 | Testes unitários: users.service |
| 🔴 | 7.6 | Teste E2E: CRUD completo /api/users |

---

## 8. Módulo Customers

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 8.1 | Criar `src/modules/customers/customers.module.ts` |
| 🔴 | 8.2 | Criar `src/modules/customers/customers.service.ts` (findAll com filtro PF/PJ e busca, findOne com histórico, create, update) |
| 🔴 | 8.3 | Criar `src/modules/customers/customers.controller.ts` (GET /, POST /, GET /:id, PATCH /:id) |
| 🔴 | 8.4 | Criar DTOs: `CreateCustomerDto`, `UpdateCustomerDto` (validação: cpf_cnpj formato, telefone, campos condicionais PF/PJ) |
| 🔴 | 8.5 | Implementar upload de CNH via Storage service (ver módulo Storage) |
| 🔴 | 8.6 | Testes unitários: customers.service |

---

## 9. Módulo Fleet

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 9.1 | Criar `src/modules/fleet/fleet.module.ts` |
| 🟢 | 9.2 | Criar `src/modules/fleet/fleet.service.ts` (findAll com filtro status/categoria, findOne com histórico, create, update, findAvailable por período) |
| 🟢 | 9.3 | Criar `src/modules/fleet/fleet.controller.ts` (GET /, POST /, GET /:id, PATCH /:id, GET /available) |
| 🟢 | 9.4 | Criar DTOs: `CreateVehicleDto`, `UpdateVehicleDto` (placa formato, ano range, categoria enum) |
| 🔴 | 9.5 | Implementar upload de fotos via Storage service |
| 🟢 | 9.6 | **Endpoints de manutenção**: `POST /fleet/:id/maintenances` (registra manutenção, opcionalmente define status MANUTENCAO via `setMantencao`), `PATCH /fleet/:id/complete-maintenance` (retorna veículo para DISPONIVEL), `GET /fleet/:id/maintenances` (histórico). DTO `CreateMaintenanceDto` com validação. |
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

### 11a. Catálogo de Serviços

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 11a.1 | Criar `src/modules/wash/wash.module.ts` |
| 🔴 | 11a.2 | Criar `src/modules/wash/services/services-catalog.service.ts` (findAll, create, update, toggle ativo) |
| 🔴 | 11a.3 | Criar `src/modules/wash/controllers/services-catalog.controller.ts` (GET /wash/services, POST, PATCH /:id) |
| 🔴 | 11a.4 | Criar DTOs: `CreateServiceDto`, `UpdateServiceDto` |
| 🔴 | 11a.5 | Testes unitários |

### 11b. Agendamentos

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 11b.1 | Criar `src/modules/wash/services/schedule.service.ts` (getAvailability: calcula slots livres por duração do serviço; findByDate; create; updateStatus; cancel) |
| 🔴 | 11b.2 | Criar `src/modules/wash/controllers/schedule.controller.ts` (GET /wash/schedule/availability?date=, GET /wash/schedule?date=, POST, PATCH /:id/status, DELETE /:id) |
| 🔴 | 11b.3 | Criar DTOs: `CreateScheduleDto`, `UpdateScheduleStatusDto` |
| 🔴 | 11b.4 | Implementar lógica de disponibilidade: horário de funcionamento (configável), slots ocupados, sem sobreposição |
| 🔴 | 11b.5 | Testes unitários da lógica de disponibilidade |

### 11c. Fila Presencial

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 11c.1 | Criar `src/modules/wash/services/queue.service.ts` (getCurrentQueue, addToQueue com posição auto-increment, updateStatus, complete) |
| 🔴 | 11c.2 | Criar `src/modules/wash/controllers/queue.controller.ts` (GET /wash/queue, POST, PATCH /:id/status) |
| 🔴 | 11c.3 | Criar DTOs: `AddToQueueDto`, `UpdateQueueStatusDto` |
| 🔴 | 11c.4 | Implementar endpoint SSE (`GET /wash/queue/stream`) para push de atualizações em tempo real |
| 🔴 | 11c.5 | Testes unitários |

---

## 12. Módulo Rental (Aluguel)

### 12a. Reservas

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 12a.1 | Criar `src/modules/rental/rental.module.ts` |
| 🔴 | 12a.2 | Criar `src/modules/rental/services/reservation.service.ts` (checkAvailability, create, findOne, update, cancel) |
| 🔴 | 12a.3 | Criar `src/modules/rental/services/pricing.service.ts` (calcular preço: diária × dias, desconto semanal/mensal) |
| 🔴 | 12a.4 | Criar `src/modules/rental/controllers/reservation.controller.ts` (GET /rental/availability, POST /rental/reservations, GET /:id, PATCH /:id) |
| 🔴 | 12a.5 | Criar DTOs: `CreateReservationDto` (customer_id, vehicle_id, datas, modalidade) |
| 🔴 | 12a.6 | Testes unitários: pricing.service, reservation.service |

### 12b. Contratos

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 12b.1 | Criar `src/modules/rental/services/contract.service.ts` (open: gera contrato + atualiza status veículo para ALUGADO; findAll; findOne; extend; close) |
| 🔴 | 12b.2 | Criar `src/modules/rental/services/inspection.service.ts` (createInspection: salva checklist + fotos; compareInspections: compara saída vs. chegada) |
| 🔴 | 12b.3 | Criar `src/modules/rental/controllers/contract.controller.ts` (GET /rental/contracts, POST, GET /:id, PATCH /:id/extend, POST /:id/incident, POST /:id/close) |
| 🔴 | 12b.4 | Criar DTOs: `OpenContractDto`, `CloseContractDto`, `InspectionDto`, `IncidentDto` |
| 🔴 | 12b.5 | Implementar lógica de fechamento: calcular extras (km excedente, combustível, avarias), gerar valor_total_real, atualizar status veículo para DISPONIVEL |
| 🔴 | 12b.6 | Testes unitários: contract.service (abertura, fechamento, cálculo de extras) |

---

## 13. Módulo Payments

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 13.1 | Criar `src/modules/payments/payments.module.ts` |
| 🔴 | 13.2 | Criar `src/modules/payments/services/payment.service.ts` (registerPayment: vincula a schedule/queue/contract; findByRef) |
| 🔴 | 13.3 | Criar `src/modules/payments/payments.controller.ts` (POST /payments, GET /payments?ref_type=&ref_id=) |
| 🔴 | 13.4 | Criar DTOs: `RegisterPaymentDto` (ref_type, ref_id, valor, metodo) |
| 🔴 | 13.5 | Testes unitários |

---

## 14. Módulo Documents (Templates + PDF)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 14.1 | Criar `src/modules/documents/documents.module.ts` |
| 🔴 | 14.2 | Criar `src/modules/documents/services/template.service.ts` (CRUD templates) |
| 🔴 | 14.3 | Criar `src/modules/documents/services/pdf-generator.service.ts` (renderizar HTML com variáveis interpoladas → PDF via Puppeteer) |
| 🔴 | 14.4 | Instalar `puppeteer` e configurar para headless PDF generation |
| 🔴 | 14.5 | Criar `src/modules/documents/services/d4sign.service.ts` (sendForSignature, getStatus, handleWebhook) |
| 🔴 | 14.6 | Criar `src/modules/documents/documents.controller.ts` (GET /documents/templates, POST, PATCH /:id, POST /:id/render, POST /documents/sign, GET /documents/sign/:id/status) |
| 🔴 | 14.7 | Criar endpoint webhook D4Sign: `POST /webhooks/d4sign` |
| 🔴 | 14.8 | Testes unitários: template interpolation, pdf-generator (mock puppeteer) |

---

## 15. Módulo Notifications (E-mail)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 15.1 | Instalar `@nestjs-modules/mailer`, `nodemailer`, `handlebars` |
| 🔴 | 15.2 | Criar `src/modules/notifications/notifications.module.ts` (importa MailerModule com config SMTP) |
| 🔴 | 15.3 | Criar `src/modules/notifications/services/email.service.ts` (sendBookingConfirmation, sendReservationConfirmation, sendReturnReminder, sendPasswordReset) |
| 🔴 | 15.4 | Criar templates Handlebars em `src/modules/notifications/templates/` (welcome.hbs, booking-confirmation.hbs, reservation-confirmation.hbs, return-reminder.hbs, password-reset.hbs) |
| 🔴 | 15.5 | Testes unitários: email.service (mock mailer) |

---

## 16. Jobs Assíncronos (BullMQ + Redis)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 16.1 | Instalar `@nestjs/bullmq`, `bullmq` |
| 🔴 | 16.2 | Configurar BullModule com conexão Redis do `.env` |
| 🔴 | 16.3 | Criar queue `email` + processor (envia e-mails em background) |
| 🔴 | 16.4 | Criar queue `pdf-generation` + processor (gera PDF em background) |
| 🔴 | 16.5 | Criar queue `return-reminders` + cron job (verifica D-1 diariamente e enfileira lembretes) |
| 🔴 | 16.6 | Testes unitários dos processors |

---

## 17. Módulo Reports (Fase 3 — preparação de endpoints)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 17.1 | Criar `src/modules/reports/reports.module.ts` |
| 🔴 | 17.2 | Criar `src/modules/reports/services/financial-report.service.ts` (agregação de pagamentos por período e módulo) |
| 🔴 | 17.3 | Criar `src/modules/reports/services/fleet-report.service.ts` (taxa de ocupação por período) |
| 🔴 | 17.4 | Criar `src/modules/reports/reports.controller.ts` (GET /reports/financial, GET /reports/fleet-occupation) |
| 🔴 | 17.5 | Testes unitários |

---

## 18. Swagger / Documentação da API

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 18.1 | Configurar Swagger em `main.ts` (título, versão, description, bearerAuth) |
| 🔴 | 18.2 | Adicionar decorators `@ApiTags`, `@ApiOperation`, `@ApiResponse` em todos os controllers |
| 🔴 | 18.3 | Adicionar `@ApiProperty` em todos os DTOs |
| 🔴 | 18.4 | Validar que Swagger UI (`/api/docs`) está funcional e completo |

---

## 19. Lint, Formato e CI

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 19.1 | Configurar ESLint com `@typescript-eslint` e regras NestJS recomendadas |
| 🔴 | 19.2 | Configurar Prettier |
| 🔴 | 19.3 | Adicionar scripts: `pnpm --filter api lint`, `pnpm --filter api test`, `pnpm --filter api test:e2e` |
| 🔴 | 19.4 | Validar que `pnpm --filter api build` passa sem erros |

---

## 20. Testes E2E (Supertest)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 20.1 | Configurar Jest para E2E com `test/jest-e2e.json` |
| 🔴 | 20.2 | Criar helper de setup: banco de teste isolado, seed mínimo, cleanup entre testes |
| 🔴 | 20.3 | E2E: Auth (login válido/inválido, refresh, forgot/reset) |
| 🔴 | 20.4 | E2E: Users CRUD com RBAC (operador não pode criar user) |
| 🔴 | 20.5 | E2E: Wash services CRUD |
| 🔴 | 20.6 | E2E: Schedule (criar agendamento, verificar disponibilidade, alterar status) |
| 🔴 | 20.7 | E2E: Rental (reservar → abrir contrato → vistoria → fechar) |
| 🔴 | 20.8 | E2E: Payments (registrar pagamento para wash e rental) |

