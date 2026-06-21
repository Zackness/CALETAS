CREATE TABLE IF NOT EXISTS "ia_free_tier_daily" (
    "user_id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "requests_used" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ia_free_tier_daily_pkey" PRIMARY KEY ("user_id","period_key")
);

CREATE INDEX IF NOT EXISTS "ia_free_tier_daily_period_key_idx" ON "ia_free_tier_daily"("period_key");

ALTER TABLE "ia_free_tier_daily" ADD CONSTRAINT "ia_free_tier_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
