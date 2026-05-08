-- Finance module finalize: maintenance classification, stock movement unit cost, incident billing flag

DO $$
BEGIN
  CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'SINISTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END
$$;

DO $$
BEGIN
  CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDENTE', 'CONCLUIDA');
EXCEPTION
  WHEN duplicate_object THEN null;
END
$$;

ALTER TABLE "vehicle_maintenances"
  ADD COLUMN IF NOT EXISTS "tipo" "MaintenanceType" NOT NULL DEFAULT 'CORRETIVA',
  ADD COLUMN IF NOT EXISTS "status" "MaintenanceStatus" NOT NULL DEFAULT 'CONCLUIDA',
  ADD COLUMN IF NOT EXISTS "fornecedor" TEXT;

ALTER TABLE "stock_movements"
  ADD COLUMN IF NOT EXISTS "custo_unitario" DECIMAL(10,2);

ALTER TABLE "contract_incidents"
  ADD COLUMN IF NOT EXISTS "cobrado_cliente" BOOLEAN NOT NULL DEFAULT true;

ALTER TYPE "IncidentType" ADD VALUE IF NOT EXISTS 'SINISTRO';
ALTER TYPE "IncidentType" ADD VALUE IF NOT EXISTS 'KM_EXCEDENTE';
ALTER TYPE "IncidentType" ADD VALUE IF NOT EXISTS 'COMBUSTIVEL';

