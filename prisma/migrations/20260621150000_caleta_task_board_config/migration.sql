-- Columnas personalizables del tablero + status como texto (soporta col_*)
ALTER TABLE "CaletaTask" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CaletaTask" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "CaletaTask" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';

DROP TYPE IF EXISTS "CaletaTaskStatus";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "caletaTaskBoardColumns" JSONB;
