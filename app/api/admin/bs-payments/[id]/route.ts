import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendManualPaymentRejectedEmail } from "@/lib/mail";

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
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      rejectionReason?: string;
    };
    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const dbAny = db as any;
    if (!dbAny.paymentRecord) {
      return NextResponse.json(
        { error: "Reinicia el servidor para habilitar la nueva gestión de pagos." },
        { status: 503 },
      );
    }

    const paymentRecord = await dbAny.paymentRecord.findUnique({
      where: { id },
      include: {
        subscriptionType: true,
        user: {
          select: { email: true, name: true },
        },
        manualPayment: true,
      },
    });
    if (!paymentRecord) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (paymentRecord.source !== "MOBILE_BS" || !paymentRecord.manualPaymentId || !paymentRecord.manualPayment) {
      return NextResponse.json({ error: "Este pago no se gestiona manualmente" }, { status: 400 });
    }
    const payment = paymentRecord.manualPayment;
    if (paymentRecord.status !== "PENDING") {
      return NextResponse.json({ error: "Este pago ya fue procesado" }, { status: 400 });
    }

    if (body.action === "reject") {
      const reason = (body.rejectionReason || "").trim();
      if (!reason) {
        return NextResponse.json(
          { error: "Debes indicar el motivo del rechazo" },
          { status: 400 },
        );
      }

      const updated = await db.$transaction(async (tx) => {
        const manual = await tx.manualPayment.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewedById: admin.userId,
          },
        });

        const txAny = tx as any;
        await txAny.paymentRecord.upsert({
          where: { manualPaymentId: id },
          create: {
            userId: paymentRecord.userId,
            subscriptionTypeId: paymentRecord.subscriptionTypeId,
            source: "MOBILE_BS",
            status: "REJECTED",
            amountBs: payment.amountBs,
            amountUsdCents: paymentRecord.subscriptionType?.price ?? null,
            reference: payment.reference,
            rejectionReason: reason,
            manualPaymentId: payment.id,
          },
          update: {
            status: "REJECTED",
            rejectionReason: reason,
          },
        });

        return manual;
      });

      try {
        await sendManualPaymentRejectedEmail(
          paymentRecord.user.email,
          paymentRecord.user.name || "estudiante",
          paymentRecord.subscriptionType?.name || "tu plan",
          reason,
        );
      } catch (mailError) {
        console.error("Error sending rejected payment email:", mailError);
      }

      return NextResponse.json({ payment: updated });
    }

    // approve
    const now = new Date();
    const newEnd = addPeriod(payment.subscriptionType.period, now);

    const existingSub = await db.userSubscription.findFirst({
      where: { userId: paymentRecord.userId },
      select: { id: true },
    });

    const [updatedPayment, updatedSub] = await db.$transaction(async (tx) => {
      const manual = await tx.manualPayment.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: admin.userId,
        },
      });

      const sub = existingSub?.id
        ? await tx.userSubscription.update({
            where: { id: existingSub.id },
            data: {
              subscriptionTypeId: payment.subscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          })
        : await tx.userSubscription.create({
            data: {
              userId: paymentRecord.userId,
              subscriptionTypeId: payment.subscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          });

      const txAny = tx as any;
      await txAny.paymentRecord.upsert({
        where: { manualPaymentId: id },
        create: {
          userId: paymentRecord.userId,
          subscriptionTypeId: payment.subscriptionTypeId,
          source: "MOBILE_BS",
          status: "APPROVED",
          amountBs: payment.amountBs,
          amountUsdCents: paymentRecord.subscriptionType?.price ?? null,
          reference: payment.reference,
          periodStart: now,
          periodEnd: newEnd,
          paidAt: now,
          manualPaymentId: payment.id,
        },
        update: {
          status: "APPROVED",
          periodStart: now,
          periodEnd: newEnd,
          paidAt: now,
          rejectionReason: null,
        },
      });

      return [manual, sub] as const;
    });

    return NextResponse.json({ payment: updatedPayment, subscription: updatedSub });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;
    const dbAny = db as any;
    if (!dbAny.paymentRecord) {
      return NextResponse.json(
        { error: "Reinicia el servidor para habilitar la nueva gestión de pagos." },
        { status: 503 },
      );
    }

    const paymentRecord = await dbAny.paymentRecord.findUnique({
      where: { id },
      select: { id: true, manualPaymentId: true },
    });
    if (!paymentRecord) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      if (paymentRecord.manualPaymentId) {
        await tx.manualPayment.delete({ where: { id: paymentRecord.manualPaymentId } });
      }
      const txAny = tx as any;
      await txAny.paymentRecord.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

