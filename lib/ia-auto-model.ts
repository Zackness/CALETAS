import { estimateWalletHoldCents } from "@/lib/ia-usage-pricing";
import type { StudentIaModelRole } from "@/lib/ia-models";
import { resolveStudentIaModel } from "@/lib/ia-models";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getUserWalletSnapshot, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";

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

function looksComplexChat(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length >= 1400) return true;
  return [
    /demostrac/i,
    /demuestra/i,
    /paso a paso/i,
    /demostraci/i,
    /latex/i,
    /\$\$/,
    /```[\s\S]{600}/,
    /prueba\s+de/i,
    /examen\s+final/i,
  ].some((p) => p.test(t));
}

function looksHeavyCronograma(text: string | undefined): boolean {
  if (!text) return false;
  return text.trim().length >= 2800;
}

function strongModelId(): string {
  const gw = isIaGatewayEnabled();
  if (gw) {
    return process.env.IA_GATEWAY_MODEL_AUTO_STRONG?.trim() || "openai/gpt-4o";
  }
  return process.env.IA_OPENAI_MODEL_AUTO_STRONG?.trim() || "gpt-4o";
}

/**
 * Elige modelo en modo automático: tarea “heavy” y chat complejo → modelo fuerte si la cuenta lo tolera;
 * resto → modelo económico por defecto del rol.
 */
export async function resolveAutoModelForRole(params: {
  userId: string;
  role: StudentIaModelRole;
  /** Último mensaje del usuario (chat). */
  chatLastUserText?: string;
  /** Texto enviado al parse de cronograma. */
  cronogramaText?: string;
}): Promise<string> {
  const cheap = resolveStudentIaModel(params.role);
  const strong = strongModelId();
  const wallet = await getUserWalletSnapshot(params.userId);
  const sub = await getActiveSubscriptionForUser(params.userId);

  const afford = (model: string) => {
    const hold = holdForRole(params.role, wallet.discountPercent, model);
    if (wallet.balanceCents >= hold) return true;
    if (sub) return true;
    return false;
  };

  let wantStrong = false;
  if (params.role === "heavy") wantStrong = true;
  else if (params.role === "cronograma") wantStrong = looksHeavyCronograma(params.cronogramaText);
  else wantStrong = looksComplexChat(params.chatLastUserText);

  if (!wantStrong) return cheap;
  return afford(strong) ? strong : cheap;
}
