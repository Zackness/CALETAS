import OpenAI from "openai";

/** Base URL OpenAI-compatible del [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). */
export const VERCEL_AI_GATEWAY_DEFAULT_BASE = "https://ai-gateway.vercel.sh/v1";

/**
 * Clave del AI Gateway (Bearer). Orden: `AI_GATEWAY_API_KEY` → `GATEWAY_API_KEY` → `VERCEL_AI_GATEWAY_API_KEY`.
 * Cualquiera activa el modo Gateway (modelos `proveedor/modelo`).
 */
export function getIaGatewayApiKey(): string | undefined {
  const a = process.env.AI_GATEWAY_API_KEY?.trim();
  if (a) return a;
  const b = process.env.GATEWAY_API_KEY?.trim();
  if (b) return b;
  const c = process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
  if (c) return c;
  return undefined;
}

/** Texto único para respuestas 500 / errores de configuración (mantener alineado en rutas IA). */
export const STUDENT_IA_GATEWAY_KEY_HELP =
  "Configura AI_GATEWAY_API_KEY, GATEWAY_API_KEY o VERCEL_AI_GATEWAY_API_KEY (Vercel AI Gateway) u OPENAI_API_KEY (OpenAI directo).";

/** Modelos multi-proveedor (`openai/gpt-5`, `anthropic/claude-*`) solo funcionan vía AI Gateway. */
export function modelIdRequiresGateway(modelId: string): boolean {
  return modelId.includes("/");
}

export function assertGatewayConfiguredForModel(modelId: string): void {
  if (modelIdRequiresGateway(modelId) && !isIaGatewayEnabled()) {
    throw new Error(
      `${modelId} requiere Vercel AI Gateway. Configura AI_GATEWAY_API_KEY en el servidor (los modelos GPT-5 y Claude no funcionan solo con OPENAI_API_KEY).`,
    );
  }
}

export function isIaGatewayEnabled(): boolean {
  return !!getIaGatewayApiKey();
}

/** True si hay al menos una clave para LLM (Gateway o OpenAI directo). */
export function hasStudentIaLlmCredentials(): boolean {
  return isIaGatewayEnabled() || !!process.env.OPENAI_API_KEY?.trim();
}

/**
 * Cliente OpenAI SDK apuntando al AI Gateway cuando hay clave de Gateway;
 * si no, al API oficial de OpenAI.
 * @param modelId Si se indica un id `proveedor/modelo`, exige clave de Gateway.
 */
export function createOpenAIForStudentIa(modelId?: string): OpenAI {
  if (modelId) assertGatewayConfiguredForModel(modelId);
  const gatewayKey = getIaGatewayApiKey();
  if (gatewayKey) {
    return new OpenAI({
      apiKey: gatewayKey,
      baseURL: process.env.VERCEL_AI_GATEWAY_BASE_URL?.trim() || VERCEL_AI_GATEWAY_DEFAULT_BASE,
    });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(STUDENT_IA_GATEWAY_KEY_HELP);
  }
  return new OpenAI({ apiKey: key });
}

export function createDirectOpenAIForStudentIa(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Configura OPENAI_API_KEY para usar tu API de ChatGPT.");
  }
  return new OpenAI({ apiKey: key });
}
