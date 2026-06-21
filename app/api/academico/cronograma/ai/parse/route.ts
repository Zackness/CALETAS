import { NextRequest, NextResponse } from "next/server";
import { logAiUsage } from "@/lib/ai-usage";
import { assertCronogramaAiAccess } from "@/lib/cronograma-ai-access";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import { coerceToDirectOpenAiModel } from "@/lib/ia-models";
import { settleSubscribedIaAfterCall } from "@/lib/ia-subscription-meter";
import { settleNonSubscriptionIaAfterCall } from "@/lib/ia-non-sub-settle";
import { resolveModelForIaCall } from "@/lib/ia-user-model";
import { createDirectOpenAIForStudentIa } from "@/lib/vercel-ia-gateway";

type ProposedEvent = {
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  allDay?: boolean;
  description?: string | null;
  location?: string | null;
};

export async function POST(request: NextRequest) {
  return withIaGatewayRatesForRequest(async () => {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ error: "Configura OPENAI_API_KEY para usar tu API de ChatGPT." }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as { text?: string; timezone?: string } | null;
    const text = (body?.text || "").trim();
    if (!text) return NextResponse.json({ error: "Texto requerido" }, { status: 400 });

    const access = await assertCronogramaAiAccess(request, { cronogramaParseText: text });
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

    const tz = (body?.timezone || "America/Caracas").trim();
    const now = new Date();

    const preferredModel = await resolveModelForIaCall({
      userId: access.userId,
      role: "cronograma",
      nonSubMode: access.nonSubMode === "free_tier" ? "free_tier" : access.nonSubMode === "wallet" ? "wallet" : null,
      hint: { cronogramaText: text },
    });
    const model = coerceToDirectOpenAiModel(
      preferredModel,
      process.env.IA_OPENAI_MODEL_CRONOGRAMA?.trim() || "gpt-4o-mini",
    );
    const openai = createDirectOpenAIForStudentIa();
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "Eres un asistente que convierte texto en eventos de calendario.",
            "Devuelve SOLO JSON válido con la forma: {\"events\": ProposedEvent[]} sin markdown.",
            "Reglas:",
            `- Usa timezone '${tz}'.`,
            "- Si el usuario no da hora, asume eventos 'allDay': true con startAt 00:00 y endAt 23:59 del mismo día.",
            "- Si da rango de horas, crea startAt/endAt acorde.",
            "- Si el texto es ambiguo, genera el mejor guess con fechas relativas basadas en 'now'.",
            "- Máximo 12 eventos.",
            `Now: ${now.toISOString()}`,
          ].join("\n"),
        },
        { role: "user", content: text },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content ?? "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback: intentar extraer bloque json
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const events = Array.isArray(parsed?.events) ? (parsed.events as ProposedEvent[]) : [];
    const normalized = events
      .slice(0, 12)
      .map((e) => ({
        title: String(e?.title || "").trim(),
        startAt: String(e?.startAt || "").trim(),
        endAt: String(e?.endAt || "").trim(),
        allDay: !!e?.allDay,
        description: e?.description ? String(e.description).trim() : null,
        location: e?.location ? String(e.location).trim() : null,
      }))
      .filter((e) => e.title && e.startAt && e.endAt);

    logAiUsage({
      userId: access.userId,
      endpoint: "academico/cronograma/ai",
      usage: resp.usage ?? null,
    });

    if (access.subscription && access.subscriptionIaGate) {
      await settleSubscribedIaAfterCall({
        userSubId: access.subscription.id,
        userId: access.userId,
        model,
        endpoint: "academico/cronograma/ai",
        reason: "academico/cronograma/ai",
        gate: access.subscriptionIaGate,
        usage: resp.usage ?? null,
      });
    } else if (!access.subscription && access.nonSubMode) {
      await settleNonSubscriptionIaAfterCall({
        userId: access.userId,
        endpoint: "academico/cronograma/ai",
        model,
        nonSubAccess: {
          ok: true,
          mode: access.nonSubMode,
          info: { used: 0, limit: 0, remaining: 0 },
          walletDiscountPercent: access.walletDiscountPercent,
        },
        usage: resp.usage ?? null,
      });
    }

    return NextResponse.json({ events: normalized });
  } catch (e) {
    console.error("[cronograma-ai-parse:post]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  });
}
