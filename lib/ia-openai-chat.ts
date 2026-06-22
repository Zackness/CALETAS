import type OpenAI from "openai";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

type ChatMessage = ChatCompletionMessageParam;

export type StudentIaChatCompletionBase = {
  model: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
};

function usesMaxCompletionTokens(model: string): boolean {
  const m = model.toLowerCase();
  return (
    m.startsWith("openai/gpt-5") ||
    m.startsWith("openai/o1") ||
    m.startsWith("openai/o3") ||
    m.startsWith("openai/o4") ||
    m === "o1" ||
    m === "o1-mini" ||
    m.startsWith("o3")
  );
}

function supportsTemperature(model: string): boolean {
  const m = model.toLowerCase();
  if (usesMaxCompletionTokens(model)) return false;
  if (m.includes("o1") || m.includes("o3") || m.includes("o4")) return false;
  return true;
}

/** Solo OpenAI nativo/Gateway suele aceptar stream_options.include_usage de forma fiable. */
function supportsStreamUsage(model: string): boolean {
  const m = model.toLowerCase();
  if (!m.includes("/")) return true;
  return m.startsWith("openai/");
}

function applyTokenLimit(
  target: ChatCompletionCreateParamsStreaming | ChatCompletionCreateParamsNonStreaming,
  model: string,
  maxOutputTokens: number,
): void {
  if (usesMaxCompletionTokens(model)) {
    target.max_completion_tokens = maxOutputTokens;
    delete target.max_tokens;
  } else {
    target.max_tokens = maxOutputTokens;
    delete target.max_completion_tokens;
  }
}

function buildStreamingVariants(
  base: StudentIaChatCompletionBase,
): ChatCompletionCreateParamsStreaming[] {
  const variants: ChatCompletionCreateParamsStreaming[] = [];
  const temps = supportsTemperature(base.model) ? [0.4, undefined] : [undefined];

  for (const temperature of temps) {
    for (const withUsage of supportsStreamUsage(base.model) ? [true, false] : [false]) {
      const params: ChatCompletionCreateParamsStreaming = {
        model: base.model,
        messages: base.messages,
        stream: true,
      };
      applyTokenLimit(params, base.model, base.maxOutputTokens);
      if (temperature !== undefined) params.temperature = temperature;
      if (withUsage) params.stream_options = { include_usage: true };
      variants.push(params);
    }
  }

  const alt: ChatCompletionCreateParamsStreaming = {
    model: base.model,
    messages: base.messages,
    stream: true,
  };
  if (usesMaxCompletionTokens(base.model)) {
    alt.max_tokens = base.maxOutputTokens;
    delete alt.max_completion_tokens;
  } else {
    alt.max_completion_tokens = base.maxOutputTokens;
    delete alt.max_tokens;
  }
  if (supportsTemperature(base.model)) alt.temperature = 0.4;
  variants.push(alt);

  const seen = new Set<string>();
  return variants.filter((v) => {
    const key = JSON.stringify(v);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildNonStreamingVariants(
  base: StudentIaChatCompletionBase,
): ChatCompletionCreateParamsNonStreaming[] {
  const params: ChatCompletionCreateParamsNonStreaming = {
    model: base.model,
    messages: base.messages,
    stream: false,
  };
  applyTokenLimit(params, base.model, base.maxOutputTokens);
  if (supportsTemperature(base.model)) params.temperature = 0.4;

  const alt: ChatCompletionCreateParamsNonStreaming = {
    model: base.model,
    messages: base.messages,
    stream: false,
  };
  if (usesMaxCompletionTokens(base.model)) {
    alt.max_tokens = base.maxOutputTokens;
  } else {
    alt.max_completion_tokens = base.maxOutputTokens;
  }
  if (supportsTemperature(base.model)) alt.temperature = 0.4;

  return [params, alt];
}

function isRetryableCompletionError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const m = error.message.toLowerCase();
  return (
    m.includes("stream_options") ||
    m.includes("max_tokens") ||
    m.includes("max_completion_tokens") ||
    m.includes("temperature") ||
    m.includes("unsupported") ||
    m.includes("not support") ||
    m.includes("unknown parameter") ||
    m.includes("invalid parameter")
  );
}

/** Mensaje seguro para mostrar al estudiante (sin filtrar secretos). */
export function clientSafeIaError(error: unknown, model?: string): string {
  if (!(error instanceof Error)) return "No se pudo contactar con el servicio de IA. Intenta de nuevo.";
  const m = error.message.trim();
  const lower = m.toLowerCase();

  if (/api key|authentication|401|unauthorized|invalid.*key/i.test(m)) {
    return "La IA no está configurada correctamente en el servidor. Avísanos si el problema continúa.";
  }
  if (/rate limit|429|too many requests/i.test(m)) {
    return "Hay muchas solicitudes ahora mismo. Espera unos segundos e inténtalo otra vez.";
  }
  if (/model.*not found|does not exist|unknown model|invalid model/i.test(m)) {
    return model
      ? `El modelo ${model} no está disponible. Elige otro modelo gratis en el selector.`
      : "El modelo seleccionado no está disponible. Prueba otro en el selector de IA.";
  }
  if (/insufficient|quota|billing|payment/i.test(m)) {
    return "No hay cupo para ese modelo. Usa un modelo gratis o recarga tu billetera.";
  }
  if (/timeout|timed out|deadline/i.test(m)) {
    return "La respuesta tardó demasiado. Intenta con un mensaje más corto o otro modelo.";
  }
  if (m.length > 0 && m.length <= 220 && !lower.includes("stack")) return m;
  return "No se pudo completar la respuesta con la IA. Prueba otro modelo o reintenta en unos segundos.";
}

export async function createStudentIaChatStream(
  openai: OpenAI,
  base: StudentIaChatCompletionBase,
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const variants = buildStreamingVariants(base);
  let lastError: unknown;

  for (const params of variants) {
    try {
      return await openai.chat.completions.create(params);
    } catch (e) {
      lastError = e;
      if (!isRetryableCompletionError(e)) break;
      console.warn("[ia-chat] reintentando stream con otros parámetros:", {
        model: base.model,
        error: e instanceof Error ? e.message : e,
      });
    }
  }

  throw lastError ?? new Error("No se pudo iniciar el stream de IA");
}

export async function createStudentIaChatCompletion(
  openai: OpenAI,
  base: StudentIaChatCompletionBase,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const variants = buildNonStreamingVariants(base);
  let lastError: unknown;

  for (const params of variants) {
    try {
      return await openai.chat.completions.create(params);
    } catch (e) {
      lastError = e;
      if (!isRetryableCompletionError(e)) break;
    }
  }

  throw lastError ?? new Error("No se pudo completar la solicitud de IA");
}
