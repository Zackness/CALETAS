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

function parseIncomingId(raw: string) {
  const id = (raw || "").trim();
  if (!id) return { kind: "invalid" as const };
  if (id.startsWith("legacy-")) {
    return { kind: "legacyManualPayment" as const, id: id.slice("legacy-".length) };
  }
  return { kind: "paymentRecord" as const, id };
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

    const parsed = parseIncomingId(id);
    if (parsed.kind === "invalid") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const paymentRecord =
      parsed.kind === "paymentRecord"
        ? await dbAny.paymentRecord.findUnique({
            where: { id: parsed.id },
            include: {
              subscriptionType: true,
              user: { select: { email: true, name: true } },
              manualPayment: true,
            },
          })
        : null;

    const legacyManual =
      parsed.kind === "legacyManualPayment"
        ? await db.manualPayment.findUnique({
            where: { id: parsed.id },
            include: {
              subscriptionType: true,
              user: { select: { id: true, email: true, name: true } },
            },
          })
        : null;

    if (parsed.kind === "paymentRecord") {
      if (!paymentRecord) {
        return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
      }
      if (
        paymentRecord.source !== "MOBILE_BS" ||
        !paymentRecord.manualPaymentId ||
        !paymentRecord.manualPayment
      ) {
        return NextResponse.json({ error: "Este pago no se gestiona manualmente" }, { status: 400 });
      }
      if (paymentRecord.status !== "PENDING") {
        return NextResponse.json({ error: "Este pago ya fue procesado" }, { status: 400 });
      }
    } else {
      if (!legacyManual) {
        return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
      }
      if (legacyManual.status !== "PENDING") {
        return NextResponse.json({ error: "Este pago ya fue procesado" }, { status: 400 });
      }
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
        const manualPaymentId =
          parsed.kind === "paymentRecord" ? paymentRecord!.manualPaymentId : legacyManual!.id;
        const manual = await tx.manualPayment.update({
          where: { id: manualPaymentId },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewedById: admin.userId,
          },
        });

        const txAny = tx as any;
        await txAny.paymentRecord.upsert({
          where: { manualPaymentId },
          create: {
            userId: parsed.kind === "paymentRecord" ? paymentRecord!.userId : legacyManual!.userId,
            subscriptionTypeId:
              parsed.kind === "paymentRecord"
                ? (paymentRecord!.subscriptionTypeId ?? null)
                : legacyManual!.subscriptionTypeId,
            source: "MOBILE_BS",
            status: "REJECTED",
            amountBs: manual.amountBs,
            amountUsdCents:
              parsed.kind === "paymentRecord"
                ? (paymentRecord!.subscriptionType?.price ?? null)
                : legacyManual!.subscriptionType?.price ?? null,
            reference: manual.reference,
            rejectionReason: reason,
            manualPaymentId,
          },
          update: {
            status: "REJECTED",
            rejectionReason: reason,
          },
        });

        return manual;
      });

      try {
        const toEmail =
          parsed.kind === "paymentRecord" ? paymentRecord!.user.email : legacyManual!.user.email;
        const toName =
          parsed.kind === "paymentRecord"
            ? paymentRecord!.user.name || "estudiante"
            : legacyManual!.user.name || "estudiante";
        const planName =
          parsed.kind === "paymentRecord"
            ? paymentRecord!.subscriptionType?.name || "tu plan"
            : legacyManual!.subscriptionType?.name || "tu plan";
        await sendManualPaymentRejectedEmail(
          toEmail,
          toName,
          planName,
          reason,
        );
      } catch (mailError) {
        console.error("Error sending rejected payment email:", mailError);
      }

      return NextResponse.json({ payment: updated });
    }

    // approve
    const now = new Date();
    const planPeriod =
      parsed.kind === "paymentRecord"
        ? paymentRecord!.subscriptionType?.period
        : legacyManual!.subscriptionType?.period;
    const newEnd = addPeriod(planPeriod || "month", now);

    const targetUserId = parsed.kind === "paymentRecord" ? paymentRecord!.userId : legacyManual!.userId;
    const targetSubscriptionTypeId =
      parsed.kind === "paymentRecord"
        ? (paymentRecord!.subscriptionTypeId ?? null)
        : legacyManual!.subscriptionTypeId;

    const existingSub = await db.userSubscription.findFirst({
      where: { userId: targetUserId },
      select: { id: true },
    });

    const [updatedPayment, updatedSub] = await db.$transaction(async (tx) => {
      const manualPaymentId =
        parsed.kind === "paymentRecord" ? paymentRecord!.manualPaymentId : legacyManual!.id;
      const manual = await tx.manualPayment.update({
        where: { id: manualPaymentId },
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
              subscriptionTypeId: targetSubscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          })
        : await tx.userSubscription.create({
            data: {
              userId: targetUserId,
              subscriptionTypeId: targetSubscriptionTypeId,
              stripeCurrentPeriodEnd: newEnd,
              stripePriceId: "manual",
            },
          });

      const txAny = tx as any;
      await txAny.paymentRecord.upsert({
        where: { manualPaymentId },
        create: {
          userId: targetUserId,
          subscriptionTypeId: targetSubscriptionTypeId,
          source: "MOBILE_BS",
          status: "APPROVED",
          amountBs: manual.amountBs,
          amountUsdCents:
            parsed.kind === "paymentRecord"
              ? (paymentRecord!.subscriptionType?.price ?? null)
              : legacyManual!.subscriptionType?.price ?? null,
          reference: manual.reference,
          periodStart: now,
          periodEnd: newEnd,
          paidAt: now,
          manualPaymentId,
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

    const parsed = parseIncomingId(id);
    if (parsed.kind === "invalid") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (parsed.kind === "legacyManualPayment") {
      await db.manualPayment.delete({ where: { id: parsed.id } });
      return NextResponse.json({ ok: true });
    }

    const paymentRecord = await dbAny.paymentRecord.findUnique({
      where: { id: parsed.id },
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
      await txAny.paymentRecord.delete({ where: { id: paymentRecord.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

