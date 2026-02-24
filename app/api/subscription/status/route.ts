import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);

    return NextResponse.json({
      isActive: !!sub,
      subscription: sub
        ? {
            subscriptionType: sub.subscriptionType
              ? {
                  id: sub.subscriptionType.id,
                  name: sub.subscriptionType.name,
                  price: sub.subscriptionType.price,
                  period: sub.subscriptionType.period,
                }
              : null,
            currentPeriodEnd: sub.stripeCurrentPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    console.error("Error reading subscription status:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

