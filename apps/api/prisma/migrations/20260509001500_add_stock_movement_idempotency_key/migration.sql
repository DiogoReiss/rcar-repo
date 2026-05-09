-- Add idempotency support column for stock movements used by inventory/report queries
ALTER TABLE "stock_movements"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "stock_movements_idempotency_key_key"
  ON "stock_movements"("idempotency_key");

