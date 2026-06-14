import { NextRequest, NextResponse } from "next/server";
import { logAiUsage } from "@/lib/ai-usage";
import { assertCronogramaAiAccess } from "@/lib/cronograma-ai-access";
import { debitWalletForIa } from "@/lib/ia-wallet";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import { computeWalletChargeFromTokenUsage } from "@/lib/ia-usage-pricing";
import { settleSubscribedIaAfterCall } from "@/lib/ia-subscription-meter";
import { resolveUserOrDefaultModel } from "@/lib/ia-user-model";
import { createOpenAIForStudentIa, hasStudentIaLlmCredentials, STUDENT_IA_GATEWAY_KEY_HELP } from "@/lib/vercel-ia-gateway";

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
    if (!hasStudentIaLlmCredentials()) {
      return NextResponse.json({ error: STUDENT_IA_GATEWAY_KEY_HELP }, { status: 500 });
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
          },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const tz = (body?.timezone || "America/Caracas").trim();
    const now = new Date();

    const openai = createOpenAIForStudentIa();
    const model = await resolveUserOrDefaultModel(access.userId, "cronograma", {
      cronogramaText: text,
    });
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
    } else if (!access.subscription && typeof access.walletDiscountPercent === "number") {
      const chargeCents = computeWalletChargeFromTokenUsage({
        model,
        usage: resp.usage,
        discountPercent: access.walletDiscountPercent,
      });
      try {
        await debitWalletForIa({
          userId: access.userId,
          chargeCents,
          reason: "academico/cronograma/ai",
          meta: { model, usage: resp.usage, op: "parse" },
        });
      } catch (e) {
        console.error("[cronograma-ai-parse] wallet debit", e);
      }
    }

    return NextResponse.json({ events: normalized });
  } catch (e) {
    console.error("[cronograma-ai-parse:post]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  });
}

