import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const addPeriod = (period: string, from: Date) => {
  if (period === "day") return new Date(from.getTime() + 86_400_000);
  if (period === "month") {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d;
  }
  if (period === "year") {
    const d = new Date(from);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  // fallback: 30 días
  return new Date(from.getTime() + 86_400_000 * 30);
};

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const, userId: session.user.id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;
    const body = (await request.json()) as { action?: "approve" | "reject" };
    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const payment = await db.manualPayment.findUnique({
      where: { id },
      include: { subscriptionType: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Este pago ya fue procesado" }, { status: 400 });
    }

    if (body.action === "reject") {
      const updated = await db.manualPayment.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedById: admin.userId,
        },
      });
      return NextResponse.json({ payment: updated });
    }

    // approve
    const now = new Date();
    const newEnd = addPeriod(payment.subscriptionType.period, now);

    const existingSub = await db.userSubscription.findFirst({
      where: { userId: payment.userId },
      select: { id: true },
    });

    const [updatedPayment, updatedSub] = await db.$transaction([
      db.manualPayment.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: admin.userId,
        },
      }),
      existingSub?.id
        ? db.userSubscription.update({
            where: { id: existingSub.id },
            data: {
              subscriptionTypeId: payment.subscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          })
        : db.userSubscription.create({
            data: {
              userId: payment.userId,
              subscriptionTypeId: payment.subscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          }),
    ]);

    return NextResponse.json({ payment: updatedPayment, subscription: updatedSub });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

