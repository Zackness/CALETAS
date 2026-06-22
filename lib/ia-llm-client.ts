import { coerceToDirectOpenAiModel, resolveWhisperModelId } from "@/lib/ia-models";
import {
  createDirectOpenAIForStudentIa,
  createOpenAIForStudentIa,
  hasStudentIaLlmCredentials,
  isIaGatewayEnabled,
} from "@/lib/vercel-ia-gateway";
import type OpenAI from "openai";

/** Cliente LLM según Gateway (proveedor/modelo) u OpenAI directo. */
export function createLlmClientForModel(modelId: string): OpenAI {
  if (isIaGatewayEnabled() || modelId.includes("/")) {
    return createOpenAIForStudentIa(modelId);
  }
  return createDirectOpenAIForStudentIa();
}

/** Whisper: Gateway usa openai/whisper-1; sin Gateway, API directa. */
export function createWhisperClient(): { client: OpenAI; model: string } {
  const modelId = resolveWhisperModelId();
  if (isIaGatewayEnabled()) {
    return { client: createOpenAIForStudentIa(modelId), model: modelId };
  }
  const model = coerceToDirectOpenAiModel(modelId, "whisper-1");
  return { client: createDirectOpenAIForStudentIa(), model };
}

export { hasStudentIaLlmCredentials };
