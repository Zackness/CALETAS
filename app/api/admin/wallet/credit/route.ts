import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditWalletAdmin } from "@/lib/ia-wallet";
import { MIN_WALLET_TOP_UP_CENTS } from "@/lib/wallet-policy";

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const body = (await request.json().catch(() => null)) as {
      userId?: string;
      amountUsd?: number;
      note?: string;
    } | null;

    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const amountUsd = Number(body?.amountUsd);
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "amountUsd debe ser un número positivo" }, { status: 400 });
    }

    const amountCents = Math.round(amountUsd * 100);
    if (amountCents < MIN_WALLET_TOP_UP_CENTS) {
      return NextResponse.json(
        { error: `El mínimo de recarga es $${(MIN_WALLET_TOP_UP_CENTS / 100).toFixed(2)} USD` },
        { status: 400 },
      );
    }

    const exists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    await creditWalletAdmin({
      userId,
      amountCents,
      note: note || "Crédito manual (admin)",
    });

    const updated = await db.user.findUnique({
      where: { id: userId },
      select: { walletBalanceCents: true },
    });

    return NextResponse.json({
      ok: true,
      walletBalanceCents: updated?.walletBalanceCents ?? 0,
    });
  } catch (e) {
    console.error("POST /api/admin/wallet/credit:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
