-- CreateEnum
CREATE TYPE "NotificationPreference" AS ENUM ('EMAIL', 'WHATSAPP');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "canal_preferido" "NotificationPreference" NOT NULL DEFAULT 'EMAIL';

