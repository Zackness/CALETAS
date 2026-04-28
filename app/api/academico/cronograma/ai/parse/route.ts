import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { assertAiTrialAllowed } from "@/lib/ai-trial";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ProposedEvent = {
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  allDay?: boolean;
  description?: string | null;
  location?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const sub = await getActiveSubscriptionForUser(session.user.id);
    const hasSubscription = !!sub;
    if (!hasSubscription) {
      const gate = await assertAiTrialAllowed({ userId: session.user.id, endpoint: "academico/cronograma/ai" });
      if (!gate.ok) {
        return NextResponse.json(
          { error: gate.error, code: "FREE_LIMIT_REACHED", endpoint: "academico/cronograma/ai", limit: gate.info.limit },
          { status: 402 },
        );
      }
    }

    const body = (await request.json().catch(() => null)) as { text?: string; timezone?: string } | null;
    const text = (body?.text || "").trim();
    if (!text) return NextResponse.json({ error: "Texto requerido" }, { status: 400 });

    const tz = (body?.timezone || "America/Caracas").trim();
    const now = new Date();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      userId: session.user.id,
      endpoint: "academico/cronograma/ai",
      usage: resp.usage ?? null,
    });

    return NextResponse.json({ events: normalized });
  } catch (e) {
    console.error("[cronograma-ai-parse:post]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

