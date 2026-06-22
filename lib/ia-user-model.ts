import type { IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { db } from "@/lib/db";
import { resolveAutoModelForRole, resolveFreeTierAutoModelForRole } from "@/lib/ia-auto-model";
import { IA_LLM_MODE, parseIaLlmMode } from "@/lib/ia-llm-mode";
import { resolveFreeTierModelForRole } from "@/lib/ia-free-tier";
import {
  coalesceToKnownGatewayModel,
  resolveStudentIaModel,
  sanitizeModelForRoleAsync,
  type StudentIaModelRole,
} from "@/lib/ia-models";

export type ResolveModelHint = {
  chatLastUserText?: string;
  cronogramaText?: string;
  /** Chat con caletas adjuntas (PDF/imagen) → priorizar modelos multimodales. */
  hasCaletaAttachments?: boolean;
};

export type IaNonSubBillingMode = "free_tier" | "wallet" | "referral";

/** Modo de cobro sin suscripción (null = suscripción activa o día referido con modelos pro). */
export function deriveNonSubModeFromAccess(
  hasSubscription: boolean,
  hasReferralIaDay: boolean,
  access: { ok: true; mode: IaNonSubBillingMode } | { ok: false } | null | undefined,
): IaNonSubBillingMode | null {
  if (hasSubscription || hasReferralIaDay) return null;
  return access?.ok ? access.mode : null;
}

/** Solo free_tier fuerza modelos $0; wallet y referral usan preferencias del usuario. */
export function mapNonSubModeForModelResolve(
  mode: IaNonSubBillingMode | null | undefined,
): "free_tier" | "wallet" | null {
  if (mode === "free_tier") return "free_tier";
  if (mode === "wallet") return "wallet";
  return null;
}

export function endpointToStudentIaRole(endpoint: IaWalletBillableEndpoint): StudentIaModelRole {
  if (endpoint === "ia/chat" || endpoint === "aprende-pic18/tutor/chat") return "chat";
  if (endpoint === "academico/cronograma/ai") return "cronograma";
  return "heavy";
}

export async function resolveUserOrDefaultModel(
  userId: string,
  role: StudentIaModelRole,
  hint?: ResolveModelHint,
): Promise<string> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      iaModelChat: true,
      iaModelHeavy: true,
      iaModelCronograma: true,
      iaLlmModeChat: true,
      iaLlmModeHeavy: true,
      iaLlmModeCronograma: true,
    },
  });
  const mode =
    role === "chat"
      ? parseIaLlmMode(u?.iaLlmModeChat)
      : role === "heavy"
        ? parseIaLlmMode(u?.iaLlmModeHeavy)
        : parseIaLlmMode(u?.iaLlmModeCronograma);

  if (mode === IA_LLM_MODE.AUTO) {
    return resolveAutoModelForRole({
      userId,
      role,
      chatLastUserText: hint?.chatLastUserText,
      cronogramaText: hint?.cronogramaText,
      hasCaletaAttachments: hint?.hasCaletaAttachments,
    });
  }

  const raw = role === "chat" ? u?.iaModelChat : role === "heavy" ? u?.iaModelHeavy : u?.iaModelCronograma;
  return (await sanitizeModelForRoleAsync(role, raw)) ?? resolveStudentIaModel(role);
}

export async function resolveUserOrDefaultModelForEndpoint(
  userId: string,
  endpoint: IaWalletBillableEndpoint,
  hint?: ResolveModelHint,
): Promise<string> {
  return resolveUserOrDefaultModel(userId, endpointToStudentIaRole(endpoint), hint);
}

export async function resolveModelForIaCall(params: {
  userId: string;
  role: StudentIaModelRole;
  nonSubMode?: "free_tier" | "wallet" | "referral" | null;
  hint?: ResolveModelHint;
}): Promise<string> {
  let model: string;
  if (params.nonSubMode === "free_tier") {
    const u = await db.user.findUnique({
      where: { id: params.userId },
      select: {
        iaLlmModeChat: true,
        iaLlmModeHeavy: true,
        iaLlmModeCronograma: true,
      },
    });
    const mode =
      params.role === "chat"
        ? parseIaLlmMode(u?.iaLlmModeChat)
        : params.role === "heavy"
          ? parseIaLlmMode(u?.iaLlmModeHeavy)
          : parseIaLlmMode(u?.iaLlmModeCronograma);

    if (mode === IA_LLM_MODE.AUTO) {
      model = await resolveFreeTierAutoModelForRole({
        role: params.role,
        chatLastUserText: params.hint?.chatLastUserText,
        cronogramaText: params.hint?.cronogramaText,
        hasCaletaAttachments: params.hint?.hasCaletaAttachments,
      });
    } else {
      // Cupo gratis: nunca usar modelos de pago aunque el usuario los tenga guardados.
      model = await resolveFreeTierModelForRole(params.role);
    }
  } else {
    model = await resolveUserOrDefaultModel(params.userId, params.role, params.hint);
  }
  return coalesceToKnownGatewayModel(model, params.role);
}
