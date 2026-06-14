import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai/uploads";

import { assertCronogramaAiAccess } from "@/lib/cronograma-ai-access";
import { logAiUsage } from "@/lib/ai-usage";
import { debitWalletForIa } from "@/lib/ia-wallet";
import { computeWalletChargeTranscribe } from "@/lib/ia-usage-pricing";
import {
  estimateCronogramaTranscribeTokenEquivalent,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { resolveWhisperModelId } from "@/lib/ia-models";
import { createOpenAIForStudentIa, hasStudentIaLlmCredentials, STUDENT_IA_GATEWAY_KEY_HELP } from "@/lib/vercel-ia-gateway";

const MAX_BYTES = 24 * 1024 * 1024; // Whisper límite práctico ~25MB

export async function POST(request: NextRequest) {
  try {
    if (!hasStudentIaLlmCredentials()) {
      return NextResponse.json({ error: STUDENT_IA_GATEWAY_KEY_HELP }, { status: 500 });
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

    const openai = createOpenAIForStudentIa();
    const whisperModel = resolveWhisperModelId();

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
    } else if (!access.subscription && typeof access.walletDiscountPercent === "number") {
      const chargeCents = computeWalletChargeTranscribe({
        audioBytes: audio.size,
        discountPercent: access.walletDiscountPercent,
      });
      try {
        await debitWalletForIa({
          userId: access.userId,
          chargeCents,
          reason: "academico/cronograma/ai",
          meta: { op: "transcribe", audioBytes: audio.size, model: whisperModel },
        });
      } catch (e) {
        console.error("[cronograma-ai-transcribe] wallet debit", e);
      }
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("[cronograma-ai-transcribe:post]", e);
    return NextResponse.json({ error: "Error interno al transcribir" }, { status: 500 });
  }
}
