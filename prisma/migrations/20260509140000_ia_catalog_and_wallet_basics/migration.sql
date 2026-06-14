-- Planes: modo de facturación y recarga mínima (CALETA BASICS = billetera).
ALTER TABLE "SubscriptionType" ADD COLUMN IF NOT EXISTS "billingKind" TEXT NOT NULL DEFAULT 'stripe_recurring';
ALTER TABLE "SubscriptionType" ADD COLUMN IF NOT EXISTS "minWalletTopUpCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "IaFeatureCatalog" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "displayNameEs" TEXT NOT NULL,
    "descriptionEs" TEXT,
    "vercelPricingUrl" TEXT NOT NULL,
    "listInputUsdPer1M" DOUBLE PRECISION,
    "listOutputUsdPer1M" DOUBLE PRECISION,
    "referenceModelIds" TEXT,
    "freeInTrial" BOOLEAN NOT NULL DEFAULT false,
    "meteredAfterTrial" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "IaFeatureCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IaFeatureCatalog_featureKey_key" ON "IaFeatureCatalog"("featureKey");

CREATE TABLE IF NOT EXISTS "SubscriptionTypeIaAccess" (
    "id" TEXT NOT NULL,
    "subscriptionTypeId" TEXT NOT NULL,
    "iaFeatureCatalogId" TEXT NOT NULL,
    "accessKind" TEXT NOT NULL DEFAULT 'consumption',
    "notesEs" TEXT,
    CONSTRAINT "SubscriptionTypeIaAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionTypeIaAccess_subscriptionTypeId_iaFeatureCatalogId_key" ON "SubscriptionTypeIaAccess"("subscriptionTypeId", "iaFeatureCatalogId");
CREATE INDEX IF NOT EXISTS "SubscriptionTypeIaAccess_subscriptionTypeId_idx" ON "SubscriptionTypeIaAccess"("subscriptionTypeId");

DO $$ BEGIN
 ALTER TABLE "SubscriptionTypeIaAccess" ADD CONSTRAINT "SubscriptionTypeIaAccess_subscriptionTypeId_fkey" FOREIGN KEY ("subscriptionTypeId") REFERENCES "SubscriptionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "SubscriptionTypeIaAccess" ADD CONSTRAINT "SubscriptionTypeIaAccess_iaFeatureCatalogId_fkey" FOREIGN KEY ("iaFeatureCatalogId") REFERENCES "IaFeatureCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
