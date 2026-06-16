import { NextResponse } from "next/server";

import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** GET — suscripcion activa en CALETAS para descargar codigo fuente de AprendePIC18. */
export async function GET(request: Request) {
  try {
    const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
    if (!jwtUser?.id) {
      return NextResponse.json(
        {
          authenticated: false,
          canDownload: false,
          reason: "login_required",
        },
        { headers: CORS },
      );
    }

    const sub = await getActiveSubscriptionForUser(jwtUser.id);
    if (!sub) {
      return NextResponse.json(
        {
          authenticated: true,
          canDownload: false,
          reason: "no_subscription",
          planName: null,
        },
        { headers: CORS },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        canDownload: true,
        reason: "ok",
        planName: sub.subscriptionType?.name ?? null,
      },
      { headers: CORS },
    );
  } catch (error) {
    console.error("[aprende-pic18/downloads/access]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: CORS });
  }
}
