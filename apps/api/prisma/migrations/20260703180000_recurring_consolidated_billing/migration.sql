-- AlterEnum
ALTER TYPE "PaymentRefType" ADD VALUE 'MASTER_AGREEMENT';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "ciclo_referencia" TIMESTAMP(3),
ADD COLUMN     "master_agreement_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_master_agreement_id_ciclo_referencia_key" ON "payments"("master_agreement_id", "ciclo_referencia");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_master_agreement_id_fkey" FOREIGN KEY ("master_agreement_id") REFERENCES "master_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

