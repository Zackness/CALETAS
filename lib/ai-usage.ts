import { db } from "@/lib/db";

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

/**
 * Registra el uso de IA para estadísticas de administración.
 * Se llama en segundo plano (no bloquea la respuesta).
 */
export function logAiUsage(params: {
  userId: string | null;
  endpoint: string;
  usage: Usage | null;
}): void {
  const { userId, endpoint, usage } = params;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? (promptTokens + completionTokens || 0);

  db.aiUsageLog
    .create({
      data: {
        userId,
        endpoint,
        promptTokens,
        completionTokens,
        totalTokens,
      },
    })
    .catch((err) => console.error("[AiUsageLog]", err));
}
