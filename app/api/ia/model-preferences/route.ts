import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { IA_LLM_MODE, parseIaLlmMode, type IaLlmMode } from "@/lib/ia-llm-mode";
import { buildModelChoiceAccessRows } from "@/lib/ia-model-access";
import { getFreeTierStatusForUser, listGatewayFreeModelIds } from "@/lib/ia-free-tier";
import {
  getSelectableModelsForRoleAsync,
  sanitizeModelForRoleAsync,
  type StudentIaModelRole,
} from "@/lib/ia-models";
import { resolveUserOrDefaultModel } from "@/lib/ia-user-model";
import { getActiveReferralBoostForUser } from "@/lib/referral-boost";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getUserWalletSnapshot } from "@/lib/ia-wallet";
import { isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";

function roleFromKey(key: string): StudentIaModelRole | null {
  if (key === "chat" || key === "heavy" || key === "cronograma") return key;
  return null;
}

function normalizeModeBody(raw: unknown): IaLlmMode | null {
  if (raw === undefined) return null;
  if (raw === null || raw === "") return IA_LLM_MODE.MANUAL;
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (s === IA_LLM_MODE.AUTO || s === IA_LLM_MODE.MANUAL) return s as IaLlmMode;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        iaModelChat: true,
        iaModelHeavy: true,
        iaModelCronograma: true,
        iaLlmModeChat: true,
        iaLlmModeHeavy: true,
        iaLlmModeCronograma: true,
      },
    });

    const roles: StudentIaModelRole[] = ["chat", "heavy", "cronograma"];
    const allChoices = Object.fromEntries(
      await Promise.all(roles.map(async (r) => [r, await getSelectableModelsForRoleAsync(r)] as const)),
    ) as Record<StudentIaModelRole, string[]>;

    const sub = await getActiveSubscriptionForUser(session.user.id);
    const wallet = await getUserWalletSnapshot(session.user.id);
    const referralDay = await getActiveReferralBoostForUser(session.user.id);
    const freeTier = await getFreeTierStatusForUser(session.user.id);
    const gatewayConfigured = isIaGatewayEnabled();
    const freeModelIds = await listGatewayFreeModelIds();
    const useFreeDailyPicker = !sub && wallet.balanceCents <= 0 && !referralDay;

    const choices = allChoices;

    const modes = {
      chat: parseIaLlmMode(u?.iaLlmModeChat),
      heavy: parseIaLlmMode(u?.iaLlmModeHeavy),
      cronograma: parseIaLlmMode(u?.iaLlmModeCronograma),
    };

    const choiceAccess = Object.fromEntries(
      await Promise.all(
        roles.map(async (r) => {
          const rows = await buildModelChoiceAccessRows({
            userId: session.user.id,
            role: r,
            choiceIds: choices[r],
            lockNonFreeModels: useFreeDailyPicker,
          });
          return [r, rows] as const;
        }),
      ),
    ) as Record<StudentIaModelRole, Awaited<ReturnType<typeof buildModelChoiceAccessRows>>>;

    const resolved = {
      chat: await resolveUserOrDefaultModel(session.user.id, "chat"),
      heavy: await resolveUserOrDefaultModel(session.user.id, "heavy"),
      cronograma: await resolveUserOrDefaultModel(session.user.id, "cronograma"),
    };

    return NextResponse.json({
      stored: {
        chat: u?.iaModelChat ?? null,
        heavy: u?.iaModelHeavy ?? null,
        cronograma: u?.iaModelCronograma ?? null,
      },
      modes,
      resolved,
      choices,
      allChoices,
      choiceAccess,
      freeTier,
      freeModelIds,
      gatewayConfigured,
      useFreeDailyPicker,
    });
  } catch (e) {
    console.error("GET /api/ia/model-preferences:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      chat?: string | null;
      heavy?: string | null;
      cronograma?: string | null;
      chatMode?: unknown;
      heavyMode?: unknown;
      cronogramaMode?: unknown;
    };

    const sub = await getActiveSubscriptionForUser(session.user.id);
    const wallet = await getUserWalletSnapshot(session.user.id);
    const referralDay = await getActiveReferralBoostForUser(session.user.id);
    const useFreeDailyPicker = !sub && wallet.balanceCents <= 0 && !referralDay;
    const freeSet = new Set(await listGatewayFreeModelIds());

    const data: {
      iaModelChat?: string | null;
      iaModelHeavy?: string | null;
      iaModelCronograma?: string | null;
      iaLlmModeChat?: string;
      iaLlmModeHeavy?: string;
      iaLlmModeCronograma?: string;
    } = {};

    for (const key of ["chat", "heavy", "cronograma"] as const) {
      if (!(key in body)) continue;
      const role = roleFromKey(key);
      if (!role) continue;
      const raw = body[key];
      if (raw === null || raw === "") {
        if (key === "chat") data.iaModelChat = null;
        if (key === "heavy") data.iaModelHeavy = null;
        if (key === "cronograma") data.iaModelCronograma = null;
        continue;
      }
      const sanitized = await sanitizeModelForRoleAsync(role, typeof raw === "string" ? raw : null);
      if (!sanitized) {
        return NextResponse.json({ error: `Modelo no permitido para ${key}` }, { status: 400 });
      }
      if (useFreeDailyPicker && !freeSet.has(sanitized)) {
        return NextResponse.json(
          { error: "Este modelo requiere suscripción activa o saldo en wallet." },
          { status: 403 },
        );
      }
      if (key === "chat") data.iaModelChat = sanitized;
      if (key === "heavy") data.iaModelHeavy = sanitized;
      if (key === "cronograma") data.iaModelCronograma = sanitized;
    }

    const modePatches: Array<[StudentIaModelRole, keyof typeof body]> = [
      ["chat", "chatMode"],
      ["heavy", "heavyMode"],
      ["cronograma", "cronogramaMode"],
    ];
    for (const [role, bodyKey] of modePatches) {
      if (!(bodyKey in body)) continue;
      const m = normalizeModeBody(body[bodyKey]);
      if (m === null) {
        return NextResponse.json({ error: `Modo no válido para ${bodyKey}` }, { status: 400 });
      }
      if (role === "chat") data.iaLlmModeChat = m;
      if (role === "heavy") data.iaLlmModeHeavy = m;
      if (role === "cronograma") data.iaLlmModeCronograma = m;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data,
    });

    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        iaLlmModeChat: true,
        iaLlmModeHeavy: true,
        iaLlmModeCronograma: true,
      },
    });

    const modes = {
      chat: parseIaLlmMode(u?.iaLlmModeChat),
      heavy: parseIaLlmMode(u?.iaLlmModeHeavy),
      cronograma: parseIaLlmMode(u?.iaLlmModeCronograma),
    };

    const resolved = {
      chat: await resolveUserOrDefaultModel(session.user.id, "chat"),
      heavy: await resolveUserOrDefaultModel(session.user.id, "heavy"),
      cronograma: await resolveUserOrDefaultModel(session.user.id, "cronograma"),
    };

    return NextResponse.json({ ok: true, modes, resolved });
  } catch (e) {
    console.error("PATCH /api/ia/model-preferences:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
