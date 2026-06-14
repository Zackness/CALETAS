-- Modo de selección de modelo: manual (elige modelo) vs auto (heurística + cuenta).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaLlmModeChat" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaLlmModeHeavy" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaLlmModeCronograma" TEXT NOT NULL DEFAULT 'manual';
