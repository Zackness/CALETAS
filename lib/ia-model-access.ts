import type { VercelGatewayModelPriceRow } from "@/lib/vercel-ai-gateway-model-table";
import { estimateWalletHoldCents } from "@/lib/ia-usage-pricing";
import type { StudentIaModelRole } from "@/lib/ia-models";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getUserWalletSnapshot, type IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";
import { listGatewayFreeModelIds } from "@/lib/ia-free-tier";

export type ModelCostTier = "gratis" | "sin_precio" | "economico" | "medio" | "alto";

/** Solo filas con precio listado (excluye `gratis` y `sin_precio`). */
export function tierFromInputUsdPerM(
  inputUsdPer1M: number | null | undefined,
): Exclude<ModelCostTier, "gratis" | "sin_precio"> {
  if (inputUsdPer1M == null || !Number.isFinite(inputUsdPer1M)) return "medio";
  if (inputUsdPer1M <= 0.35) return "economico";
  if (inputUsdPer1M <= 2.5) return "medio";
  return "alto";
}

export function tierFromGatewayCatalogRow(
  row: Pick<VercelGatewayModelPriceRow, "inputUsdPer1M" | "outputUsdPer1M" | "isGatewayListedFree" | "listPriceMissing"> | undefined,
): ModelCostTier {
  if (row?.isGatewayListedFree) return "gratis";
  if (row?.listPriceMissing) return "sin_precio";
  return tierFromInputUsdPerM(row?.inputUsdPer1M);
}

function billableEndpointForRole(role: StudentIaModelRole): IaWalletBillableEndpoint {
  if (role === "chat") return "ia/chat";
  if (role === "cronograma") return "academico/cronograma/ai";
  return "ia/resumir";
}

function heavyMaxHold(discountPercent: number, modelId: string): number {
  return Math.max(
    estimateWalletHoldCents("ia/resumir", discountPercent, modelId),
    estimateWalletHoldCents("ia/fichas", discountPercent, modelId),
    estimateWalletHoldCents("ia/cuestionario", discountPercent, modelId),
  );
}

function holdForRole(role: StudentIaModelRole, discountPercent: number, modelId: string): number {
  if (role === "heavy") return heavyMaxHold(discountPercent, modelId);
  return estimateWalletHoldCents(billableEndpointForRole(role), discountPercent, modelId);
}

export type ModelChoiceAccessRow = {
  id: string;
  tier: ModelCostTier;
  inputUsdPer1M: number | null;
  canAffordWithWalletHold: boolean;
  hasActiveSubscription: boolean;
  /** Si el usuario puede elegir este modelo en el picker. */
  selectable: boolean;
};

/**
 * Metadatos por modelo para la UI (coste relativo + si el saldo cubre la reserva estimada).
 */
export async function buildModelChoiceAccessRows(params: {
  userId: string;
  role: StudentIaModelRole;
  choiceIds: string[];
  /** En cupo gratuito diario: solo modelos gratis son seleccionables. */
  lockNonFreeModels?: boolean;
}): Promise<ModelChoiceAccessRow[]> {
  const wallet = await getUserWalletSnapshot(params.userId);
  const sub = await getActiveSubscriptionForUser(params.userId);
  const catalog = await getCachedGatewayCatalog();
  const priceById = new Map(catalog.priceRows.map((r) => [r.modelId, r]));
  const freeIds = new Set(await listGatewayFreeModelIds());
  const lockNonFree = params.lockNonFreeModels === true;

  return params.choiceIds.map((id) => {
    const row = priceById.get(id);
    const inputUsdPer1M = row?.inputUsdPer1M ?? null;
    const hold = holdForRole(params.role, wallet.discountPercent, id);
    const tier: ModelCostTier = freeIds.has(id) ? "gratis" : tierFromGatewayCatalogRow(row);
    const isFree = tier === "gratis";
    const selectable = !lockNonFree || isFree;
    return {
      id,
      tier,
      inputUsdPer1M,
      canAffordWithWalletHold: wallet.balanceCents >= hold,
      hasActiveSubscription: !!sub,
      selectable,
    };
  });
}
