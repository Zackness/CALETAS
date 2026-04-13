import { db } from "@/lib/db";

/** Forma mínima para comprobar precio del plan (p. ej. desde helpers sin tipo Prisma completo). */
export type SubscriptionForPriceCheck = {
  subscriptionType?: { price?: number | null } | null;
} | null;

const DAY_IN_MS = 86_400_000;
const CHAT_DISABLED_PLAN_NAMES = new Set(["CALETA IA TOOLS"]);
/** Plan completo de caletas (cross-universidad): CALETA PRO $7/mes */
const FULL_CALETAS_MIN_PRICE_CENTS = 700;
/** Biblioteca digital: planes mensuales $3 (IA Tools) y $7 (Pro) */
const BIBLIOTECA_MIN_PRICE_CENTS = 300;

export async function getActiveSubscriptionForUser(userId: string) {
  const sub = await db.userSubscription.findFirst({
    where: { userId },
    include: {
      subscriptionType: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!sub?.stripeCurrentPeriodEnd) return null;

  const isActive = sub.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();
  if (!isActive) return null;

  return sub;
}

export function canUseIAChat(subscription: Awaited<ReturnType<typeof getActiveSubscriptionForUser>>) {
  if (!subscription?.subscriptionType?.name) return false;
  return !CHAT_DISABLED_PLAN_NAMES.has(subscription.subscriptionType.name);
}

export function canAccessBiblioteca(subscription: SubscriptionForPriceCheck) {
  const price = subscription?.subscriptionType?.price;
  if (typeof price !== "number") return false;
  return price >= BIBLIOTECA_MIN_PRICE_CENTS;
}

/** Ver caletas de otras universidades (plan completo, típicamente $7/mes). */
export function canAccessFullCaletasPlan(subscription: SubscriptionForPriceCheck) {
  const price = subscription?.subscriptionType?.price;
  if (typeof price !== "number") return false;
  return price >= FULL_CALETAS_MIN_PRICE_CENTS;
}

/** @deprecated Usar canAccessFullCaletasPlan */
export function canAccessCrossUniversityCaletas(subscription: SubscriptionForPriceCheck) {
  return canAccessFullCaletasPlan(subscription);
}
