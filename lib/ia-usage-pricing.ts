import { getOptionalGatewayRatesLookup } from "@/lib/ia-gateway-rates-context";
import { effectiveIaChargeCents, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { resolveStudentIaModel, type StudentIaModelRole } from "@/lib/ia-models";

/**
 * Margen de la plataforma sobre el coste listo del proveedor (Vercel AI Gateway cobra list price al upstream).
 * @see https://vercel.com/docs/ai-gateway
 */
export const IA_PLATFORM_MARGIN = 1.1;

/** Mínimo a cobrar por request (evita microcargos inviables). */
export const IA_MIN_BILLABLE_CENTS = 1;

/**
 * Tarifas USD / 1M tokens (aprox. list price OpenAI; el Gateway replica list price sin markup de Vercel).
 * Mantener alineado con la [lista de modelos](https://vercel.com/ai-gateway/models) cuando cambien precios.
 */
const MODEL_TOKEN_RATES_USD_PER_M: Record<
  string,
  { inputUsdPerM: number; outputUsdPerM: number }
> = {
  // OpenAI (IDs con y sin prefijo proveedor)
  "gpt-4o-mini": { inputUsdPerM: 0.15, outputUsdPerM: 0.6 },
  "openai/gpt-4o-mini": { inputUsdPerM: 0.15, outputUsdPerM: 0.6 },
  "gpt-4o": { inputUsdPerM: 2.5, outputUsdPerM: 10 },
  "openai/gpt-4o": { inputUsdPerM: 2.5, outputUsdPerM: 10 },
  "gpt-4-turbo": { inputUsdPerM: 10, outputUsdPerM: 30 },
  "openai/gpt-4-turbo": { inputUsdPerM: 10, outputUsdPerM: 30 },
  "gpt-3.5-turbo": { inputUsdPerM: 0.5, outputUsdPerM: 1.5 },
  "openai/gpt-3.5-turbo": { inputUsdPerM: 0.5, outputUsdPerM: 1.5 },
};

function normalizeModelKey(model: string): string {
  return model.trim();
}

function getRatesForModel(model: string): { inputUsdPerM: number; outputUsdPerM: number } {
  const key = normalizeModelKey(model);
  const fromGateway = getOptionalGatewayRatesLookup()?.[key];
  if (fromGateway) return fromGateway;
  const direct = MODEL_TOKEN_RATES_USD_PER_M[key];
  if (direct) return direct;
  // Heurística: modelos mini / flash suelen ser baratos
  const lower = key.toLowerCase();
  if (lower.includes("mini") || lower.includes("flash") || lower.includes("nano")) {
    return { inputUsdPerM: 0.2, outputUsdPerM: 0.8 };
  }
  return { inputUsdPerM: 3, outputUsdPerM: 12 };
}

export function listPriceUsdFromTokenUsage(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const { inputUsdPerM, outputUsdPerM } = getRatesForModel(model);
  return (promptTokens / 1_000_000) * inputUsdPerM + (completionTokens / 1_000_000) * outputUsdPerM;
}

/** USD de list price → centavos cobrados al usuario con margen fijo (antes del dto. referido/billetera). */
export function listUsdToBilledCentsBeforeDiscount(listUsd: number): number {
  if (!Number.isFinite(listUsd) || listUsd <= 0) return 0;
  const withMargin = listUsd * IA_PLATFORM_MARGIN;
  return Math.max(IA_MIN_BILLABLE_CENTS, Math.ceil(withMargin * 100));
}

export function billedCentsAfterWalletDiscount(preDiscountCents: number, discountPercent: number): number {
  return effectiveIaChargeCents(preDiscountCents, discountPercent);
}

export function computeWalletChargeFromTokenUsage(params: {
  model: string;
  usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined;
  discountPercent: number;
}): number {
  const p = params.usage?.prompt_tokens ?? 0;
  const c = params.usage?.completion_tokens ?? 0;
  const listUsd = listPriceUsdFromTokenUsage(params.model, p, c);
  const pre = listUsdToBilledCentsBeforeDiscount(listUsd);
  return billedCentsAfterWalletDiscount(pre, params.discountPercent);
}

/** Límite superior de tokens asumidos por request (reserva de billetera antes de conocer uso real). */
const WALLET_HOLD_TOKENS: Record<IaWalletBillableEndpoint, { prompt: number; completion: number }> = {
  "ia/chat": { prompt: 36_000, completion: 1_500 },
  "ia/resumir": { prompt: 130_000, completion: 4_500 },
  "ia/fichas": { prompt: 130_000, completion: 4_500 },
  "ia/cuestionario": { prompt: 130_000, completion: 4_500 },
  /** Parse de texto en calendario (el hold total compara con audio máx. vía Whisper en la misma ruta lógica). */
  "academico/cronograma/ai": { prompt: 24_000, completion: 4_000 },
};

/** Tokens (prompt+completion) usados en la heurística de reserva / cupo antes de la llamada. */
export function estimateMaxTotalTokensForHold(endpoint: IaWalletBillableEndpoint): number {
  const { prompt, completion } = WALLET_HOLD_TOKENS[endpoint];
  return prompt + completion;
}

const CRONOGRAMA_MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function endpointToModelRole(endpoint: IaWalletBillableEndpoint): StudentIaModelRole {
  if (endpoint === "ia/chat") return "chat";
  if (endpoint === "academico/cronograma/ai") return "cronograma";
  return "heavy";
}

/**
 * Saldo mínimo requerido en billetera antes de permitir la llamada (hold conservador según modelo actual).
 */
export function estimateWalletHoldCents(
  endpoint: IaWalletBillableEndpoint,
  discountPercent: number,
  /** Si se omite, se usa el modelo por defecto del servidor (no el guardado por usuario). */
  modelId?: string,
): number {
  const model = modelId ?? resolveStudentIaModel(endpointToModelRole(endpoint));
  const { prompt, completion } = WALLET_HOLD_TOKENS[endpoint];
  let listUsd = listPriceUsdFromTokenUsage(model, prompt, completion);
  if (endpoint === "academico/cronograma/ai") {
    const whisperListUsd = estimateTranscribeListUsd(CRONOGRAMA_MAX_AUDIO_BYTES);
    listUsd = Math.max(listUsd, whisperListUsd);
  }
  const pre = listUsdToBilledCentsBeforeDiscount(listUsd);
  return billedCentsAfterWalletDiscount(pre, discountPercent);
}

/** Whisper: ~USD 0.006 / min list price; estimamos minutos desde tamaño del audio comprimido. */
export function estimateTranscribeListUsd(audioBytes: number): number {
  const assumedMinutes = Math.min(25, Math.max(1 / 6, audioBytes / (200 * 1024)));
  return assumedMinutes * 0.006;
}

export function listBillableIaEndpoints(): IaWalletBillableEndpoint[] {
  return Object.keys(WALLET_HOLD_TOKENS) as IaWalletBillableEndpoint[];
}

export function computeWalletChargeTranscribe(params: {
  audioBytes: number;
  discountPercent: number;
}): number {
  const pre = listUsdToBilledCentsBeforeDiscount(estimateTranscribeListUsd(params.audioBytes));
  return billedCentsAfterWalletDiscount(pre, params.discountPercent);
}
