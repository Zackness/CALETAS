import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { search = "", reference = "" } = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );

    const q = search.trim();
    const ref = reference.trim();

    const orFilters: Array<Record<string, unknown>> = [];
    if (q) {
      orFilters.push(
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      );
    }
    if (ref) {
      orFilters.push(
        { reference: { contains: ref, mode: "insensitive" } },
        { operationCode: { contains: ref, mode: "insensitive" } },
      );
    }

    const dbAny = db as any;
    const hasPaymentRecord = !!dbAny.paymentRecord;

    if (!hasPaymentRecord) {
      const legacyOrFilters: Array<Record<string, unknown>> = [];
      if (q) {
        legacyOrFilters.push({
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        });
      }
      if (ref) {
        legacyOrFilters.push({ reference: { contains: ref, mode: "insensitive" } });
      }

      const legacyPayments = await db.manualPayment.findMany({
        where: legacyOrFilters.length ? ({ OR: legacyOrFilters } as any) : undefined,
        include: {
          user: { select: { id: true, name: true, email: true } },
          subscriptionType: { select: { id: true, name: true, period: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      return NextResponse.json({
        payments: legacyPayments.map((p) => ({
          id: p.id,
          source: "MOBILE_BS",
          status: p.status,
          amountBs: p.amountBs,
          amountUsdCents: p.subscriptionType.price,
          reference: p.reference,
          operationCode: null,
          rejectionReason: null,
          periodStart: null,
          periodEnd: null,
          paidAt: p.reviewedAt,
          createdAt: p.createdAt,
          user: p.user,
          subscriptionType: p.subscriptionType,
          proofUrl: p.proofUrl || null,
          manualPaymentId: p.id,
        })),
      });
    }

    const payments = await dbAny.paymentRecord.findMany({
      where: orFilters.length ? { OR: orFilters } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscriptionType: { select: { id: true, name: true, period: true, price: true } },
        manualPayment: { select: { proofUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const legacyOrFilters: Array<Record<string, unknown>> = [];
    if (q) {
      legacyOrFilters.push({
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      });
    }
    if (ref) {
      legacyOrFilters.push({ reference: { contains: ref, mode: "insensitive" } });
    }

    const legacyManuals = await db.manualPayment.findMany({
      where: {
        id: { notIn: payments.map((p: any) => p.manualPaymentId).filter(Boolean) },
        ...(legacyOrFilters.length ? ({ OR: legacyOrFilters } as any) : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscriptionType: { select: { id: true, name: true, period: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const now = Date.now();
    const normalizedFromRecords = payments.map((p: any) => {
      const expired =
        p.status === "APPROVED" && p.periodEnd ? p.periodEnd.getTime() < now : false;
      return {
        id: p.id,
        source: p.source,
        status: expired ? "EXPIRED" : p.status,
        amountBs: p.amountBs,
        amountUsdCents: p.amountUsdCents,
        reference: p.reference,
        operationCode: p.operationCode,
        rejectionReason: p.rejectionReason,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        user: p.user,
        subscriptionType: p.subscriptionType,
        proofUrl: p.manualPayment?.proofUrl || null,
        manualPaymentId: p.manualPaymentId,
      };
    });

    const normalizedLegacy = legacyManuals.map((p) => ({
      id: `legacy-${p.id}`,
      source: "MOBILE_BS",
      status: p.status,
      amountBs: p.amountBs,
      amountUsdCents: p.subscriptionType.price,
      reference: p.reference,
      operationCode: null,
      rejectionReason: null,
      periodStart: null,
      periodEnd: null,
      paidAt: p.reviewedAt,
      createdAt: p.createdAt,
      user: p.user,
      subscriptionType: p.subscriptionType,
      proofUrl: p.proofUrl || null,
      manualPaymentId: p.id,
    }));

    const allPayments = [...normalizedFromRecords, ...normalizedLegacy].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      payments: allPayments,
    });
  } catch (error) {
    console.error("Error listing payments:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

