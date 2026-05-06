# RCar — Arquitetura Backend (NestJS)

## Stack

| Tecnologia       | Detalhes                                    |
|------------------|---------------------------------------------|
| Framework        | NestJS 11+                                  |
| Linguagem        | TypeScript (strict mode)                    |
| ORM              | Prisma                                      |
| Banco de Dados   | PostgreSQL 16                               |
| Autenticação     | JWT (access + refresh token)                |
| Validação        | class-validator + class-transformer         |
| Documentação API | Swagger (@nestjs/swagger)                   |
| Upload/Storage   | AWS S3 (ou MinIO local para dev)            |
| Pagamento        | Pagar.me SDK                                |
| Assinatura Digital| D4Sign API                                 |
| PDF              | Puppeteer / @react-pdf (renderiza HTML→PDF) |
| Fila/Jobs        | BullMQ + Redis                              |
| E-mail           | @nestjs-modules/mailer (Nodemailer + SES)   |
| Testes           | Jest + Supertest                            |
| Linter           | ESLint + Prettier                           |

---

## Estrutura de Pastas

```
apps/
└── api/
    └── src/
        ├── main.ts
        ├── app.module.ts
        │
        ├── config/
        │   ├── app.config.ts              # ConfigModule com validação de envs
        │   ├── database.config.ts
        │   ├── jwt.config.ts
        │   ├── storage.config.ts
        │   └── payment.config.ts
        │
        ├── common/
        │   ├── decorators/
        │   │   ├── roles.decorator.ts     # @Roles('gestor_geral')
        │   │   └── current-user.decorator.ts
        │   ├── guards/
        │   │   ├── jwt-auth.guard.ts
        │   │   └── roles.guard.ts
        │   ├── interceptors/
        │   │   ├── transform.interceptor.ts  # Padroniza resposta { data, meta }
        │   │   └── logging.interceptor.ts
        │   ├── filters/
        │   │   └── http-exception.filter.ts
        │   ├── pipes/
        │   │   └── parse-uuid.pipe.ts
        │   └── dto/
        │       ├── pagination.dto.ts
        │       └── api-response.dto.ts
        │
        ├── modules/
        │   ├── auth/
        │   │   ├── auth.module.ts
        │   │   ├── auth.controller.ts
        │   │   ├── auth.service.ts
        │   │   ├── strategies/
        │   │   │   ├── jwt.strategy.ts
        │   │   │   └── refresh-jwt.strategy.ts
        │   │   └── dto/
        │   │       ├── login.dto.ts
        │   │       └── token-response.dto.ts
        │   │
        │   ├── users/
        │   │   ├── users.module.ts
        │   │   ├── users.controller.ts
        │   │   ├── users.service.ts
        │   │   └── dto/
        │   │       ├── create-user.dto.ts
        │   │       └── update-user.dto.ts
        │   │
        │   ├── customers/
        │   │   ├── customers.module.ts
        │   │   ├── customers.controller.ts
        │   │   ├── customers.service.ts
        │   │   └── dto/
        │   │       ├── create-customer.dto.ts
        │   │       └── update-customer.dto.ts
        │   │
        │   ├── fleet/
        │   │   ├── fleet.module.ts
        │   │   ├── fleet.controller.ts
        │   │   ├── fleet.service.ts
        │   │   └── dto/
        │   │       ├── create-vehicle.dto.ts
        │   │       └── update-vehicle.dto.ts
        │   │
        │   ├── wash/
        │   │   ├── wash.module.ts
        │   │   ├── controllers/
        │   │   │   ├── services-catalog.controller.ts   # CRUD de serviços
        │   │   │   ├── schedule.controller.ts           # Agendamentos
        │   │   │   └── queue.controller.ts              # Fila presencial
        │   │   ├── services/
        │   │   │   ├── services-catalog.service.ts
        │   │   │   ├── schedule.service.ts
        │   │   │   └── queue.service.ts
        │   │   └── dto/
        │   │       ├── create-service.dto.ts
        │   │       ├── create-schedule.dto.ts
        │   │       └── update-queue-status.dto.ts
        │   │
        │   ├── inventory/
        │   │   ├── inventory.module.ts
        │   │   ├── controllers/
        │   │   │   ├── products.controller.ts           # CRUD de produtos
        │   │   │   └── stock-movements.controller.ts    # Entradas/saídas de estoque
        │   │   ├── services/
        │   │   │   ├── products.service.ts
        │   │   │   └── stock-movements.service.ts
        │   │   └── dto/
        │   │       ├── create-product.dto.ts
        │   │       ├── update-product.dto.ts
        │   │       └── create-stock-movement.dto.ts
        │   │
        │   ├── rental/
        │   │   ├── rental.module.ts
        │   │   ├── controllers/
        │   │   │   ├── reservation.controller.ts
        │   │   │   ├── contract.controller.ts
        │   │   │   └── return.controller.ts
        │   │   ├── services/
        │   │   │   ├── reservation.service.ts
        │   │   │   ├── contract.service.ts
        │   │   │   ├── inspection.service.ts
        │   │   │   └── pricing.service.ts
        │   │   └── dto/
        │   │       ├── create-reservation.dto.ts
        │   │       ├── open-contract.dto.ts
        │   │       ├── close-contract.dto.ts
        │   │       └── inspection.dto.ts
        │   │
        │   ├── documents/
        │   │   ├── documents.module.ts
        │   │   ├── documents.controller.ts
        │   │   ├── services/
        │   │   │   ├── template.service.ts
        │   │   │   ├── pdf-generator.service.ts
        │   │   │   └── d4sign.service.ts            # Integração D4Sign
        │   │   └── dto/
        │   │       ├── create-template.dto.ts
        │   │       └── render-template.dto.ts
        │   │
        │   ├── payments/
        │   │   ├── payments.module.ts
        │   │   ├── payments.controller.ts
        │   │   ├── services/
        │   │   │   ├── payment.service.ts
        │   │   │   └── pagarme.service.ts           # Integração Pagar.me
        │   │   └── dto/
        │   │       └── register-payment.dto.ts
        │   │
        │   ├── reports/
        │   │   ├── reports.module.ts
        │   │   ├── reports.controller.ts
        │   │   └── services/
        │   │       ├── financial-report.service.ts
        │   │       └── fleet-report.service.ts
        │   │
        │   └── notifications/
        │       ├── notifications.module.ts
        │       ├── services/
        │       │   ├── email.service.ts
        │       │   └── notification-queue.service.ts
        │       └── templates/                       # Templates de e-mail (handlebars)
        │           ├── welcome.hbs
        │           ├── booking-confirmation.hbs
        │           └── return-reminder.hbs
        │
        └── prisma/
            ├── schema.prisma
            ├── migrations/
            └── seed.ts
```

---

## API Endpoints

### Auth

```
POST   /api/auth/login              # Login → { accessToken, refreshToken }
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/forgot-password    # Envia e-mail de recuperação
POST   /api/auth/reset-password     # Reseta senha com token
```

### Users (Admin)

```
GET    /api/users                   # Lista usuários (paginado)
POST   /api/users                   # Cria usuário
GET    /api/users/:id               # Detalhe
PATCH  /api/users/:id               # Atualiza
DELETE /api/users/:id               # Desativa (soft delete)
```

### Customers

```
GET    /api/customers               # Lista (filtro: tipo PF/PJ, busca)
POST   /api/customers               # Cria
GET    /api/customers/:id           # Detalhe + histórico
PATCH  /api/customers/:id           # Atualiza
```

### Fleet

```
GET    /api/fleet                   # Lista veículos (filtro: status, categoria)
POST   /api/fleet                   # Cadastra veículo
GET    /api/fleet/:id               # Detalhe + histórico
PATCH  /api/fleet/:id               # Atualiza
GET    /api/fleet/available         # Disponíveis para aluguel (filtro: datas)
```

### Wash — Catálogo de Serviços

```
GET    /api/wash/services           # Lista serviços ativos
POST   /api/wash/services           # Cria serviço
PATCH  /api/wash/services/:id       # Atualiza (inclui ativar/desativar)
```

### Inventory — Produtos (Estoque Lavajato)

```
GET    /api/inventory/products              # Lista produtos (filtro: ativo, estoque baixo)
POST   /api/inventory/products              # Cria produto
GET    /api/inventory/products/:id          # Detalhe com histórico de movimentações
PATCH  /api/inventory/products/:id          # Atualiza
DELETE /api/inventory/products/:id          # Desativa (soft delete)
GET    /api/inventory/products/low-stock    # Produtos com estoque abaixo do mínimo
POST   /api/inventory/movements             # Registra movimentação (entrada/saída/ajuste)
GET    /api/inventory/movements?productId=  # Histórico de movimentações
```

### Wash — Agendamentos

```
GET    /api/wash/schedule/availability?date=YYYY-MM-DD   # Horários disponíveis
GET    /api/wash/schedule?date=YYYY-MM-DD                # Agendamentos do dia
POST   /api/wash/schedule                                # Cria agendamento
PATCH  /api/wash/schedule/:id/status                     # Atualiza status
DELETE /api/wash/schedule/:id                             # Cancela
```

### Wash — Fila Presencial

```
GET    /api/wash/queue              # Fila atual
POST   /api/wash/queue              # Adiciona à fila
PATCH  /api/wash/queue/:id/status   # Muda status (aguardando → atendimento → concluído)
```

### Rental — Reservas

```
GET    /api/rental/availability     # Veículos disponíveis para período
POST   /api/rental/reservations     # Cria reserva
GET    /api/rental/reservations/:id # Detalhe
PATCH  /api/rental/reservations/:id # Atualiza/cancela
```

### Rental — Contratos

```
GET    /api/rental/contracts                 # Lista (filtro: status, cliente)
POST   /api/rental/contracts                 # Abre contrato (vincula reserva + veículo)
GET    /api/rental/contracts/:id             # Detalhe
PATCH  /api/rental/contracts/:id/extend      # Extensão de prazo
POST   /api/rental/contracts/:id/incident    # Registra ocorrência
POST   /api/rental/contracts/:id/close       # Fecha/devolve
```

### Documents

```
GET    /api/documents/templates              # Lista templates
POST   /api/documents/templates              # Cria template
PATCH  /api/documents/templates/:id          # Atualiza
POST   /api/documents/templates/:id/render   # Gera PDF (body: dados de preenchimento)
POST   /api/documents/sign                   # Envia para D4Sign
GET    /api/documents/sign/:id/status        # Status da assinatura
```

### Payments

```
POST   /api/payments                # Registra pagamento
GET    /api/payments?ref_type=wash|rental&ref_id=uuid  # Pagamentos de uma referência
```

### Reports

```
GET    /api/reports/financial?from=&to=&module=     # Relatório financeiro
GET    /api/reports/fleet-occupation?from=&to=      # Taxa de ocupação
```

---

## Autenticação e Autorização

### Fluxo JWT

```
1. Login → valida credenciais → gera accessToken (15min) + refreshToken (7d)
2. Requests → header Authorization: Bearer <accessToken>
3. Token expirado → frontend chama /auth/refresh com refreshToken
4. Refresh expirado → redireciona para login
```

### Role-Based Access Control (RBAC)

```typescript
// Decorator
@Roles('gestor_geral')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class UsersController { ... }

// Guard verifica: request.user.role inclui a role exigida?
```

---

## Padrões de Código

### DTOs com Validação

```typescript
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Lavagem Simples' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 40.0 })
  @IsNumber()
  @Min(0)
  preco: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(5)
  duracaoMinutos: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}
```

### Resposta Padronizada

```typescript
// Todas as respostas seguem:
{
  "data": T | T[],
  "meta": {
    "total": number,
    "page": number,
    "perPage": number,
    "lastPage": number
  }
}
```

### Error Handling

```typescript
// HttpExceptionFilter padroniza erros:
{
  "statusCode": 404,
  "message": "Veículo não encontrado",
  "error": "Not Found",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

---

## Integrações

### Pagar.me (Fase 2)

```typescript
@Injectable()
export class PagarmeService {
  // Criar transação Pix
  async createPixCharge(amount: number, customer: CustomerData): Promise<PagarmeTransaction>;
  
  // Webhook para confirmar pagamento
  async handleWebhook(payload: PagarmeWebhookPayload): Promise<void>;
}
```

### D4Sign (Fase 1)

```typescript
@Injectable()
export class D4SignService {
  // Envia documento para assinatura
  async sendForSignature(pdfBuffer: Buffer, signers: Signer[]): Promise<D4SignDocument>;
  
  // Consulta status
  async getStatus(documentId: string): Promise<SignatureStatus>;
  
  // Webhook de conclusão
  async handleWebhook(payload: D4SignWebhook): Promise<void>;
}
```

---

## Jobs Assíncronos (BullMQ)

| Queue                   | Job                        | Trigger                              |
|-------------------------|----------------------------|--------------------------------------|
| `email`                 | Enviar e-mail              | Agendamento, reserva, lembrete       |
| `pdf-generation`        | Gerar PDF de contrato      | Abertura de contrato                 |
| `return-reminders`      | Lembrete de devolução      | Cron: verifica D-1 diariamente       |
| `signature-status`      | Polling status D4Sign      | Após envio para assinatura           |

---

## Variáveis de Ambiente

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rcar

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Storage (S3)
AWS_REGION=sa-east-1
AWS_BUCKET=rcar-documents
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Pagar.me
PAGARME_API_KEY=

# D4Sign
D4SIGN_TOKEN_API=
D4SIGN_CRYPT_KEY=
D4SIGN_SAFE_ID=

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@rcar.com.br
```

---

## Comandos

```bash
# Desenvolvimento
pnpm start:dev          # NestJS com watch mode
pnpm prisma:migrate     # Rodar migrations
pnpm prisma:seed        # Popular banco com dados iniciais
pnpm prisma:studio      # Interface visual do banco

# Testes
pnpm test               # Jest unit tests
pnpm test:e2e           # Supertest integration tests

# Build
pnpm build              # Compila para dist/
pnpm start:prod         # Roda build de produção
```

