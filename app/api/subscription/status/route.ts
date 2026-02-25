import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

function withCors(res: NextResponse, req: Request) {
  const cors = getCorsHeaders(req);
  Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(
        NextResponse.json({ error: "No autorizado" }, { status: 401 }),
        request,
      );
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);

    return withCors(NextResponse.json({
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
    }), request);
  } catch (error) {
    console.error("Error reading subscription status:", error);
    return withCors(
      NextResponse.json({ error: "Error interno" }, { status: 500 }),
      request,
    );
  }
}

