import { logAiUsage } from "@/lib/ai-usage";
import { createOpenAIForStudentIa, isIaGatewayEnabled } from "@/lib/vercel-ia-gateway";

const VISION_EXTRACT_MAX_IMAGES = 8;

function visionExtractModelId(): string {
  const fromEnv = process.env.IA_VISION_EXTRACT_MODEL?.trim();
  if (fromEnv) return fromEnv;
  return isIaGatewayEnabled() ? "google/gemini-2.5-flash-lite" : "gpt-4o-mini";
}

type VisionImage = {
  buffer: Buffer;
  mimeType: string;
  label: string;
};

export async function extractAcademicContentFromImages(
  images: VisionImage[],
  options?: { userId?: string; sourceLabel?: string },
): Promise<string | null> {
  const batch = images.slice(0, VISION_EXTRACT_MAX_IMAGES);
  if (!batch.length) return null;

  const model = visionExtractModelId();
  const openai = createOpenAIForStudentIa(model);

  const intro =
    options?.sourceLabel ??
    "Documento académico (páginas escaneadas o con imágenes/diagramas).";

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
  > = [
    {
      type: "text",
      text: [
        intro,
        "",
        "Para cada imagen adjunta, extrae TODO el texto legible (OCR) y describe brevemente diagramas, tablas, gráficos o figuras relevantes para estudiar.",
        "Responde en español. Usa el formato:",
        "## Página N (o imagen N)",
        "Texto: …",
        "Elementos visuales: …",
        "",
        "Si no hay texto, indícalo y describe solo lo visual.",
      ].join("\n"),
    },
    ...batch.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mimeType};base64,${img.buffer.toString("base64")}`,
        detail: "low" as const,
      },
    })),
  ];

  try {
    const resp = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que transcribe y resume material académico universitario a partir de imágenes. Sé fiel al contenido visible; no inventes.",
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 3500,
    });

    if (options?.userId) {
      logAiUsage({
        userId: options.userId,
        endpoint: "ia/chat/caleta-vision",
        usage: resp.usage ?? null,
      });
    }

    const text = resp.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.warn("[ia-vision-extract]", e);
    return null;
  }
}
