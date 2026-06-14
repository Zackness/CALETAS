import { db } from "@/lib/db";
import { estimateWalletHoldCents } from "@/lib/ia-usage-pricing";
import { getUserWalletSnapshot, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { resolveUserOrDefaultModelForEndpoint } from "@/lib/ia-user-model";
import { userHasReferralFullDayIa } from "@/lib/referral-boost";

export type AiTrialEndpoint =
  | "ia/resumir"
  | "ia/fichas"
  | "ia/cuestionario"
  | "ia/chat"
  | "academico/cronograma/ai";

const FREE_REQUEST_LIMITS: Record<Exclude<AiTrialEndpoint, "ia/chat">, number> = {
  "ia/resumir": 3,
  "ia/fichas": 3,
  "ia/cuestionario": 3,
  "academico/cronograma/ai": 3,
};

const FREE_CHAT_MESSAGES_LIMIT = 3;

const UNLIMITED_TRIAL_PLACEHOLDER = 999_999;

export const AI_TRIAL_LIMITS: Record<AiTrialEndpoint, number> = {
  "ia/resumir": FREE_REQUEST_LIMITS["ia/resumir"],
  "ia/fichas": FREE_REQUEST_LIMITS["ia/fichas"],
  "ia/cuestionario": FREE_REQUEST_LIMITS["ia/cuestionario"],
  "ia/chat": FREE_CHAT_MESSAGES_LIMIT,
  "academico/cronograma/ai": FREE_REQUEST_LIMITS["academico/cronograma/ai"],
};

export async function getAiTrialRemaining(params: { userId: string; endpoint: AiTrialEndpoint }) {
  const { userId, endpoint } = params;

  if (await userHasReferralFullDayIa(userId)) {
    return {
      used: 0,
      limit: UNLIMITED_TRIAL_PLACEHOLDER,
      remaining: UNLIMITED_TRIAL_PLACEHOLDER,
    };
  }

  const used = await db.aiUsageLog.count({
    where: {
      userId,
      endpoint,
    },
  });

  const limit =
    endpoint === "ia/chat"
      ? FREE_CHAT_MESSAGES_LIMIT
      : FREE_REQUEST_LIMITS[endpoint as Exclude<AiTrialEndpoint, "ia/chat">];

  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining };
}

export async function getAiTrialStatusForUser(userId: string) {
  const endpoints: AiTrialEndpoint[] = [
    "ia/resumir",
    "ia/fichas",
    "ia/cuestionario",
    "ia/chat",
    "academico/cronograma/ai",
  ];
  const rows = await Promise.all(endpoints.map((endpoint) => getAiTrialRemaining({ userId, endpoint })));

  return endpoints.reduce(
    (acc, endpoint, i) => {
      acc[endpoint] = rows[i]!;
      return acc;
    },
    {} as Record<AiTrialEndpoint, { used: number; limit: number; remaining: number }>,
  );
}

export async function assertAiTrialAllowed(params: { userId: string; endpoint: AiTrialEndpoint }) {
  const info = await getAiTrialRemaining(params);
  if (info.remaining <= 0) {
    const label =
      params.endpoint === "ia/chat"
        ? "Chat IA (3 mensajes)"
        : params.endpoint === "ia/resumir"
          ? "Resumir"
          : params.endpoint === "ia/fichas"
            ? "Fichas"
            : params.endpoint === "ia/cuestionario"
              ? "Cuestionario"
              : "Cronograma IA";
    return {
      ok: false as const,
      info,
      error: `Límite gratis alcanzado para ${label}. Para seguir usando IA necesitas suscribirte.`,
    };
  }
  return { ok: true as const, info };
}

/** Sin suscripción: día referido, trial gratis, o cargo a billetera (consumo). */
export async function assertTrialReferralOrWalletForIa(params: {
  userId: string;
  endpoint: AiTrialEndpoint;
}): Promise<
  | {
      ok: true;
      mode: "trial" | "referral" | "wallet";
      info: { used: number; limit: number; remaining: number };
      /** Reserva conservadora comprobada contra el saldo (coste máx. estimado con margen). */
      walletChargeCents?: number;
      walletDiscountPercent?: number;
    }
  | {
      ok: false;
      error: string;
      code?: string;
      limit?: number;
      info: { used: number; limit: number; remaining: number };
    }
> {
  if (await userHasReferralFullDayIa(params.userId)) {
    const info = await getAiTrialRemaining(params);
    return { ok: true, mode: "referral", info };
  }

  const snap = await getUserWalletSnapshot(params.userId);
  const modelId = await resolveUserOrDefaultModelForEndpoint(params.userId, params.endpoint);
  const charge = estimateWalletHoldCents(
    params.endpoint as IaWalletBillableEndpoint,
    snap.discountPercent,
    modelId,
  );

  const label =
    params.endpoint === "ia/chat"
      ? "Chat IA"
      : params.endpoint === "ia/resumir"
        ? "Resumir"
        : params.endpoint === "ia/fichas"
          ? "Fichas"
          : params.endpoint === "ia/cuestionario"
            ? "Cuestionario"
            : "Cronograma IA";

  /** Con saldo en billetera no hay usos gratuitos de prueba: solo consumo o suscripción. */
  if (snap.balanceCents > 0) {
    const info = await getAiTrialRemaining(params);
    if (snap.balanceCents >= charge) {
      return {
        ok: true,
        mode: "wallet",
        info,
        walletChargeCents: charge,
        walletDiscountPercent: snap.discountPercent,
      };
    }
    const bal = (snap.balanceCents / 100).toFixed(2);
    const need = (charge / 100).toFixed(2);
    return {
      ok: false,
      code: "INSUFFICIENT_WALLET",
      error: `Saldo insuficiente para ${label}. Disponible: $${bal} USD; se estiman ~$${need} USD para este uso. Recarga en Billetera o suscríbete.`,
      info,
    };
  }

  const info = await getAiTrialRemaining(params);
  if (info.remaining > 0) {
    return { ok: true, mode: "trial", info };
  }

  const bal0 = (snap.balanceCents / 100).toFixed(2);
  const need0 = (charge / 100).toFixed(2);

  return {
    ok: false,
    code: "WALLET_OR_SUBSCRIPTION_REQUIRED",
    limit: info.limit,
    info,
    error: `Límite gratis de ${label} agotado. Saldo en billetera: $${bal0} USD (se requieren $${need0} USD por este uso). Recarga en Billetera o suscríbete.`,
  };
}

