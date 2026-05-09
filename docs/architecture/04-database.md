# RCar — Arquitetura de Banco de Dados (PostgreSQL + Prisma)

## Visão Geral

- **SGBD**: PostgreSQL 16
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **Naming**: snake_case para tabelas e colunas
- **IDs**: UUID v4
- **Soft Delete**: campo `deleted_at` em entidades principais
- **Timestamps**: `created_at` e `updated_at` em todas as tabelas

---

## Diagrama de Relacionamentos (ER simplificado)

```
┌──────────┐       ┌──────────────┐       ┌──────────────────┐
│  users   │       │  customers   │       │    vehicles      │
└────┬─────┘       └──────┬───────┘       └────────┬─────────┘
     │                    │                         │
     │         ┌──────────┼──────────┐              │
     │         │          │          │              │
     │    ┌────▼────┐ ┌───▼────┐ ┌──▼──────────────▼──┐
     │    │schedules│ │ queue  │ │  rental_contracts   │
     │    └─────────┘ └────────┘ └──────────┬──────────┘
     │                                      │
     │         ┌────────────┐        ┌──────▼───────┐
     │         │  payments  │        │  inspections │
     │         └────────────┘        └──────────────┘
     │
┌────▼──────┐     ┌────────────┐     ┌──────────┐
│ templates │     │wash_services│────▶│ products │
└───────────┘     └────────────┘     └─────┬────┘
                                           │
                                    ┌──────▼──────────┐
                                    │stock_movements   │
                                    └─────────────────┘
```

---

## Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// AUTENTICAÇÃO E USUÁRIOS
// ==========================================

enum UserRole {
  GESTOR_GERAL
  OPERADOR
}

model User {
  id            String    @id @default(uuid())
  nome          String
  email         String    @unique
  senha_hash    String
  role          UserRole  @default(OPERADOR)
  ativo         Boolean   @default(true)
  last_login_at DateTime?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  deleted_at    DateTime?

  audit_logs AuditLog[]

  @@map("users")
}

// ==========================================
// CLIENTES
// ==========================================

enum CustomerType {
  PF
  PJ
}

model Customer {
  id          String       @id @default(uuid())
  tipo        CustomerType
  nome        String       // Nome ou razão social
  cpf_cnpj    String       @unique
  email       String?
  telefone    String
  endereco    Json?        // { rua, numero, complemento, bairro, cidade, uf, cep }
  
  // Campos PF
  cnh_numero    String?
  cnh_validade  DateTime?
  cnh_foto_url  String?
  
  // Campos PJ
  responsavel   String?
  
  ativo       Boolean   @default(true)
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  schedules         WashSchedule[]
  queue_entries     WashQueue[]
  rental_contracts  RentalContract[]
  payments          Payment[]

  @@map("customers")
}

// ==========================================
// FROTA
// ==========================================

enum VehicleStatus {
  DISPONIVEL
  ALUGADO
  MANUTENCAO
  RESERVADO
}

enum MaintenanceType {
  PREVENTIVA
  CORRETIVA
  SINISTRO
}

enum MaintenanceStatus {
  PENDENTE
  CONCLUIDA
}

model Vehicle {
  id         String        @id @default(uuid())
  placa      String        @unique
  modelo     String
  ano        Int
  cor        String
  categoria  String        // Ex: "Sedan", "SUV", "Hatch"
  status     VehicleStatus @default(DISPONIVEL)
  fotos      String[]      // URLs no S3
  km_atual   Int           @default(0)
  created_at DateTime      @default(now())
  updated_at DateTime      @updatedAt
  deleted_at DateTime?

  contracts    RentalContract[]
  maintenances VehicleMaintenance[]

  @@map("vehicles")
}

model VehicleMaintenance {
  id          String              @id @default(uuid())
  vehicle_id  String
  descricao   String
  custo       Decimal             @db.Decimal(10, 2)
  tipo        MaintenanceType     @default(CORRETIVA)   // PREVENTIVA | CORRETIVA | SINISTRO
  status      MaintenanceStatus   @default(CONCLUIDA)   // PENDENTE | CONCLUIDA
  fornecedor  String?                                    // Nome da oficina/mecânico
  data        DateTime
  created_at  DateTime            @default(now())

  vehicle Vehicle @relation(fields: [vehicle_id], references: [id])

  @@map("vehicle_maintenances")
}

// ==========================================
// LAVAJATO — SERVIÇOS
// ==========================================

model WashService {
  id             String   @id @default(uuid())
  nome           String
  descricao      String?
  preco          Decimal  @db.Decimal(10, 2)
  duracao_min    Int      // Duração em minutos
  ativo          Boolean  @default(true)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  schedules   WashSchedule[]
  queue_items WashQueue[]
  products    ServiceProduct[]

  @@map("wash_services")
}

// ==========================================
// LAVAJATO — ESTOQUE DE PRODUTOS
// ==========================================

enum StockMovementType {
  ENTRADA
  SAIDA
  AJUSTE
}

model Product {
  id              String   @id @default(uuid())
  nome            String
  descricao       String?
  unidade         String   // Ex: "litro", "unidade", "kg"
  quantidadeAtual Decimal  @db.Decimal(10, 3) @map("quantidade_atual")
  estoqueMinimo   Decimal  @db.Decimal(10, 3) @map("estoque_minimo")
  custoUnitario   Decimal? @db.Decimal(10, 2) @map("custo_unitario")
  ativo           Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  movements StockMovement[]
  services  ServiceProduct[]

  @@map("products")
}

model StockMovement {
  id              String            @id @default(uuid())
  product_id      String
  tipo            StockMovementType
  quantidade      Decimal           @db.Decimal(10, 3)
  custo_unitario  Decimal?          @db.Decimal(10, 2)  // Custo real desta entrada (tipo ENTRADA)
  motivo          String?
  user_id         String?           // Quem registrou
  created_at      DateTime          @default(now())

  product Product @relation(fields: [product_id], references: [id])

  @@index([product_id, created_at])
  @@map("stock_movements")
}

model ServiceProduct {
  id               String  @id @default(uuid())
  service_id       String
  product_id       String
  quantidadePorUso Decimal @db.Decimal(10, 3) @map("quantidade_por_uso")

  service WashService @relation(fields: [service_id], references: [id])
  product Product     @relation(fields: [product_id], references: [id])

  @@unique([service_id, product_id])
  @@map("service_products")
}

// ==========================================
// LAVAJATO — AGENDAMENTOS
// ==========================================

enum ScheduleStatus {
  AGENDADO
  EM_ATENDIMENTO
  CONCLUIDO
  CANCELADO
}

model WashSchedule {
  id            String         @id @default(uuid())
  customer_id   String?
  nome_avulso   String?        // Para clientes sem cadastro
  telefone_avulso String?
  service_id    String
  data_hora     DateTime
  status        ScheduleStatus @default(AGENDADO)
  observacoes   String?
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt

  customer Customer?   @relation(fields: [customer_id], references: [id])
  service  WashService @relation(fields: [service_id], references: [id])
  payment  Payment?

  @@map("wash_schedules")
}

// ==========================================
// LAVAJATO — FILA PRESENCIAL
// ==========================================

enum QueueStatus {
  AGUARDANDO
  EM_ATENDIMENTO
  CONCLUIDO
}

model WashQueue {
  id              String      @id @default(uuid())
  customer_id     String?
  nome_avulso     String?
  service_id      String
  veiculo_placa   String
  status          QueueStatus @default(AGUARDANDO)
  posicao         Int         // Posição na fila
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
  concluido_at    DateTime?

  customer Customer?   @relation(fields: [customer_id], references: [id])
  service  WashService @relation(fields: [service_id], references: [id])
  payment  Payment?

  @@map("wash_queue")
}

// ==========================================
// ALUGUEL — CONTRATOS
// ==========================================

enum ContractStatus {
  RESERVADO
  ATIVO
  CONCLUIDO
  CANCELADO
}

enum RentalModality {
  DIARIA
  SEMANAL
  MENSAL
}

model RentalContract {
  id                  String         @id @default(uuid())
  customer_id         String
  vehicle_id          String
  modalidade          RentalModality
  dt_retirada         DateTime
  dt_devolucao_prev   DateTime
  dt_devolucao_real   DateTime?
  valor_diaria        Decimal        @db.Decimal(10, 2)
  valor_total_prev    Decimal        @db.Decimal(10, 2)
  valor_total_real    Decimal?       @db.Decimal(10, 2)
  caucao              Decimal?       @db.Decimal(10, 2)
  seguro              Boolean        @default(false)
  seguro_valor        Decimal?       @db.Decimal(10, 2)
  status              ContractStatus @default(RESERVADO)
  km_saida            Int?
  km_chegada          Int?
  combustivel_saida   String?        // Ex: "1/4", "1/2", "3/4", "cheio"
  combustivel_chegada String?
  observacoes         String?
  contrato_pdf_url    String?
  d4sign_document_id  String?
  created_at          DateTime       @default(now())
  updated_at          DateTime       @updatedAt

  customer    Customer          @relation(fields: [customer_id], references: [id])
  vehicle     Vehicle           @relation(fields: [vehicle_id], references: [id])
  inspections Inspection[]
  incidents   ContractIncident[]
  payments    Payment[]

  @@map("rental_contracts")
}

// ==========================================
// ALUGUEL — VISTORIAS
// ==========================================

enum InspectionType {
  SAIDA
  CHEGADA
}

model Inspection {
  id           String         @id @default(uuid())
  contract_id  String
  tipo         InspectionType
  checklist    Json           // { item: string, ok: boolean, observacao?: string }[]
  fotos        String[]       // URLs S3
  observacoes  String?
  created_at   DateTime       @default(now())

  contract RentalContract @relation(fields: [contract_id], references: [id])

  @@map("inspections")
}

// ==========================================
// ALUGUEL — OCORRÊNCIAS
// ==========================================

enum IncidentType {
  SINISTRO
  MULTA
  AVARIA
  KM_EXCEDENTE
  COMBUSTIVEL
  OUTRO
}

model ContractIncident {
  id              String       @id @default(uuid())
  contract_id     String
  tipo            IncidentType
  descricao       String
  valor           Decimal?     @db.Decimal(10, 2)
  cobrado_cliente Boolean      @default(true)    // Se true, soma ao valorTotalReal
  fotos           String[]
  data            DateTime
  created_at      DateTime     @default(now())

  contract RentalContract @relation(fields: [contract_id], references: [id])

  @@map("contract_incidents")
}

// ==========================================
// PAGAMENTOS
// ==========================================

enum PaymentMethod {
  DINHEIRO
  PIX
  CARTAO_CREDITO
  CARTAO_DEBITO
  BOLETO
}

enum PaymentStatus {
  PENDENTE
  CONFIRMADO
  CANCELADO
}

enum PaymentRefType {
  WASH_SCHEDULE
  WASH_QUEUE
  RENTAL
}

model Payment {
  id              String         @id @default(uuid())
  ref_type        PaymentRefType
  schedule_id     String?        @unique
  queue_id        String?        @unique
  contract_id     String?
  customer_id     String?
  valor           Decimal        @db.Decimal(10, 2)
  metodo          PaymentMethod
  status          PaymentStatus  @default(PENDENTE)
  pagarme_tx_id   String?        // ID da transação no Pagar.me (quando integrado)
  observacoes     String?
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  schedule WashSchedule?  @relation(fields: [schedule_id], references: [id])
  queue    WashQueue?     @relation(fields: [queue_id], references: [id])
  contract RentalContract? @relation(fields: [contract_id], references: [id])
  customer Customer?      @relation(fields: [customer_id], references: [id])

  @@map("payments")
}

// ==========================================
// TEMPLATES DE DOCUMENTOS
// ==========================================

enum TemplateType {
  CONTRATO_LOCACAO
  RECIBO_PAGAMENTO
  TERMO_VISTORIA
  OUTRO
}

model Template {
  id            String       @id @default(uuid())
  nome          String
  tipo          TemplateType
  conteudo_html String       @db.Text
  variaveis     String[]     // Lista de variáveis aceitas: ["cliente.nome", "veiculo.placa"]
  ativo         Boolean      @default(true)
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt

  @@map("templates")
}

// ==========================================
// AUDIT LOG
// ==========================================

model AuditLog {
  id         String   @id @default(uuid())
  user_id    String
  acao       String   // Ex: "LOGIN", "CONTRATO_CRIADO", "STATUS_ALTERADO"
  entidade   String   // Ex: "rental_contracts"
  entidade_id String?
  detalhes   Json?
  ip         String?
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])

  @@map("audit_logs")
}
```

---

## Visão Financeira do Schema

> Documentação completa em [`06-financeiro.md`](./06-financeiro.md)

As entidades financeiras do sistema se dividem em **receita** e **custo**:

| Fluxo | Entidades | Campos-chave |
|-------|-----------|-------------|
| Receita Lavajato | `WashSchedule` → `Payment` | `WashService.preco`, `Payment.valor` |
| Receita Aluguel | `RentalContract` → `Payment` | `valor_diaria`, `valor_total_real`, `Payment.valor` |
| Extras Aluguel | `ContractIncident` | `valor`, `cobrado_cliente` |
| Custo Manutenção | `VehicleMaintenance` | `custo`, `tipo` |
| Custo Insumos | `StockMovement` + `Product` | `quantidade × custo_unitario` |
| Valoração Estoque | `Product` | `quantidade_atual × custo_unitario` |

### Campos adicionados para suporte financeiro

- `VehicleMaintenance.tipo` — classifica preventiva vs. corretiva
- `VehicleMaintenance.status` — permite manutenções agendadas (PENDENTE)
- `VehicleMaintenance.fornecedor` — rastreabilidade da oficina
- `StockMovement.custo_unitario` — custo real por entrada (custo médio ponderado)
- `ContractIncident.cobrado_cliente` — distingue custo absorvido vs. cobrado
- `IncidentType.KM_EXCEDENTE` e `COMBUSTIVEL` — novos tipos de incidente

---

## Índices Recomendados

```prisma
// Adicionar nos models correspondentes:

// Busca de agendamentos por data
@@index([data_hora, status])

// Busca de contratos por status e cliente
@@index([status, customer_id])

// Busca de pagamentos por referência
@@index([ref_type, contract_id])
@@index([ref_type, schedule_id])

// Fila ordenada por posição
@@index([status, posicao])

// Veículos por status
@@index([status])

// Audit log por data
@@index([created_at])
@@index([user_id, created_at])
```

---

## Seed (Dados Iniciais)

```typescript
// prisma/seed.ts
async function main() {
  // 1. Usuário gestor inicial
  await prisma.user.create({
    data: {
      nome: 'Admin RCar',
      email: 'admin@rcar.com.br',
      senha_hash: await hash('mudar123', 10),
      role: 'GESTOR_GERAL',
    }
  });

  // 2. Serviço de lavagem padrão
  await prisma.washService.create({
    data: {
      nome: 'Lavagem Simples',
      descricao: 'Lavagem externa completa com secagem',
      preco: 40.00,
      duracao_min: 30,
    }
  });

  // 3. Veículos iniciais da frota (5)
  const veiculos = [
    { placa: 'ABC-1234', modelo: 'Toyota Corolla', ano: 2023, cor: 'Prata', categoria: 'Sedan' },
    { placa: 'DEF-5678', modelo: 'Hyundai HB20', ano: 2024, cor: 'Branco', categoria: 'Hatch' },
    { placa: 'GHI-9012', modelo: 'Jeep Compass', ano: 2023, cor: 'Preto', categoria: 'SUV' },
    { placa: 'JKL-3456', modelo: 'Fiat Argo', ano: 2024, cor: 'Vermelho', categoria: 'Hatch' },
    { placa: 'MNO-7890', modelo: 'VW T-Cross', ano: 2024, cor: 'Cinza', categoria: 'SUV' },
  ];

  for (const v of veiculos) {
    await prisma.vehicle.create({ data: v });
  }

  // 4. Templates padrão (idempotente por nome + tipo)
  const templatesPadrao = [
    {
      nome: 'Contrato de Locação Padrão',
      tipo: 'CONTRATO_LOCACAO',
      variaveis: ['nomeCliente', 'cpfCnpj', 'emailCliente', 'telefoneCliente', 'veiculo', 'placa', 'categoria', 'dataRetirada', 'dataDevolucao', 'valorDiaria', 'valorTotal'],
    },
    {
      nome: 'Recibo de Locação',
      tipo: 'RECIBO_LOCACAO',
      variaveis: ['nomeCliente', 'cpfCnpj', 'veiculo', 'placa', 'valor', 'formaPagamento', 'data'],
    },
    {
      nome: 'Recibo de Lavagem',
      tipo: 'RECIBO_LAVAGEM',
      variaveis: ['nomeCliente', 'telefoneCliente', 'servico', 'placa', 'data', 'valor'],
    },
  ];

  for (const tpl of templatesPadrao) {
    const existente = await prisma.template.findFirst({ where: { nome: tpl.nome, tipo: tpl.tipo } });
    if (existente) {
      await prisma.template.update({ where: { id: existente.id }, data: { variaveis: tpl.variaveis, ativo: true } });
    } else {
      await prisma.template.create({ data: { ...tpl, conteudo_html: '<h1>...</h1>' } });
    }
  }

  // 5. Produtos de estoque do lavajato
  const produtos = [
    { nome: 'Shampoo Automotivo', unidade: 'litro', quantidadeAtual: 20, estoqueMinimo: 5, custoUnitario: 25.00 },
    { nome: 'Cera Líquida', unidade: 'litro', quantidadeAtual: 10, estoqueMinimo: 3, custoUnitario: 45.00 },
    { nome: 'Pano Microfibra', unidade: 'unidade', quantidadeAtual: 50, estoqueMinimo: 10, custoUnitario: 8.00 },
    { nome: 'Pretinho para Pneu', unidade: 'litro', quantidadeAtual: 8, estoqueMinimo: 2, custoUnitario: 18.00 },
    { nome: 'Limpa Vidros', unidade: 'litro', quantidadeAtual: 12, estoqueMinimo: 3, custoUnitario: 15.00 },
  ];

  for (const p of produtos) {
    await prisma.product.create({ data: p });
  }
}
```

---

## Backup e Manutenção

- **Backup**: pg_dump diário automatizado (cron ou serviço gerenciado)
- **Connection Pool**: Prisma com `connection_limit` configurável via `DATABASE_URL`
- **Migrations**: Sempre criar via `pnpm prisma:migrate` — nunca alterar banco manualmente
- **Rollback**: Prisma Migrate suporta `prisma migrate resolve` para marcar migrations como aplicadas/revertidas

