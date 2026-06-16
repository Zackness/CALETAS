import { NextResponse } from "next/server";

import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";
import { canUseIAChat, getActiveSubscriptionForUser } from "@/lib/subscription";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** GET — comprueba si el usuario de AprendePIC18 puede usar el Tutor IA (JWT + plan con chat). */
export async function GET(request: Request) {
  try {
    const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
    if (!jwtUser?.id) {
      return NextResponse.json(
        {
          authenticated: false,
          canUseTutor: false,
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
          canUseTutor: false,
          reason: "no_subscription",
        },
        { headers: CORS },
      );
    }

    const planName = sub.subscriptionType?.name ?? null;
    if (!canUseIAChat(sub)) {
      return NextResponse.json(
        {
          authenticated: true,
          canUseTutor: false,
          reason: "plan_no_chat",
          planName,
        },
        { headers: CORS },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        canUseTutor: true,
        reason: "ok",
        planName,
      },
      { headers: CORS },
    );
  } catch (error) {
    console.error("[aprende-pic18/tutor/access]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: CORS });
  }
}
