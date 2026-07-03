-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('SEMANAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "MasterAgreementStatus" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "master_agreements" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "descricao" TEXT,
    "ciclo" "BillingCycle" NOT NULL,
    "status" "MasterAgreementStatus" NOT NULL DEFAULT 'ATIVO',
    "dia_vencimento" INTEGER,
    "proximo_ciclo" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_agreement_items" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "valor_ciclo" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "vinculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desvinculado_em" TIMESTAMP(3),

    CONSTRAINT "master_agreement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "master_agreements_customer_id_status_idx" ON "master_agreements"("customer_id", "status");

-- CreateIndex
CREATE INDEX "master_agreement_items_agreement_id_ativo_idx" ON "master_agreement_items"("agreement_id", "ativo");

-- AddForeignKey
ALTER TABLE "master_agreements" ADD CONSTRAINT "master_agreements_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_agreement_items" ADD CONSTRAINT "master_agreement_items_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "master_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_agreement_items" ADD CONSTRAINT "master_agreement_items_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

