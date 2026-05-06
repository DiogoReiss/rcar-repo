-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GESTOR_GERAL', 'OPERADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DISPONIVEL', 'ALUGADO', 'MANUTENCAO', 'INATIVO');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('ECONOMICO', 'INTERMEDIARIO', 'SUV', 'EXECUTIVO', 'UTILITARIO');

-- CreateEnum
CREATE TYPE "WashScheduleStatus" AS ENUM ('AGENDADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "WashQueueStatus" AS ENUM ('AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "RentalModality" AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('RESERVADO', 'ATIVO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('SAIDA', 'CHEGADA');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('AVARIA', 'MULTA', 'KM_EXCEDENTE', 'COMBUSTIVEL', 'OUTRO');

-- CreateEnum
CREATE TYPE "PaymentRefType" AS ENUM ('WASH_SCHEDULE', 'WASH_QUEUE', 'RENTAL_CONTRACT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('CONTRATO_LOCACAO', 'RECIBO_LAVAGEM', 'RECIBO_LOCACAO');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tipo" "CustomerType" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" JSONB,
    "cnh" TEXT,
    "cnh_validade" TIMESTAMP(3),
    "cnh_url" TEXT,
    "razao_social" TEXT,
    "insc_estadual" TEXT,
    "responsavel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "categoria" "VehicleCategory" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "fotos" TEXT[],
    "km_atual" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenances" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_services" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "duracao_min" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_schedules" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "nome_avulso" TEXT,
    "telefone" TEXT,
    "service_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "status" "WashScheduleStatus" NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_queues" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "nome_avulso" TEXT,
    "service_id" TEXT NOT NULL,
    "veiculo_placa" TEXT,
    "status" "WashQueueStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "posicao" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "concluido_at" TIMESTAMP(3),

    CONSTRAINT "wash_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_contracts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "modalidade" "RentalModality" NOT NULL,
    "data_retirada" TIMESTAMP(3) NOT NULL,
    "data_devolucao" TIMESTAMP(3) NOT NULL,
    "data_dev_real" TIMESTAMP(3),
    "valor_diaria" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "valor_total_real" DECIMAL(10,2),
    "seguro" BOOLEAN NOT NULL DEFAULT false,
    "valor_seguro" DECIMAL(10,2),
    "status" "ContractStatus" NOT NULL DEFAULT 'RESERVADO',
    "km_retirada" INTEGER,
    "km_devolucao" INTEGER,
    "km_limite" INTEGER,
    "combustivel_saida" TEXT,
    "combustivel_chegada" TEXT,
    "observacoes" TEXT,
    "pdf_url" TEXT,
    "d4sign_id" TEXT,
    "d4sign_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "tipo" "InspectionType" NOT NULL,
    "checklist" JSONB NOT NULL,
    "fotos" TEXT[],
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_incidents" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "tipo" "IncidentType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fotos" TEXT[],
    "data" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "ref_type" "PaymentRefType" NOT NULL,
    "schedule_id" TEXT,
    "queue_id" TEXT,
    "contract_id" TEXT,
    "customer_id" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "metodo" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "pagarme_tx_id" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TemplateType" NOT NULL,
    "conteudo_html" TEXT NOT NULL,
    "variaveis" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidade" TEXT NOT NULL,
    "quantidade_atual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "estoque_minimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "custo_unitario" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tipo" "StockMovementType" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "motivo" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_products" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantidade_por_uso" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT,
    "detalhes" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cpf_cnpj_key" ON "customers"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_placa_key" ON "vehicles"("placa");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "wash_schedules_data_hora_status_idx" ON "wash_schedules"("data_hora", "status");

-- CreateIndex
CREATE INDEX "wash_queues_posicao_idx" ON "wash_queues"("posicao");

-- CreateIndex
CREATE INDEX "rental_contracts_status_customer_id_idx" ON "rental_contracts"("status", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_schedule_id_key" ON "payments"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_queue_id_key" ON "payments"("queue_id");

-- CreateIndex
CREATE INDEX "payments_ref_type_idx" ON "payments"("ref_type");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_products_service_id_product_id_key" ON "service_products"("service_id", "product_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_schedules" ADD CONSTRAINT "wash_schedules_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_schedules" ADD CONSTRAINT "wash_schedules_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "wash_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_queues" ADD CONSTRAINT "wash_queues_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_queues" ADD CONSTRAINT "wash_queues_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "wash_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "rental_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_incidents" ADD CONSTRAINT "contract_incidents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "rental_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "wash_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "wash_queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "rental_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "wash_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
