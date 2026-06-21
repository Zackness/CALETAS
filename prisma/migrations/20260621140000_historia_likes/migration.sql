CREATE TABLE IF NOT EXISTS "HistoriaLike" (
  "id" TEXT NOT NULL,
  "historiaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HistoriaLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HistoriaLike_historiaId_userId_key" ON "HistoriaLike"("historiaId", "userId");
CREATE INDEX IF NOT EXISTS "HistoriaLike_historiaId_idx" ON "HistoriaLike"("historiaId");
CREATE INDEX IF NOT EXISTS "HistoriaLike_userId_idx" ON "HistoriaLike"("userId");

ALTER TABLE "HistoriaLike"
ADD CONSTRAINT "HistoriaLike_historiaId_fkey" FOREIGN KEY ("historiaId") REFERENCES "Historia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HistoriaLike"
ADD CONSTRAINT "HistoriaLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
