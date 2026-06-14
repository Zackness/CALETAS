import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  countPendingReferrerRewards,
  ensureClientReferralCode,
  getActiveReferralBoostForUser,
} from "@/lib/referral-boost";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    await ensureClientReferralCode(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        role: true,
        referredByUserId: true,
        referredBy: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const active = await getActiveReferralBoostForUser(userId);
    const pending = await countPendingReferrerRewards(userId);

    return NextResponse.json({
      role: user.role,
      referralCode: user.role === "CLIENT" || user.role === "ADMIN" ? user.referralCode : null,
      referredByName: user.referredByUserId ? user.referredBy?.name ?? null : null,
      referralDayActive: !!active,
      referralDayEndsAt: active?.endsAt?.toISOString() ?? null,
      pendingReferrerRewards: user.role === "CLIENT" ? pending : 0,
    });
  } catch (e) {
    console.error("GET /api/user/referral:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
