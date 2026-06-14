-- AlterTable: cupo de tokens IA por plan (idempotente si ya está en baseline)
ALTER TABLE "SubscriptionType" ADD COLUMN IF NOT EXISTS "includedIaTokensPerPeriod" INTEGER;
ALTER TABLE "SubscriptionType" ADD COLUMN IF NOT EXISTS "iaTokenOverflowPolicy" TEXT NOT NULL DEFAULT 'wallet';

ALTER TABLE "UserSubscription" ADD COLUMN IF NOT EXISTS "iaIncludedTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserSubscription" ADD COLUMN IF NOT EXISTS "iaMeterPeriodEnd" TIMESTAMP(3);
