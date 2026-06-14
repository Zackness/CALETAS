export const BILLING_STRIPE_RECURRING = "stripe_recurring";
export const BILLING_WALLET_CONSUMPTION = "wallet_consumption";

export function isWalletConsumptionPlan(type: { billingKind?: string | null } | null | undefined): boolean {
  return type?.billingKind === BILLING_WALLET_CONSUMPTION;
}
