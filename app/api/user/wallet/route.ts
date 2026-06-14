import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  estimateWalletHoldCents,
  IA_PLATFORM_MARGIN,
  listBillableIaEndpoints,
} from "@/lib/ia-usage-pricing";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import type { IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { resolveUserOrDefaultModelForEndpoint } from "@/lib/ia-user-model";

export async function GET(request: NextRequest) {
  return withIaGatewayRatesForRequest(async () => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalanceCents: true, iaConsumptionDiscountPercent: true },
    });

    const discountPercent = u?.iaConsumptionDiscountPercent ?? 0;
    const endpoints = listBillableIaEndpoints();
    const holdByEndpoint = Object.fromEntries(
      await Promise.all(
        endpoints.map(async (ep) => {
          const model = await resolveUserOrDefaultModelForEndpoint(session.user.id, ep);
          return [ep, estimateWalletHoldCents(ep, discountPercent, model)] as const;
        }),
      ),
    ) as Record<IaWalletBillableEndpoint, number>;

    const modelByEndpoint = Object.fromEntries(
      await Promise.all(
        endpoints.map(async (ep) => {
          const model = await resolveUserOrDefaultModelForEndpoint(session.user.id, ep);
          return [ep, model] as const;
        }),
      ),
    ) as Record<IaWalletBillableEndpoint, string>;

    const ledger = await db.walletLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        deltaCents: true,
        balanceAfterCents: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      balanceCents: u?.walletBalanceCents ?? 0,
      discountPercent,
      /** Saldo mínimo requerido antes de cada tipo de llamada (peor caso estimado). */
      holdByEndpoint,
      modelByEndpoint,
      platformMarginOnListPrice: IA_PLATFORM_MARGIN,
      billingNote:
        "El cobro real por billetera es según tokens usados (precio listo del proveedor vía Vercel AI Gateway) más margen de la plataforma; el hold es una reserva conservadora.",
      ledger,
    });
  } catch (e) {
    console.error("GET /api/user/wallet:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  });
}
