import {
  assertFreeTierAccess,
  getFreeTierStatusForUser,
  type IaFreeTierStatus,
} from "@/lib/ia-free-tier";
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

const UNLIMITED_TRIAL_PLACEHOLDER = 999_999;

export type AiTrialInfo = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt?: string;
  resetsAtLabel?: string;
};

function freeTierToTrialInfo(status: IaFreeTierStatus): AiTrialInfo {
  return {
    used: status.tokensUsed,
    limit: status.tokensLimit,
    remaining: status.tokensRemaining,
    resetsAt: status.resetsAt,
    resetsAtLabel: status.resetsAtLabel,
  };
}

/** Cupo diario compartido entre todos los servicios de IA (por usuario). */
export async function getAiTrialRemaining(params: { userId: string; endpoint: AiTrialEndpoint }) {
  void params.endpoint;
  if (await userHasReferralFullDayIa(params.userId)) {
    return {
      used: 0,
      limit: UNLIMITED_TRIAL_PLACEHOLDER,
      remaining: UNLIMITED_TRIAL_PLACEHOLDER,
    };
  }
  const status = await getFreeTierStatusForUser(params.userId);
  return freeTierToTrialInfo(status);
}

export async function getAiTrialStatusForUser(userId: string) {
  const status = await getFreeTierStatusForUser(userId);
  const row = freeTierToTrialInfo(status);
  const endpoints: AiTrialEndpoint[] = [
    "ia/resumir",
    "ia/fichas",
    "ia/cuestionario",
    "ia/chat",
    "academico/cronograma/ai",
  ];
  return endpoints.reduce(
    (acc, endpoint) => {
      acc[endpoint] = row;
      return acc;
    },
    {} as Record<AiTrialEndpoint, AiTrialInfo>,
  );
}

export async function assertAiTrialAllowed(params: {
  userId: string;
  endpoint: AiTrialEndpoint;
  tokenEstimateOverride?: number;
}) {
  const gate = await assertFreeTierAccess({
    userId: params.userId,
    endpoint: params.endpoint as IaWalletBillableEndpoint,
    tokenEstimate: params.tokenEstimateOverride,
  });
  const info = await getAiTrialRemaining(params);
  if (!gate.ok) {
    return { ok: false as const, info, error: gate.error };
  }
  return { ok: true as const, info };
}

/** Sin suscripción: día referido, cupo free diario (modelos Gateway $0), o billetera. */
export async function assertTrialReferralOrWalletForIa(params: {
  userId: string;
  endpoint: AiTrialEndpoint;
  tokenEstimateOverride?: number;
}): Promise<
  | {
      ok: true;
      mode: "free_tier" | "referral" | "wallet";
      info: AiTrialInfo;
      walletChargeCents?: number;
      walletDiscountPercent?: number;
      freeTierModelForced?: true;
    }
  | {
      ok: false;
      error: string;
      code?: string;
      limit?: number;
      info: AiTrialInfo;
      resetsAt?: string;
      resetsAtLabel?: string;
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

  const gate = await assertFreeTierAccess({
    userId: params.userId,
    endpoint: params.endpoint as IaWalletBillableEndpoint,
    tokenEstimate: params.tokenEstimateOverride,
  });
  const info = await getAiTrialRemaining(params);

  if (gate.ok) {
    return {
      ok: true,
      mode: "free_tier",
      info,
      freeTierModelForced: true,
    };
  }

  return {
    ok: false,
    code: gate.code,
    error: gate.error,
    info,
    resetsAt: gate.resetsAt,
    resetsAtLabel: gate.resetsAtLabel,
    limit: gate.tokensLimit,
  };
}
