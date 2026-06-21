CREATE TABLE IF NOT EXISTS "LikeRecurso" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "recursoId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LikeRecurso_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LikeRecurso_usuarioId_recursoId_key" ON "LikeRecurso"("usuarioId", "recursoId");
CREATE INDEX IF NOT EXISTS "LikeRecurso_usuarioId_idx" ON "LikeRecurso"("usuarioId");
CREATE INDEX IF NOT EXISTS "LikeRecurso_recursoId_idx" ON "LikeRecurso"("recursoId");

ALTER TABLE "LikeRecurso"
ADD CONSTRAINT "LikeRecurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LikeRecurso"
ADD CONSTRAINT "LikeRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
