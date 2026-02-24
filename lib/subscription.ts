import { db } from "@/lib/db";

const DAY_IN_MS = 86_400_000;

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

