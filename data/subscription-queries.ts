import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const DAY_IN_MS = 86_400_000;

export const getUserSubscriptionById = async (userId: string) => {
  const data = await db.userSubscription.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!data) return null;

  // Activa si el periodo actual no ha expirado (con 1 día de gracia).
  // Esto permite Stripe y pagos manuales (Bs) usando el mismo campo de expiración.
  const isActive =
    !!data.stripeCurrentPeriodEnd &&
    data.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return {
    ...data,
    isActive: !!isActive,
  };
};

export const getUserSubscription = async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return await getUserSubscriptionById(session.user.id);
};

export const getSubscriptionType = async (subscriptionTypeId: string) => {
  return await db.subscriptionType.findUnique({
    where: { id: subscriptionTypeId },
  });
};

export const getCurrentUserSubscription = async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const data = await db.userSubscription.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!data) return null;

  const isActive =
    !!data.stripeCurrentPeriodEnd &&
    data.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return {
    ...data,
    isActive: !!isActive,
  };
};