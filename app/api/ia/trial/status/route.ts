import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getAiTrialStatusForUser } from "@/lib/ai-trial";
import { getUserWalletSnapshot } from "@/lib/ia-wallet";
import { getSubscriptionIaTokenSummary } from "@/lib/ia-subscription-meter";
import { countPendingReferrerRewards, getActiveReferralBoostForUser } from "@/lib/referral-boost";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);
    const hasSubscription = !!sub;
    const wallet = await getUserWalletSnapshot(session.user.id);
    const referralDay = await getActiveReferralBoostForUser(session.user.id);
    /** Prueba gratuita solo sin suscripción, sin saldo en billetera y sin día IA por referidos. */
    const trialEligible =
      !hasSubscription && wallet.balanceCents <= 0 && !referralDay;

    const status = await getAiTrialStatusForUser(session.user.id);
    const pendingReferrerRewards = await countPendingReferrerRewards(session.user.id);
    const subscriptionIaTokens = await getSubscriptionIaTokenSummary(session.user.id);
    return NextResponse.json({
      hasSubscription,
      trialEligible,
      /** @deprecated Usar trialEligible; se mantiene por compat. */
      isTrial: trialEligible,
      status,
      referralDay: referralDay
        ? { active: true, endsAt: referralDay.endsAt?.toISOString() ?? null }
        : { active: false, endsAt: null },
      pendingReferrerRewards,
      wallet: {
        balanceCents: wallet.balanceCents,
        discountPercent: wallet.discountPercent,
      },
      subscriptionIaTokens,
    });
  } catch (e) {
    console.error("Error in /api/ia/trial/status:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

