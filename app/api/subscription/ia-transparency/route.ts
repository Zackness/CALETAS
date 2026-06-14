import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  IA_GATEWAY_MODELS_DOC,
  IA_GATEWAY_PRICING_DOC,
  IA_PRICING_RATIONALE_ES,
  RECOMMENDED_GENERAL_REFERENCE_VS_STUDENT_MULTIPLIER,
  RECOMMENDED_PLATFORM_MARGIN,
  RECOMMENDED_PUBLIC_TOP_UPS_USD,
  RECOMMENDED_STUDENT_DISCOUNT_FROM_GENERAL_PERCENT,
  RECOMMENDED_STUDENT_TOP_UPS_USD,
} from "@/lib/ia-pricing-ladder";
import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let catalog: Awaited<ReturnType<typeof db.iaFeatureCatalog.findMany>> = [];
    /** Payload parcial (select); no usar como modelo Prisma completo. */
    let plans: unknown[] = [];
    try {
      [catalog, plans] = await Promise.all([
        db.iaFeatureCatalog.findMany({ orderBy: { sortOrder: "asc" } }),
        db.subscriptionType.findMany({
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            period: true,
            billingKind: true,
            minWalletTopUpCents: true,
            includedIaTokensPerPeriod: true,
            iaTokenOverflowPolicy: true,
            iaAccessRules: {
              select: {
                accessKind: true,
                notesEs: true,
                catalog: {
                  select: {
                    featureKey: true,
                    displayNameEs: true,
                    freeInTrial: true,
                    meteredAfterTrial: true,
                    vercelPricingUrl: true,
                    listInputUsdPer1M: true,
                    listOutputUsdPer1M: true,
                  },
                },
              },
            },
          },
        }),
      ]);
    } catch (e) {
      console.warn("[ia-transparency] Tablas aún no migradas o error de lectura:", e);
    }

    const gatewayCatalog = await getCachedGatewayCatalog();

    return NextResponse.json({
      gatewayDocs: {
        pricing: IA_GATEWAY_PRICING_DOC,
        models: IA_GATEWAY_MODELS_DOC,
      },
      policy: {
        platformMarginOnList: RECOMMENDED_PLATFORM_MARGIN,
        studentDiscountFromGeneralPercent: RECOMMENDED_STUDENT_DISCOUNT_FROM_GENERAL_PERCENT,
        generalReferenceVsStudentMultiplier: RECOMMENDED_GENERAL_REFERENCE_VS_STUDENT_MULTIPLIER,
        recommendedStudentTopUpsUsd: [...RECOMMENDED_STUDENT_TOP_UPS_USD],
        recommendedPublicTopUpsUsd: [...RECOMMENDED_PUBLIC_TOP_UPS_USD],
        rationaleEs: IA_PRICING_RATIONALE_ES,
      },
      gatewayModelPrices: [...gatewayCatalog.priceRows],
      catalog,
      plans,
    });
  } catch (e) {
    console.error("GET /api/subscription/ia-transparency:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
