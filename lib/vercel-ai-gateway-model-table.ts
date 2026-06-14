/**
 * Precios de lista USD por 1M tokens (input / output).
 * En runtime se rellena desde `https://ai-gateway.vercel.sh/v1/models` (caché);
 * esta lista es solo respaldo si la API no responde.
 * @see https://vercel.com/ai-gateway/models
 */
export type VercelGatewayModelPriceRow = {
  modelId: string;
  inputUsdPer1M: number | null;
  outputUsdPer1M: number | null;
  /** Input/output en 0 según el JSON público del Gateway (list price 0 $/1M). */
  isGatewayListedFree?: boolean;
  /** Sin campo `input` (p. ej. `pricing: {}`); no implica gratis. */
  listPriceMissing?: boolean;
  notes?: string;
};

/** Respaldo mínimo (OpenAI) si falla el catálogo público del Gateway. */
export const VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK: readonly VercelGatewayModelPriceRow[] = [
  { modelId: "openai/gpt-4o-mini", inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  { modelId: "openai/gpt-4o", inputUsdPer1M: 2.5, outputUsdPer1M: 10 },
  { modelId: "openai/gpt-4-turbo", inputUsdPer1M: 10, outputUsdPer1M: 30 },
  { modelId: "openai/gpt-3.5-turbo", inputUsdPer1M: 0.5, outputUsdPer1M: 1.5 },
] as const;

/** @deprecated Usar catálogo dinámico; se mantiene el nombre para imports existentes. */
export const VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS = VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK;
