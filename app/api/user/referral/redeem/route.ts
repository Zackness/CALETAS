import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { redeemOldestReferrerReward } from "@/lib/referral-boost";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await redeemOldestReferrerReward(session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, endsAt: result.endsAt.toISOString() });
  } catch (e) {
    console.error("POST /api/user/referral/redeem:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
