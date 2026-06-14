import { db } from "@/lib/db";
import {
  billedCentsAfterWalletDiscount,
  computeWalletChargeFromTokenUsage,
  computeWalletChargeTranscribe,
  estimateMaxTotalTokensForHold,
  estimateWalletHoldCents,
  listPriceUsdFromTokenUsage,
  listUsdToBilledCentsBeforeDiscount,
} from "@/lib/ia-usage-pricing";
import { debitWalletForIa, getUserWalletSnapshot, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";

export type IaTokenOverflowPolicy = "wallet" | "block";

export type SubscriptionIaGateOk =
  | { ok: true; mode: "unmetered" }
  | { ok: true; mode: "included"; remainingTokens: number }
  | { ok: true; mode: "wallet_only"; walletChargeCents: number; walletDiscountPercent: number };

export type SubscriptionIaGateResult =
  | SubscriptionIaGateOk
  | { ok: false; status: 402; error: string; code: string };

type PlanMeterFields = {
  billingKind: string;
  includedIaTokensPerPeriod: number | null;
  iaTokenOverflowPolicy: string | null;
};

export function planHasIncludedTokenCap(
  st: PlanMeterFields | null | undefined,
): st is PlanMeterFields & { includedIaTokensPerPeriod: number } {
  return (
    !!st &&
    st.billingKind === "stripe_recurring" &&
    typeof st.includedIaTokensPerPeriod === "number" &&
    st.includedIaTokensPerPeriod > 0
  );
}

export async function resetSubscriptionIaMeterIfNewPeriod(userSubId: string): Promise<void> {
  const row = await db.userSubscription.findUnique({
    where: { id: userSubId },
    select: { stripeCurrentPeriodEnd: true, iaMeterPeriodEnd: true },
  });
  if (!row?.stripeCurrentPeriodEnd) return;
  const endT = row.stripeCurrentPeriodEnd.getTime();
  const anchorT = row.iaMeterPeriodEnd?.getTime() ?? null;
  if (anchorT === null || anchorT !== endT) {
    await db.userSubscription.update({
      where: { id: userSubId },
      data: { iaIncludedTokensUsed: 0, iaMeterPeriodEnd: row.stripeCurrentPeriodEnd },
    });
  }
}

/** Whisper no devuelve usage de tokens; reservamos cupo según tamaño de audio. */
export function estimateCronogramaTranscribeTokenEquivalent(audioBytes: number): number {
  return Math.min(80_000, Math.max(4_000, Math.ceil(audioBytes / 40)));
}

export async function assertSubscriptionIaTokenGate(params: {
  userId: string;
  userSubId: string;
  plan: PlanMeterFields | null | undefined;
  endpoint: IaWalletBillableEndpoint;
  modelId: string;
  tokenEstimateOverride?: number;
}): Promise<SubscriptionIaGateResult> {
  if (!planHasIncludedTokenCap(params.plan)) {
    return { ok: true, mode: "unmetered" };
  }
  await resetSubscriptionIaMeterIfNewPeriod(params.userSubId);

  const fresh = await db.userSubscription.findUnique({
    where: { id: params.userSubId },
    select: {
      iaIncludedTokensUsed: true,
      subscriptionType: {
        select: { includedIaTokensPerPeriod: true, iaTokenOverflowPolicy: true, billingKind: true },
      },
    },
  });
  const st = fresh?.subscriptionType;
  if (!planHasIncludedTokenCap(st)) {
    return { ok: true, mode: "unmetered" };
  }
  const cap = st.includedIaTokensPerPeriod!;
  const used = fresh?.iaIncludedTokensUsed ?? 0;
  const remaining = Math.max(0, cap - used);
  const policy = (st.iaTokenOverflowPolicy as IaTokenOverflowPolicy) || "wallet";
  const est = params.tokenEstimateOverride ?? estimateMaxTotalTokensForHold(params.endpoint);

  if (remaining <= 0) {
    if (policy === "block") {
      return {
        ok: false,
        status: 402,
        code: "IA_INCLUDED_TOKENS_EXHAUSTED",
        error:
          "Agotaste los tokens de IA incluidos con tu plan en este periodo de facturación. Con la política actual de tu plan no puedes seguir usando la IA de pago hasta la renovación.",
      };
    }
    const snap = await getUserWalletSnapshot(params.userId);
    const hold = estimateWalletHoldCents(params.endpoint, snap.discountPercent, params.modelId);
    if (snap.balanceCents < hold) {
      return {
        ok: false,
        status: 402,
        code: "INSUFFICIENT_WALLET_FOR_IA",
        error: `Tokens incluidos agotados. Saldo en billetera insuficiente (tienes $${(snap.balanceCents / 100).toFixed(2)} USD; se estiman ~$${(hold / 100).toFixed(2)} USD para esta acción). Recarga en Billetera.`,
      };
    }
    return {
      ok: true,
      mode: "wallet_only",
      walletChargeCents: hold,
      walletDiscountPercent: snap.discountPercent,
    };
  }

  if (policy === "block" && remaining < est) {
    return {
      ok: false,
      status: 402,
      code: "IA_INCLUDED_TOKENS_INSUFFICIENT_FOR_REQUEST",
      error: `Te quedan ${remaining.toLocaleString("es-VE")} tokens incluidos este periodo; esta acción puede requerir hasta ~${est.toLocaleString("es-VE")}. Reduce el contenido o espera al próximo ciclo.`,
    };
  }

  return { ok: true, mode: "included", remainingTokens: remaining };
}

export async function settleSubscribedIaAfterCall(params: {
  userSubId: string;
  userId: string;
  model: string;
  endpoint: IaWalletBillableEndpoint;
  reason: string;
  gate: SubscriptionIaGateResult;
  usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined;
  billableTokensOverride?: number;
  /** Si se cobró transcripción Whisper: usar tarifa por audio, no tokens del modelo de chat. */
  transcribeAudioBytes?: number;
}): Promise<void> {
  if (!params.gate.ok) return;
  if (params.gate.mode === "unmetered") return;

  const p0 = params.usage?.prompt_tokens ?? 0;
  const c0 = params.usage?.completion_tokens ?? 0;
  const total =
    typeof params.billableTokensOverride === "number" && params.billableTokensOverride > 0
      ? Math.round(params.billableTokensOverride)
      : p0 + c0;
  if (total <= 0) return;

  const fresh = await db.userSubscription.findUnique({
    where: { id: params.userSubId },
    include: { subscriptionType: true },
  });
  const snap = await getUserWalletSnapshot(params.userId);

  if (!fresh?.subscriptionType || !planHasIncludedTokenCap(fresh.subscriptionType)) {
    if (params.gate.mode === "wallet_only") {
      const charge =
        typeof params.transcribeAudioBytes === "number"
          ? computeWalletChargeTranscribe({
              audioBytes: params.transcribeAudioBytes,
              discountPercent: params.gate.walletDiscountPercent,
            })
          : computeWalletChargeFromTokenUsage({
              model: params.model,
              usage:
                typeof params.billableTokensOverride === "number"
                  ? { prompt_tokens: total, completion_tokens: 0 }
                  : params.usage,
              discountPercent: params.gate.walletDiscountPercent,
            });
      try {
        await debitWalletForIa({
          userId: params.userId,
          chargeCents: charge,
          reason: params.reason,
          meta: { model: params.model, usage: params.usage, endpoint: params.endpoint, meter: "wallet_only" },
        });
      } catch (e) {
        console.error("[ia-meter] wallet debit", e);
      }
    }
    return;
  }

  const cap = fresh.subscriptionType.includedIaTokensPerPeriod!;
  const used = fresh.iaIncludedTokensUsed;
  const remaining = Math.max(0, cap - used);
  const policy = (fresh.subscriptionType.iaTokenOverflowPolicy as IaTokenOverflowPolicy) || "wallet";

  if (params.gate.mode === "wallet_only") {
    const charge =
      typeof params.transcribeAudioBytes === "number"
        ? computeWalletChargeTranscribe({
            audioBytes: params.transcribeAudioBytes,
            discountPercent: params.gate.walletDiscountPercent,
          })
        : computeWalletChargeFromTokenUsage({
            model: params.model,
            usage:
              typeof params.billableTokensOverride === "number"
                ? { prompt_tokens: total, completion_tokens: 0 }
                : params.usage,
            discountPercent: params.gate.walletDiscountPercent,
          });
    try {
      await debitWalletForIa({
        userId: params.userId,
        chargeCents: charge,
        reason: params.reason,
        meta: { model: params.model, usage: params.usage, endpoint: params.endpoint, meter: "wallet_only" },
      });
    } catch (e) {
      console.error("[ia-meter] wallet debit", e);
    }
    return;
  }

  const toIncluded = Math.min(total, remaining);
  const overflow = total - toIncluded;

  await db.userSubscription.update({
    where: { id: params.userSubId },
    data: { iaIncludedTokensUsed: { increment: toIncluded } },
  });

  if (overflow > 0 && policy === "wallet") {
    let charge: number;
    if (typeof params.transcribeAudioBytes === "number") {
      const full = computeWalletChargeTranscribe({
        audioBytes: params.transcribeAudioBytes,
        discountPercent: snap.discountPercent,
      });
      charge = Math.max(1, Math.ceil((full * overflow) / total));
    } else {
      const listUsdOv =
        typeof params.billableTokensOverride === "number"
          ? listPriceUsdFromTokenUsage(params.model, overflow, 0)
          : (() => {
              const r = toIncluded / total;
              const pOv = p0 - p0 * r;
              const cOv = c0 - c0 * r;
              return listPriceUsdFromTokenUsage(params.model, pOv, cOv);
            })();
      const pre = listUsdToBilledCentsBeforeDiscount(listUsdOv);
      charge = billedCentsAfterWalletDiscount(pre, snap.discountPercent);
    }
    if (charge >= 1) {
      try {
        await debitWalletForIa({
          userId: params.userId,
          chargeCents: charge,
          reason: params.reason,
          meta: {
            model: params.model,
            usage: params.usage,
            endpoint: params.endpoint,
            meter: "overflow",
            overflowTokens: overflow,
          },
        });
      } catch (e) {
        console.error("[ia-meter] overflow wallet debit", e);
      }
    }
  }
}

const DAY_IN_MS = 86_400_000;

export async function getSubscriptionIaTokenSummary(userId: string) {
  const sub = await db.userSubscription.findFirst({
    where: { userId },
    include: { subscriptionType: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!sub?.stripeCurrentPeriodEnd) return null;
  if (sub.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS <= Date.now()) return null;
  const st = sub.subscriptionType;
  if (!st || !planHasIncludedTokenCap(st)) {
    return {
      hasCap: false as const,
      cap: null as null,
      used: 0,
      remaining: null as null,
      overflowPolicy: "wallet" as const,
    };
  }
  await resetSubscriptionIaMeterIfNewPeriod(sub.id);
  const row = await db.userSubscription.findUnique({
    where: { id: sub.id },
    select: {
      iaIncludedTokensUsed: true,
      subscriptionType: {
        select: { includedIaTokensPerPeriod: true, iaTokenOverflowPolicy: true, billingKind: true },
      },
    },
  });
  const cap = row?.subscriptionType?.includedIaTokensPerPeriod ?? null;
  const used = row?.iaIncludedTokensUsed ?? 0;
  return {
    hasCap: true as const,
    cap,
    used,
    remaining: cap != null ? Math.max(0, cap - used) : null,
    overflowPolicy: (row?.subscriptionType?.iaTokenOverflowPolicy as IaTokenOverflowPolicy) || "wallet",
  };
}
