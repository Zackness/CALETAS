import type { IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { db } from "@/lib/db";
import { resolveAutoModelForRole } from "@/lib/ia-auto-model";
import { IA_LLM_MODE, parseIaLlmMode } from "@/lib/ia-llm-mode";
import {
  resolveStudentIaModel,
  sanitizeModelForRoleAsync,
  type StudentIaModelRole,
} from "@/lib/ia-models";

export type ResolveModelHint = {
  chatLastUserText?: string;
  cronogramaText?: string;
};

export function endpointToStudentIaRole(endpoint: IaWalletBillableEndpoint): StudentIaModelRole {
  if (endpoint === "ia/chat") return "chat";
  if (endpoint === "academico/cronograma/ai") return "cronograma";
  return "heavy";
}

export async function resolveUserOrDefaultModel(
  userId: string,
  role: StudentIaModelRole,
  hint?: ResolveModelHint,
): Promise<string> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      iaModelChat: true,
      iaModelHeavy: true,
      iaModelCronograma: true,
      iaLlmModeChat: true,
      iaLlmModeHeavy: true,
      iaLlmModeCronograma: true,
    },
  });
  const mode =
    role === "chat"
      ? parseIaLlmMode(u?.iaLlmModeChat)
      : role === "heavy"
        ? parseIaLlmMode(u?.iaLlmModeHeavy)
        : parseIaLlmMode(u?.iaLlmModeCronograma);

  if (mode === IA_LLM_MODE.AUTO) {
    return resolveAutoModelForRole({
      userId,
      role,
      chatLastUserText: hint?.chatLastUserText,
      cronogramaText: hint?.cronogramaText,
    });
  }

  const raw = role === "chat" ? u?.iaModelChat : role === "heavy" ? u?.iaModelHeavy : u?.iaModelCronograma;
  return (await sanitizeModelForRoleAsync(role, raw)) ?? resolveStudentIaModel(role);
}

export async function resolveUserOrDefaultModelForEndpoint(
  userId: string,
  endpoint: IaWalletBillableEndpoint,
  hint?: ResolveModelHint,
): Promise<string> {
  return resolveUserOrDefaultModel(userId, endpointToStudentIaRole(endpoint), hint);
}
