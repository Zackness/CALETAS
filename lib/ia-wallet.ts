import { db } from "@/lib/db";

/** Mismos endpoints que el trial gratis (consumo por billetera). */
export type IaWalletBillableEndpoint =
  | "ia/chat"
  | "aprende-pic18/tutor/chat"
  | "ia/resumir"
  | "ia/fichas"
  | "ia/cuestionario"
  | "tareas/ai"
  | "academico/cronograma/ai";

const MAX_DISCOUNT = 30;

export function effectiveIaChargeCents(baseCents: number, discountPercent: number): number {
  const d = Math.min(MAX_DISCOUNT, Math.max(0, Math.floor(discountPercent)));
  if (!Number.isFinite(baseCents) || baseCents <= 0) return 0;
  return Math.max(1, Math.ceil((baseCents * (100 - d)) / 100));
}

export async function getUserWalletSnapshot(userId: string) {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { walletBalanceCents: true, iaConsumptionDiscountPercent: true },
  });
  return {
    balanceCents: u?.walletBalanceCents ?? 0,
    discountPercent: u?.iaConsumptionDiscountPercent ?? 0,
  };
}

export async function debitWalletForIa(params: {
  userId: string;
  chargeCents: number;
  reason: string;
  meta?: Record<string, unknown>;
}) {
  const { userId, chargeCents, reason, meta } = params;
  if (chargeCents < 1) throw new Error("Cargo inválido");

  await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalanceCents: true },
    });
    if (!u) throw new Error("Usuario no encontrado");
    if (u.walletBalanceCents < chargeCents) throw new Error("Saldo insuficiente");
    const next = u.walletBalanceCents - chargeCents;
    await tx.user.update({
      where: { id: userId },
      data: { walletBalanceCents: next },
    });
    await tx.walletLedger.create({
      data: {
        userId,
        deltaCents: -chargeCents,
        balanceAfterCents: next,
        reason: reason.slice(0, 64),
        meta: meta ? (meta as object) : undefined,
      },
    });
  });
}

export async function creditWalletAdmin(params: {
  userId: string;
  amountCents: number;
  note: string;
}) {
  const { userId, amountCents, note } = params;
  if (amountCents < 1) throw new Error("Monto inválido");

  await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalanceCents: true },
    });
    if (!u) throw new Error("Usuario no encontrado");
    const next = u.walletBalanceCents + amountCents;
    await tx.user.update({
      where: { id: userId },
      data: { walletBalanceCents: next },
    });
    await tx.walletLedger.create({
      data: {
        userId,
        deltaCents: amountCents,
        balanceAfterCents: next,
        reason: "admin_credit",
        meta: { note: note.slice(0, 500) },
      },
    });
  });
}
