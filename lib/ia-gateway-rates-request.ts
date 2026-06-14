import { runWithGatewayRatesLookup } from "@/lib/ia-gateway-rates-context";
import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";

/**
 * Asocia tarifas del catálogo Gateway al resto del request (AsyncLocalStorage)
 * para que `getRatesForModel` en cobros use precios reales cuando existan.
 */
export async function withIaGatewayRatesForRequest<T>(fn: () => Promise<T>): Promise<T> {
  if (!isIaGatewayEnabled()) return fn();
  const { ratesByModelId } = await getCachedGatewayCatalog();
  return runWithGatewayRatesLookup(ratesByModelId, fn);
}
