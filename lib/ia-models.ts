import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";

export type StudentIaModelRole = "chat" | "heavy" | "cronograma";

/** Destacados entre modelos de pago (GPT-5 y Claude primero en el picker). */
export const IA_FEATURED_PAID_MODELS: readonly string[] = [
  "openai/gpt-5.4",
  "openai/gpt-5.2",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5-pro",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-opus-4.8",
  "anthropic/claude-opus-4.6",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-3.5-haiku",
] as const;

function parseEnvModelList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean))];
}

function isLikelySafeModelId(id: string): boolean {
  return id.length > 0 && id.length < 96 && /^[a-zA-Z0-9._/-]+$/.test(id);
}

function isFeaturedPaidModel(id: string, freeSet: Set<string>): boolean {
  if (freeSet.has(id)) return false;
  if (IA_FEATURED_PAID_MODELS.includes(id as (typeof IA_FEATURED_PAID_MODELS)[number])) return true;
  return id.startsWith("openai/gpt-5") || id.startsWith("anthropic/claude");
}

/** Gratis primero, luego GPT-5/Claude destacados, resto alfabético. */
export function sortSelectableModelIds(ids: string[], freeIds: Iterable<string>): string[] {
  const freeSet = new Set(freeIds);
  const unique = [...new Set(ids.filter(isLikelySafeModelId))];
  const featuredOrder = new Map(IA_FEATURED_PAID_MODELS.map((id, i) => [id, i]));

  const free = unique.filter((id) => freeSet.has(id)).sort((a, b) => a.localeCompare(b));
  const featuredPaid = unique
    .filter((id) => isFeaturedPaidModel(id, freeSet))
    .sort((a, b) => {
      const ai = featuredOrder.get(a);
      const bi = featuredOrder.get(b);
      if (ai != null && bi != null) return ai - bi;
      if (ai != null) return -1;
      if (bi != null) return 1;
      return a.localeCompare(b);
    });
  const rest = unique
    .filter((id) => !freeSet.has(id) && !isFeaturedPaidModel(id, freeSet))
    .sort((a, b) => a.localeCompare(b));

  return [...free, ...featuredPaid, ...rest];
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
 * Modelos elegibles: catálogo público del Gateway (GPT-5, Claude, etc.) + allowlist gratis.
 * Listar no requiere API key; ejecutar modelos `proveedor/modelo` sí requiere `AI_GATEWAY_API_KEY`.
 */
export async function getSelectableModelsForRoleAsync(role: StudentIaModelRole): Promise<string[]> {
  const base = getSelectableModelsForRole(role);
  const { listGatewayFreeModelIds } = await import("@/lib/ia-free-tier");
  let freeIds: string[] = [];
  try {
    freeIds = await listGatewayFreeModelIds();
  } catch {
    freeIds = parseEnvModelList(process.env.IA_FREE_MODEL_ALLOWLIST);
  }
  const freeSet = new Set(freeIds);
  const envExtras = parseEnvModelList(
    role === "chat"
      ? process.env.IA_SELECTABLE_MODELS_CHAT
      : role === "heavy"
        ? process.env.IA_SELECTABLE_MODELS_HEAVY
        : process.env.IA_SELECTABLE_MODELS_CRONOGRAMA,
  ).filter(isLikelySafeModelId);

  const seed = [...freeIds, ...IA_FEATURED_PAID_MODELS, ...base, ...envExtras];

  try {
    const { languageModelIds } = await getCachedGatewayCatalog();
    return sortSelectableModelIds([...seed, ...languageModelIds], freeSet);
  } catch {
    return sortSelectableModelIds(seed, freeSet);
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

export function coerceToDirectOpenAiModel(modelId: string, fallback: string): string {
  const normalized = modelId.trim();
  if (!normalized) return fallback;
  if (normalized.startsWith("openai/")) return normalized.slice("openai/".length);
  if (normalized.includes("/")) return fallback;
  return normalized;
}

/** Si el id ya no existe en el catálogo público del Gateway, elige un fallback válido. */
export async function coalesceToKnownGatewayModel(
  modelId: string,
  role: StudentIaModelRole,
): Promise<string> {
  if (!modelId.includes("/")) return modelId;
  try {
    const { languageModelIds } = await getCachedGatewayCatalog();
    const known = new Set(languageModelIds);
    if (known.has(modelId)) return modelId;
    console.warn(`[ia-models] Modelo '${modelId}' no está en el catálogo Gateway; usando alternativa.`);
    const { resolveFreeTierModelForRole } = await import("@/lib/ia-free-tier");
    const fallback = await resolveFreeTierModelForRole(role);
    if (known.has(fallback)) return fallback;
    const defaultModel = resolveStudentIaModel(role);
    return known.has(defaultModel) ? defaultModel : fallback;
  } catch {
    return modelId;
  }
}
