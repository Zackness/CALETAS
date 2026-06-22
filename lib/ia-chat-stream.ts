/** Protocolo NDJSON para streaming del chat IA. */

export type IaChatStreamEvent =
  | { t: "s"; v: string }
  | { t: "think"; v: string }
  | { t: "d"; v: string }
  | { t: "done"; careerName?: string | null }
  | { t: "err"; v: string; code?: string };

export type IaChatStreamCallbacks = {
  onStatus?: (status: string) => void;
  onThinking?: (accumulated: string, delta: string) => void;
  onDelta?: (accumulated: string, delta: string) => void;
};

export function encodeIaChatStreamEvent(event: IaChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export class IaChatStreamAbortedError extends Error {
  readonly partialText: string;
  readonly partialThinking: string;

  constructor(partialText: string, partialThinking = "") {
    super("Generación detenida");
    this.name = "IaChatStreamAbortedError";
    this.partialText = partialText;
    this.partialThinking = partialThinking;
  }
}

function isAbortError(e: unknown): boolean {
  if (e instanceof IaChatStreamAbortedError) return true;
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.name === "AbortError") return true;
  return false;
}

function normalizeCallbacks(
  callbacks: IaChatStreamCallbacks | ((accumulated: string, delta: string) => void),
): IaChatStreamCallbacks {
  if (typeof callbacks === "function") {
    return { onDelta: callbacks };
  }
  return callbacks;
}

export async function readIaChatStream(
  body: ReadableStream<Uint8Array>,
  callbacks: IaChatStreamCallbacks | ((accumulated: string, delta: string) => void),
  signal?: AbortSignal,
): Promise<{ text: string; thinking: string; careerName: string | null }> {
  const { onStatus, onThinking, onDelta } = normalizeCallbacks(callbacks);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let thinking = "";
  let careerName: string | null = null;

  const onAbort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort);

  try {
    while (true) {
      if (signal?.aborted) {
        throw new IaChatStreamAbortedError(text, thinking);
      }

      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = JSON.parse(line) as IaChatStreamEvent;
        if (evt.t === "s" && typeof evt.v === "string") {
          onStatus?.(evt.v);
        } else if (evt.t === "think" && typeof evt.v === "string") {
          thinking += evt.v;
          onThinking?.(thinking, evt.v);
        } else if (evt.t === "d" && typeof evt.v === "string") {
          text += evt.v;
          onDelta?.(text, evt.v);
        } else if (evt.t === "done") {
          careerName = evt.careerName ?? null;
        } else if (evt.t === "err") {
          const err = new Error(evt.v || "Error en el stream");
          (err as Error & { code?: string }).code = evt.code;
          throw err;
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  if (signal?.aborted) {
    throw new IaChatStreamAbortedError(text, thinking);
  }

  if (!text.trim()) {
    throw new Error("Respuesta vacía del servidor");
  }

  return { text: text.trim(), thinking: thinking.trim(), careerName };
}

export { isAbortError };
