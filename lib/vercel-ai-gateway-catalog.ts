import { unstable_cache } from "next/cache";

import type { GatewayRatesMap } from "@/lib/ia-gateway-rates-context";
import type { VercelGatewayModelPriceRow } from "@/lib/vercel-ai-gateway-model-table";
import { VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK } from "@/lib/vercel-ai-gateway-model-table";

/** Catálogo JSON oficial (sin API key). @see https://vercel.com/docs/ai-gateway/models-and-providers */
export const VERCEL_AI_GATEWAY_MODELS_JSON_URL = "https://ai-gateway.vercel.sh/v1/models";

type GatewayJsonModel = {
  id: string;
  type?: string;
  pricing?: Record<string, string | undefined>;
};

type GatewayJson = { data?: GatewayJsonModel[] };

export type GatewayCatalogBundle = {
  /** Modelos `language` del Gateway (elegibles en chat / heavy / cronograma). */
  languageModelIds: string[];
  ratesByModelId: GatewayRatesMap;
  /** Filas para la tabla de transparencia (todos los language, precios si existen). */
  priceRows: VercelGatewayModelPriceRow[];
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function perTokenUsdToPer1M(tokenUsd: string | undefined): number | null {
  if (tokenUsd == null || tokenUsd === "") return null;
  const n = Number(tokenUsd);
  if (!Number.isFinite(n) || n < 0) return null;
  return n * 1_000_000;
}

function pricingString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function parseGatewayJsonToBundle(body: GatewayJson): GatewayCatalogBundle {
  const data = Array.isArray(body.data) ? body.data : [];

  const languageModelIds: string[] = [];
  const ratesByModelId: GatewayRatesMap = {};
  const priceRows: VercelGatewayModelPriceRow[] = [];

  for (const m of data) {
    if (m.type !== "language" || !m.id) continue;
    languageModelIds.push(m.id);

    const p = m.pricing ?? {};
    const inputRaw = pricingString(p.input);
    const outputRaw = pricingString(p.output);
    const listPriceMissing = inputRaw === undefined;

    const inputUsdPer1M = inputRaw !== undefined ? perTokenUsdToPer1M(inputRaw) : null;
    const outputUsdPer1M = outputRaw !== undefined ? perTokenUsdToPer1M(outputRaw) : null;

    const inputNumericZero = inputRaw !== undefined && Number(inputRaw) === 0;
    const outputNumericZeroOrAbsent =
      outputRaw === undefined || (outputRaw !== undefined && Number(outputRaw) === 0);
    const isGatewayListedFree = inputNumericZero && outputNumericZeroOrAbsent;

    let notes: string | undefined;
    if (isGatewayListedFree) {
      notes = "Precio de lista 0 USD/1M tokens (input y output) en el catálogo público del Gateway.";
    } else if (listPriceMissing) {
      notes = "El JSON público del Gateway no incluye tarifa input/output (revisa la ficha del modelo en Vercel).";
    } else if (inputUsdPer1M != null && outputUsdPer1M == null) {
      notes = "Sin precio output en catálogo (cobro estimado usa input).";
    }

    priceRows.push({
      modelId: m.id,
      inputUsdPer1M,
      outputUsdPer1M,
      ...(isGatewayListedFree ? { isGatewayListedFree: true } : {}),
      ...(listPriceMissing ? { listPriceMissing: true } : {}),
      ...(notes ? { notes } : {}),
    });

    if (inputUsdPer1M != null) {
      ratesByModelId[m.id] = {
        inputUsdPerM: inputUsdPer1M,
        outputUsdPerM: outputUsdPer1M ?? inputUsdPer1M,
      };
    }
  }

  languageModelIds.sort((a, b) => a.localeCompare(b));
  priceRows.sort((a, b) => a.modelId.localeCompare(b.modelId));

  if (languageModelIds.length < 8) {
    throw new Error(`Catálogo Gateway incompleto (${languageModelIds.length} modelos language)`);
  }

  return { languageModelIds, ratesByModelId, priceRows };
}

/**
 * Descarga el JSON público de modelos (Anthropic, Google, OpenAI, etc.).
 * Reintentos + timeout: evita quedarse solo con el respaldo OpenAI por un fallo puntual de red.
 */
async function fetchGatewayCatalogFromNetwork(): Promise<GatewayCatalogBundle> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(VERCEL_AI_GATEWAY_MODELS_JSON_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Caletas/1.0 (ai-gateway-catalog)",
        },
        signal: AbortSignal.timeout(28_000),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Gateway models HTTP ${res.status}`);
      }
      const body = (await res.json()) as GatewayJson;
      return parseGatewayJsonToBundle(body);
    } catch (e) {
      lastError = e;
      if (attempt < 4) await sleep(350 * attempt);
    }
  }
  throw lastError;
}

function fallbackBundle(): GatewayCatalogBundle {
  const languageModelIds = VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK.map((r) => r.modelId);
  const ratesByModelId: GatewayRatesMap = {};
  for (const r of VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK) {
    if (r.inputUsdPer1M != null) {
      ratesByModelId[r.modelId] = {
        inputUsdPerM: r.inputUsdPer1M,
        outputUsdPerM: r.outputUsdPer1M ?? r.inputUsdPer1M,
      };
    }
  }
  return {
    languageModelIds,
    ratesByModelId,
    priceRows: [...VERCEL_AI_GATEWAY_MODEL_PRICE_ROWS_FALLBACK],
  };
}

/**
 * Solo resultados exitosos del catálogo remoto (caché 1 h).
 * Si el callback lanza error, Next **no** guarda ese resultado: el siguiente request reintenta.
 */
const getGatewayCatalogNetworkCached = unstable_cache(
  () => fetchGatewayCatalogFromNetwork(),
  ["caletas-vercel-ai-gateway-catalog-v5"],
  { revalidate: 3600 },
);

/**
 * Catálogo del AI Gateway (todos los modelos `language`: openai/*, anthropic/*, google/*, etc.).
 * Si la red falla, devuelve respaldo mínimo OpenAI **sin** envenenar la caché de éxitos.
 */
export async function getCachedGatewayCatalog(): Promise<GatewayCatalogBundle> {
  try {
    return await getGatewayCatalogNetworkCached();
  } catch (e) {
    console.warn("[vercel-ai-gateway-catalog] catálogo remoto no disponible, usando respaldo OpenAI:", e);
    return fallbackBundle();
  }
}
