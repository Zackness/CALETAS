import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai/uploads";

import { assertCronogramaAiAccess } from "@/lib/cronograma-ai-access";
import { logAiUsage } from "@/lib/ai-usage";
import { coerceToDirectOpenAiModel } from "@/lib/ia-models";
import {
  estimateCronogramaTranscribeTokenEquivalent,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { settleNonSubscriptionIaAfterCall } from "@/lib/ia-non-sub-settle";
import { resolveWhisperModelId } from "@/lib/ia-models";
import { createDirectOpenAIForStudentIa } from "@/lib/vercel-ia-gateway";

const MAX_BYTES = 24 * 1024 * 1024; // Whisper límite práctico ~25MB

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ error: "Configura OPENAI_API_KEY para usar tu API de ChatGPT." }, { status: 500 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Archivo de audio requerido (campo \"audio\")" }, { status: 400 });
    }
    if (audio.size < 512) {
      return NextResponse.json({ error: "Audio demasiado corto" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "Audio demasiado grande (máx. ~24 MB)" }, { status: 400 });
    }

    const access = await assertCronogramaAiAccess(request, { transcribeAudioBytes: audio.size });
    if (!access.ok) {
      if (access.status === 402) {
        return NextResponse.json(
          {
            error: access.error,
            code: access.code ?? "FREE_LIMIT_REACHED",
            endpoint: "academico/cronograma/ai",
            resetsAt: access.resetsAt,
            resetsAtLabel: access.resetsAtLabel,
          },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const buf = Buffer.from(await audio.arrayBuffer());
    const mime = audio.type || "audio/webm";
    const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "m4a" : "webm";
    const file = await toFile(buf, `grabacion.${ext}`, { type: mime });

    const whisperModel = coerceToDirectOpenAiModel(
      resolveWhisperModelId(),
      process.env.IA_OPENAI_MODEL_WHISPER?.trim() || "whisper-1",
    );
    const openai = createDirectOpenAIForStudentIa();

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: whisperModel,
      language: "es",
    });

    const text = (transcription.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "No se pudo transcribir el audio" }, { status: 422 });
    }

    logAiUsage({
      userId: access.userId,
      endpoint: "academico/cronograma/ai",
      usage: null,
    });

    const tokenEq = estimateCronogramaTranscribeTokenEquivalent(audio.size);

    if (access.subscription && access.subscriptionIaGate) {
      await settleSubscribedIaAfterCall({
        userSubId: access.subscription.id,
        userId: access.userId,
        model: whisperModel,
        endpoint: "academico/cronograma/ai",
        reason: "academico/cronograma/ai",
        gate: access.subscriptionIaGate,
        usage: null,
        billableTokensOverride: tokenEq,
        transcribeAudioBytes: audio.size,
      });
    } else if (!access.subscription && access.nonSubMode) {
      await settleNonSubscriptionIaAfterCall({
        userId: access.userId,
        endpoint: "academico/cronograma/ai",
        model: whisperModel,
        nonSubAccess: {
          ok: true,
          mode: access.nonSubMode,
          info: { used: 0, limit: 0, remaining: 0 },
          walletDiscountPercent: access.walletDiscountPercent,
        },
        usage: null,
        fallbackTokens: tokenEq,
      });
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("[cronograma-ai-transcribe:post]", e);
    return NextResponse.json({ error: "Error interno al transcribir" }, { status: 500 });
  }
}
