import { estimateWalletHoldCents } from "@/lib/ia-usage-pricing";
import type { StudentIaModelRole } from "@/lib/ia-models";
import { resolveStudentIaModel } from "@/lib/ia-models";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getUserWalletSnapshot, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import {
  chatTaskIntentLabel,
  detectChatTaskIntent,
  type ChatTaskIntent,
} from "@/lib/ia-chat-task-intent";
import { listGatewayFreeModelIds } from "@/lib/ia-free-tier";

function billableEndpointForRole(role: StudentIaModelRole): IaWalletBillableEndpoint {
  if (role === "chat") return "ia/chat";
  if (role === "cronograma") return "academico/cronograma/ai";
  return "ia/resumir";
}

function heavyMaxHoldCents(discountPercent: number, modelId: string): number {
  return Math.max(
    estimateWalletHoldCents("ia/resumir", discountPercent, modelId),
    estimateWalletHoldCents("ia/fichas", discountPercent, modelId),
    estimateWalletHoldCents("ia/cuestionario", discountPercent, modelId),
  );
}

function holdForRole(role: StudentIaModelRole, discountPercent: number, modelId: string): number {
  if (role === "heavy") return heavyMaxHoldCents(discountPercent, modelId);
  return estimateWalletHoldCents(billableEndpointForRole(role), discountPercent, modelId);
}

function looksHeavyCronograma(text: string | undefined): boolean {
  if (!text) return false;
  return text.trim().length >= 2800;
}

function gw(...candidates: (string | undefined)[]): string[] {
  return candidates.filter((c): c is string => Boolean(c?.trim()));
}

function openAi(...candidates: (string | undefined)[]): string[] {
  return candidates.filter((c): c is string => Boolean(c?.trim()));
}

function modelCandidatesForIntent(intent: ChatTaskIntent, gateway: boolean): string[] {
  if (gateway) {
    switch (intent) {
      case "code":
        return gw(
          process.env.IA_GATEWAY_MODEL_AUTO_CODE?.trim(),
          "anthropic/claude-sonnet-4.6",
          "openai/gpt-5.2",
          "openai/gpt-5",
          "openai/gpt-4o",
        );
      case "vision":
        return gw(
          process.env.IA_GATEWAY_MODEL_AUTO_VISION?.trim(),
          "google/gemini-2.5-flash",
          "openai/gpt-4o",
          "google/gemini-2.5-flash-lite",
        );
      case "reasoning":
        return gw(
          process.env.IA_GATEWAY_MODEL_AUTO_STRONG?.trim(),
          "openai/gpt-5.2",
          "openai/gpt-5-pro",
          "anthropic/claude-sonnet-4.6",
          "openai/gpt-5",
        );
      case "creative":
        return gw(
          process.env.IA_GATEWAY_MODEL_AUTO_CREATIVE?.trim(),
          "openai/gpt-5.2",
          "anthropic/claude-sonnet-4.6",
          "openai/gpt-5",
        );
      default:
        return gw(
          process.env.IA_GATEWAY_MODEL_CHAT?.trim(),
          "openai/gpt-4o-mini",
          "google/gemini-2.5-flash-lite",
        );
    }
  }

  switch (intent) {
    case "code":
      return openAi(
        process.env.IA_OPENAI_MODEL_AUTO_CODE?.trim(),
        "gpt-4o",
        process.env.IA_OPENAI_MODEL_AUTO_STRONG?.trim(),
      );
    case "vision":
      return openAi(process.env.IA_OPENAI_MODEL_AUTO_VISION?.trim(), "gpt-4o");
    case "reasoning":
    case "creative":
      return openAi(process.env.IA_OPENAI_MODEL_AUTO_STRONG?.trim(), "gpt-4o");
    default:
      return openAi(process.env.IA_OPENAI_MODEL_CHAT?.trim(), "gpt-4o-mini");
  }
}

function freeModelCandidatesForIntent(intent: ChatTaskIntent): string[] {
  switch (intent) {
    case "code":
      return [
        "meta/llama-3.3-70b",
        "google/gemini-2.5-flash",
        "google/gemini-2.5-flash-lite",
        "meta/llama-3.1-8b",
      ];
    case "vision":
      return [
        "google/gemini-2.5-flash",
        "google/gemini-2.5-flash-lite",
        "google/gemini-3.1-flash-lite",
      ];
    case "reasoning":
    case "creative":
      return [
        "google/gemini-2.5-flash",
        "meta/llama-3.3-70b",
        "google/gemini-2.5-flash-lite",
      ];
    default:
      return [
        "google/gemini-2.5-flash-lite",
        "google/gemini-2.5-flash",
        "meta/llama-3.2-1b",
        "meta/llama-3.1-8b",
      ];
  }
}

function pickFirstAffordable(
  candidates: string[],
  afford: (model: string) => boolean,
  fallback: string,
): string {
  for (const id of candidates) {
    if (afford(id)) return id;
  }
  return fallback;
}

function pickFirstFreeAvailable(candidates: string[], available: Set<string>): string | null {
  for (const id of candidates) {
    if (available.has(id)) return id;
  }
  return null;
}

export type ResolveAutoModelParams = {
  userId: string;
  role: StudentIaModelRole;
  chatLastUserText?: string;
  cronogramaText?: string;
  hasCaletaAttachments?: boolean;
};

/**
 * IA Pro: elige el mejor modelo según la tarea (código, visión, razonamiento, etc.),
 * saldo y plan del usuario.
 */
export async function resolveAutoModelForRole(params: ResolveAutoModelParams): Promise<string> {
  const cheap = resolveStudentIaModel(params.role);
  const gateway = isIaGatewayEnabled();
  const wallet = await getUserWalletSnapshot(params.userId);
  const sub = await getActiveSubscriptionForUser(params.userId);

  const afford = (model: string) => {
    const hold = holdForRole(params.role, wallet.discountPercent, model);
    if (wallet.balanceCents >= hold) return true;
    if (sub) return true;
    return false;
  };

  if (params.role === "heavy") {
    const strong = modelCandidatesForIntent("reasoning", gateway)[0] ?? cheap;
    return afford(strong) ? strong : cheap;
  }

  if (params.role === "cronograma") {
    const intent: ChatTaskIntent = looksHeavyCronograma(params.cronogramaText) ? "reasoning" : "general";
    const candidates = modelCandidatesForIntent(intent, gateway);
    return pickFirstAffordable(candidates, afford, cheap);
  }

  const intent = detectChatTaskIntent(params.chatLastUserText, {
    hasCaletaAttachments: params.hasCaletaAttachments,
  });
  const candidates = modelCandidatesForIntent(intent, gateway);
  const picked = pickFirstAffordable(candidates, afford, cheap);

  if (intent !== "general" && process.env.NODE_ENV !== "production") {
    console.info(`[ia-pro] tarea=${chatTaskIntentLabel(intent)} → ${picked}`);
  }

  return picked;
}

/** IA Pro en cupo gratis: elige entre modelos gratuitos del Gateway. */
export async function resolveFreeTierAutoModelForRole(params: {
  role: StudentIaModelRole;
  chatLastUserText?: string;
  cronogramaText?: string;
  hasCaletaAttachments?: boolean;
}): Promise<string> {
  const available = new Set(await listGatewayFreeModelIds());
  const fallback = [...available].sort((a, b) => a.localeCompare(b))[0] ?? "google/gemini-2.5-flash-lite";

  let intent: ChatTaskIntent = "general";
  if (params.role === "heavy") intent = "reasoning";
  else if (params.role === "cronograma") {
    intent = looksHeavyCronograma(params.cronogramaText) ? "reasoning" : "general";
  } else {
    intent = detectChatTaskIntent(params.chatLastUserText, {
      hasCaletaAttachments: params.hasCaletaAttachments,
    });
  }

  const picked = pickFirstFreeAvailable(freeModelCandidatesForIntent(intent), available);
  return picked ?? fallback;
}
