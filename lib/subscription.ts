import { db } from "@/lib/db";

const DAY_IN_MS = 86_400_000;
const CHAT_DISABLED_PLAN_NAMES = new Set(["CALETA IA TOOLS"]);

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

