-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unidade_id" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "unidade_id" TEXT;

-- AlterTable
ALTER TABLE "wash_schedules" ADD COLUMN     "unidade_id" TEXT;

-- AlterTable
ALTER TABLE "wash_queues" ADD COLUMN     "unidade_id" TEXT;

-- AlterTable
ALTER TABLE "rental_contracts" ADD COLUMN     "unidade_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "unidade_id" TEXT;

-- CreateTable
CREATE TABLE "operational_units" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "operational_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operational_units_codigo_key" ON "operational_units"("codigo");

-- CreateIndex
CREATE INDEX "users_unidade_id_idx" ON "users"("unidade_id");

-- CreateIndex
CREATE INDEX "vehicles_unidade_id_idx" ON "vehicles"("unidade_id");

-- CreateIndex
CREATE INDEX "wash_schedules_unidade_id_idx" ON "wash_schedules"("unidade_id");

-- CreateIndex
CREATE INDEX "wash_queues_unidade_id_idx" ON "wash_queues"("unidade_id");

-- CreateIndex
CREATE INDEX "rental_contracts_unidade_id_idx" ON "rental_contracts"("unidade_id");

-- CreateIndex
CREATE INDEX "payments_unidade_id_idx" ON "payments"("unidade_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_schedules" ADD CONSTRAINT "wash_schedules_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_queues" ADD CONSTRAINT "wash_queues_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

