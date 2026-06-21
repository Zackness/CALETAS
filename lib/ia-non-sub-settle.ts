import { assertTrialReferralOrWalletForIa } from "@/lib/ai-trial";
import { recordFreeTierUsage } from "@/lib/ia-free-tier";
import { computeWalletChargeFromTokenUsage } from "@/lib/ia-usage-pricing";
import { debitWalletForIa, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";

type NonSubAccess = Extract<
  Awaited<ReturnType<typeof assertTrialReferralOrWalletForIa>>,
  { ok: true }
>;

export async function settleNonSubscriptionIaAfterCall(params: {
  userId: string;
  endpoint: IaWalletBillableEndpoint;
  model: string;
  nonSubAccess: NonSubAccess | null;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  fallbackTokens?: number;
}): Promise<void> {
  const access = params.nonSubAccess;
  if (!access?.ok) return;

  if (access.mode === "free_tier") {
    await recordFreeTierUsage({ userId: params.userId, usage: params.usage, fallbackTokens: params.fallbackTokens });
    return;
  }

  if (access.mode === "wallet") {
    const chargeCents = computeWalletChargeFromTokenUsage({
      model: params.model,
      usage: params.usage,
      discountPercent: access.walletDiscountPercent ?? 0,
    });
    try {
      await debitWalletForIa({
        userId: params.userId,
        chargeCents,
        reason: params.endpoint,
        meta: { model: params.model, usage: params.usage },
      });
    } catch (e) {
      console.error(`[${params.endpoint}] wallet debit`, e);
    }
  }
}
