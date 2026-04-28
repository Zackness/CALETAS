import { db } from "@/lib/db";

export type AiTrialEndpoint =
  | "ia/resumir"
  | "ia/fichas"
  | "ia/cuestionario"
  | "ia/chat"
  | "academico/cronograma/ai";

const FREE_REQUEST_LIMITS: Record<Exclude<AiTrialEndpoint, "ia/chat">, number> = {
  "ia/resumir": 3,
  "ia/fichas": 3,
  "ia/cuestionario": 3,
  "academico/cronograma/ai": 3,
};

const FREE_CHAT_MESSAGES_LIMIT = 3;

export const AI_TRIAL_LIMITS: Record<AiTrialEndpoint, number> = {
  "ia/resumir": FREE_REQUEST_LIMITS["ia/resumir"],
  "ia/fichas": FREE_REQUEST_LIMITS["ia/fichas"],
  "ia/cuestionario": FREE_REQUEST_LIMITS["ia/cuestionario"],
  "ia/chat": FREE_CHAT_MESSAGES_LIMIT,
  "academico/cronograma/ai": FREE_REQUEST_LIMITS["academico/cronograma/ai"],
};

export async function getAiTrialRemaining(params: { userId: string; endpoint: AiTrialEndpoint }) {
  const { userId, endpoint } = params;

  const used = await db.aiUsageLog.count({
    where: {
      userId,
      endpoint,
    },
  });

  const limit =
    endpoint === "ia/chat"
      ? FREE_CHAT_MESSAGES_LIMIT
      : FREE_REQUEST_LIMITS[endpoint as Exclude<AiTrialEndpoint, "ia/chat">];

  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining };
}

export async function getAiTrialStatusForUser(userId: string) {
  const endpoints: AiTrialEndpoint[] = [
    "ia/resumir",
    "ia/fichas",
    "ia/cuestionario",
    "ia/chat",
    "academico/cronograma/ai",
  ];
  const rows = await Promise.all(endpoints.map((endpoint) => getAiTrialRemaining({ userId, endpoint })));

  return endpoints.reduce(
    (acc, endpoint, i) => {
      acc[endpoint] = rows[i]!;
      return acc;
    },
    {} as Record<AiTrialEndpoint, { used: number; limit: number; remaining: number }>,
  );
}

export async function assertAiTrialAllowed(params: { userId: string; endpoint: AiTrialEndpoint }) {
  const info = await getAiTrialRemaining(params);
  if (info.remaining <= 0) {
    const label =
      params.endpoint === "ia/chat"
        ? "Chat IA (3 mensajes)"
        : params.endpoint === "ia/resumir"
          ? "Resumir"
          : params.endpoint === "ia/fichas"
            ? "Fichas"
            : params.endpoint === "ia/cuestionario"
              ? "Cuestionario"
              : "Cronograma IA";
    return {
      ok: false as const,
      info,
      error: `Límite gratis alcanzado para ${label}. Para seguir usando IA necesitas suscribirte.`,
    };
  }
  return { ok: true as const, info };
}

