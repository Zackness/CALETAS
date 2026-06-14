import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";

export type StudentIaModelRole = "chat" | "heavy" | "cronograma";

function parseEnvModelList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean))];
}

function isLikelySafeModelId(id: string): boolean {
  return id.length > 0 && id.length < 96 && /^[a-zA-Z0-9._/-]+$/.test(id);
}

/**
 * Lista base (defaults + `IA_SELECTABLE_MODELS_*`) sin llamar al catálogo remoto.
 * Con Gateway, para la lista completa usa `getSelectableModelsForRoleAsync`.
 */
export function getSelectableModelsForRole(role: StudentIaModelRole): string[] {
  const gw = isIaGatewayEnabled();
  const envList =
    role === "chat"
      ? process.env.IA_SELECTABLE_MODELS_CHAT
      : role === "heavy"
        ? process.env.IA_SELECTABLE_MODELS_HEAVY
        : process.env.IA_SELECTABLE_MODELS_CRONOGRAMA;
  const primary = resolveStudentIaModel(role);
  const secondary = gw ? "openai/gpt-4o" : "gpt-4o";
  const base = primary === secondary ? [primary] : [primary, secondary];
  const extras = parseEnvModelList(envList).filter(isLikelySafeModelId);
  return [...new Set([...base, ...extras])];
}

/**
 * Modelos elegibles: con AI Gateway, todos los `language` del catálogo público + env + defaults;
 * sin Gateway, misma lista corta que `getSelectableModelsForRole`.
 */
export async function getSelectableModelsForRoleAsync(role: StudentIaModelRole): Promise<string[]> {
  const base = getSelectableModelsForRole(role);
  if (!isIaGatewayEnabled()) return base;
  try {
    const { languageModelIds } = await getCachedGatewayCatalog();
    return [...new Set([...base, ...languageModelIds])];
  } catch {
    return base;
  }
}

/** Devuelve el id si está en la lista permitida para el rol; si no, null. */
export function sanitizeModelForRole(role: StudentIaModelRole, modelId: string | null | undefined): string | null {
  if (!modelId?.trim()) return null;
  const m = modelId.trim();
  if (!isLikelySafeModelId(m)) return null;
  return getSelectableModelsForRole(role).includes(m) ? m : null;
}

export async function sanitizeModelForRoleAsync(
  role: StudentIaModelRole,
  modelId: string | null | undefined,
): Promise<string | null> {
  if (!modelId?.trim()) return null;
  const m = modelId.trim();
  if (!isLikelySafeModelId(m)) return null;
  const allowed = await getSelectableModelsForRoleAsync(role);
  return allowed.includes(m) ? m : null;
}

/**
 * IDs de modelo: con Gateway usar `proveedor/modelo` (ej. `openai/gpt-4o-mini`);
 * sin Gateway, IDs nativos de OpenAI (ej. `gpt-4o-mini`).
 * Ajusta con variables de entorno; lista de precios en `ia-usage-pricing.ts`.
 */
export function resolveStudentIaModel(role: StudentIaModelRole): string {
  const gw = isIaGatewayEnabled();
  if (gw) {
    if (role === "chat") {
      return process.env.IA_GATEWAY_MODEL_CHAT?.trim() || "openai/gpt-4o-mini";
    }
    if (role === "heavy") {
      return process.env.IA_GATEWAY_MODEL_HEAVY?.trim() || "openai/gpt-4o";
    }
    return process.env.IA_GATEWAY_MODEL_CRONOGRAMA?.trim() || "openai/gpt-4o-mini";
  }
  if (role === "chat") {
    return process.env.IA_OPENAI_MODEL_CHAT?.trim() || "gpt-4o-mini";
  }
  if (role === "heavy") {
    return process.env.IA_OPENAI_MODEL_HEAVY?.trim() || "gpt-4o";
  }
  return process.env.IA_OPENAI_MODEL_CRONOGRAMA?.trim() || "gpt-4o-mini";
}

export function resolveWhisperModelId(): string {
  return isIaGatewayEnabled()
    ? process.env.IA_GATEWAY_MODEL_WHISPER?.trim() || "openai/whisper-1"
    : process.env.IA_OPENAI_MODEL_WHISPER?.trim() || "whisper-1";
}
