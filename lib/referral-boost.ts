import { randomBytes } from "crypto";

import type { Prisma, UserRole } from "@prisma/client";

import { isAdminReferrerEmail } from "@/lib/admin-referrer";
import { db } from "@/lib/db";

export const REFERRAL_IA_DAY_MS = 86_400_000;

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeReferralCodeInput(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length ? s : null;
}

function randomReferralCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += REFERRAL_ALPHABET[bytes[i]! % REFERRAL_ALPHABET.length]!;
  }
  return out;
}

export async function generateUniqueReferralCodeTx(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt++) {
    const candidate = randomReferralCode();
    const clash = await tx.user.findFirst({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new Error("No se pudo generar un código de referido único");
}

export async function getActiveReferralBoostForUser(userId: string) {
  const now = new Date();
  return db.referralBoost.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
  });
}

export async function userHasReferralFullDayIa(userId: string) {
  const row = await getActiveReferralBoostForUser(userId);
  return !!row;
}

export async function countPendingReferrerRewards(userId: string) {
  return db.referralBoost.count({
    where: {
      userId,
      kind: "REFERRER_REWARD",
      status: "PENDING",
    },
  });
}

/** Genera código de referido para estudiantes y para admin (campañas). */
export async function ensureClientReferralCode(userId: string) {
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, role: true },
    });
    if (!u || u.referralCode) return;
    if (u.role !== "CLIENT" && u.role !== "ADMIN") return;
    const code = await generateUniqueReferralCodeTx(tx);
    await tx.user.update({ where: { id: userId }, data: { referralCode: code } });
  });
}

async function ensureUserReferralCodeTx(tx: Prisma.TransactionClient, userId: string, role: UserRole) {
  if (role !== "CLIENT" && role !== "ADMIN") return;
  const u = await tx.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (u?.referralCode) return;
  const code = await generateUniqueReferralCodeTx(tx);
  await tx.user.update({ where: { id: userId }, data: { referralCode: code } });
}

/** Tras onboarding: asigna código al estudiante y aplica recompensas si el código de invitación era válido (validar antes en la ruta). */
export async function applyOnboardingReferralRewards(params: {
  userId: string;
  role: UserRole;
  normalizedReferralCode: string | null;
}) {
  const { userId, role, normalizedReferralCode } = params;

  await db.$transaction(async (tx) => {
    await ensureUserReferralCodeTx(tx, userId, role);

    if (role !== "CLIENT" || !normalizedReferralCode) return;

    const me = await tx.user.findUnique({
      where: { id: userId },
      select: { referredByUserId: true },
    });
    if (me?.referredByUserId) return;

    const referrer = await tx.user.findFirst({
      where: {
        referralCode: normalizedReferralCode,
        NOT: { id: userId },
        OR: [{ role: "CLIENT" }, { role: "ADMIN" }],
      },
      select: { id: true, email: true },
    });
    if (!referrer) return;

    const adminReferral = isAdminReferrerEmail(referrer.email);

    await tx.user.update({
      where: { id: userId },
      data: {
        referredByUserId: referrer.id,
        ...(adminReferral ? { iaConsumptionDiscountPercent: 30 } : {}),
      },
    });

    const now = new Date();
    const ends = new Date(now.getTime() + REFERRAL_IA_DAY_MS);

    await tx.referralBoost.create({
      data: {
        userId,
        kind: "REFEREE_WELCOME",
        status: "ACTIVE",
        startsAt: now,
        endsAt: ends,
      },
    });

    await tx.referralBoost.create({
      data: {
        userId: referrer.id,
        kind: "REFERRER_REWARD",
        status: "PENDING",
        triggeredByUserId: userId,
      },
    });
  });
}

export async function redeemOldestReferrerReward(userId: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const active = await tx.referralBoost.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    });
    if (active) {
      return { ok: false as const, error: "Ya tienes un día de IA completo activo. Canjea cuando expire." };
    }

    const pending = await tx.referralBoost.findFirst({
      where: { userId, kind: "REFERRER_REWARD", status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (!pending) {
      return { ok: false as const, error: "No tienes recompensas por referido pendientes." };
    }

    const ends = new Date(now.getTime() + REFERRAL_IA_DAY_MS);
    await tx.referralBoost.update({
      where: { id: pending.id },
      data: {
        status: "ACTIVE",
        startsAt: now,
        endsAt: ends,
      },
    });

    return { ok: true as const, endsAt: ends };
  });
}
