/** Protocolo NDJSON para streaming del chat IA. */

export type IaChatStreamEvent =
  | { t: "d"; v: string }
  | { t: "done"; careerName?: string | null }
  | { t: "err"; v: string; code?: string };

export function encodeIaChatStreamEvent(event: IaChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export class IaChatStreamAbortedError extends Error {
  readonly partialText: string;

  constructor(partialText: string) {
    super("Generación detenida");
    this.name = "IaChatStreamAbortedError";
    this.partialText = partialText;
  }
}

function isAbortError(e: unknown): boolean {
  if (e instanceof IaChatStreamAbortedError) return true;
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.name === "AbortError") return true;
  return false;
}

export async function readIaChatStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (accumulated: string, delta: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; careerName: string | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let careerName: string | null = null;

  const onAbort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort);

  try {
    while (true) {
      if (signal?.aborted) {
        throw new IaChatStreamAbortedError(text);
      }

      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = JSON.parse(line) as IaChatStreamEvent;
        if (evt.t === "d" && typeof evt.v === "string") {
          text += evt.v;
          onDelta(text, evt.v);
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
    throw new IaChatStreamAbortedError(text);
  }

  if (!text.trim()) {
    throw new Error("Respuesta vacía del servidor");
  }

  return { text: text.trim(), careerName };
}

export { isAbortError };
