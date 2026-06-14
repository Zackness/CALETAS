import { auth } from "@/lib/auth";
import { assertTrialReferralOrWalletForIa } from "@/lib/ai-trial";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import {
  assertSubscriptionIaTokenGate,
  estimateCronogramaTranscribeTokenEquivalent,
  type SubscriptionIaGateResult,
} from "@/lib/ia-subscription-meter";
import { resolveUserOrDefaultModelForEndpoint } from "@/lib/ia-user-model";

export type CronogramaAiAccessOk = {
  ok: true;
  userId: string;
  /** Suscripción Stripe activa (si aplica). */
  subscription?: NonNullable<Awaited<ReturnType<typeof getActiveSubscriptionForUser>>>;
  /** Control de cupo de tokens incluidos (solo si el plan tiene tope). */
  subscriptionIaGate?: SubscriptionIaGateResult;
  /** Sin suscripción: reserva comprobada en saldo antes de la llamada (modo billetera). */
  walletChargeCents?: number;
  walletDiscountPercent?: number;
};

export type CronogramaAiAccessResult =
  | CronogramaAiAccessOk
  | { ok: false; status: 401 | 402; error: string; code?: string; userId?: string };

/**
 * Suscripción activa, o día referido / trial / billetera (cronograma IA + transcripción).
 * @param opts.transcribeAudioBytes — si se va a transcribir, pasar tamaño del audio para el cupo de tokens.
 */
export async function assertCronogramaAiAccess(
  request: Request,
  opts?: { transcribeAudioBytes?: number; cronogramaParseText?: string },
): Promise<CronogramaAiAccessResult> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "No autorizado" };
  }
  const sub = await getActiveSubscriptionForUser(session.user.id);
  if (sub) {
    const modelId = await resolveUserOrDefaultModelForEndpoint(session.user.id, "academico/cronograma/ai", {
      cronogramaText: opts?.cronogramaParseText,
    });
    const tokenOverride =
      typeof opts?.transcribeAudioBytes === "number"
        ? estimateCronogramaTranscribeTokenEquivalent(opts.transcribeAudioBytes)
        : undefined;
    const gate = await assertSubscriptionIaTokenGate({
      userId: session.user.id,
      userSubId: sub.id,
      plan: sub.subscriptionType,
      endpoint: "academico/cronograma/ai",
      modelId,
      tokenEstimateOverride: tokenOverride,
    });
    if (!gate.ok) {
      return {
        ok: false,
        status: 402,
        error: gate.error,
        code: gate.code,
        userId: session.user.id,
      };
    }
    return { ok: true, userId: session.user.id, subscription: sub, subscriptionIaGate: gate };
  }
  const gate = await assertTrialReferralOrWalletForIa({
    userId: session.user.id,
    endpoint: "academico/cronograma/ai",
  });
  if (!gate.ok) {
    return {
      ok: false,
      status: 402,
      error: gate.error,
      code: gate.code,
      userId: session.user.id,
    };
  }
  const walletChargeCents = gate.mode === "wallet" && gate.walletChargeCents ? gate.walletChargeCents : undefined;
  const walletDiscountPercent =
    gate.mode === "wallet" && typeof gate.walletDiscountPercent === "number"
      ? gate.walletDiscountPercent
      : undefined;
  return { ok: true, userId: session.user.id, walletChargeCents, walletDiscountPercent };
}
