-- Preferir: `npx prisma migrate dev` cuando la BD esté accesible.
-- Columnas opcionales: modelo IA elegido por el usuario (null = default del servidor).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaModelChat" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaModelHeavy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iaModelCronograma" TEXT;
