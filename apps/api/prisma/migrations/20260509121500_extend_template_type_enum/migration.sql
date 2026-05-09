-- Extend template type enum with additional document categories used by web/admin template builder
ALTER TYPE "TemplateType" ADD VALUE IF NOT EXISTS 'VISTORIA';
ALTER TYPE "TemplateType" ADD VALUE IF NOT EXISTS 'TERMO_RESPONSABILIDADE';

