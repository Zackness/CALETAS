import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { canUseIAChat, getActiveSubscriptionForUser } from "@/lib/subscription";
import { logAiUsage } from "@/lib/ai-usage";
import { assertTrialReferralOrWalletForIa } from "@/lib/ai-trial";
import { debitWalletForIa } from "@/lib/ia-wallet";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import { getActiveReferralBoostForUser } from "@/lib/referral-boost";
import { computeWalletChargeFromTokenUsage } from "@/lib/ia-usage-pricing";
import {
  assertSubscriptionIaTokenGate,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { resolveUserOrDefaultModel } from "@/lib/ia-user-model";
import { createOpenAIForStudentIa, hasStudentIaLlmCredentials, STUDENT_IA_GATEWAY_KEY_HELP } from "@/lib/vercel-ia-gateway";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function parseTaskIntent(text: string): { title: string; description?: string } | null {
  const raw = text.trim();
  const lowered = raw.toLowerCase();
  const wantsTask =
    lowered.startsWith("crear tarea") ||
    lowered.startsWith("crea tarea") ||
    lowered.startsWith("agrega tarea") ||
    lowered.startsWith("anota tarea") ||
    lowered.includes(" crear tarea ") ||
    lowered.includes(" agrega tarea ");

  if (!wantsTask) return null;

  const explicit = raw.match(/(?:crear|crea|agrega|anota)\s+tarea\s*:\s*(.+)$/i);
  if (explicit?.[1]?.trim()) {
    return { title: explicit[1].trim() };
  }

  const quoted = raw.match(/"([^"]+)"/);
  if (quoted?.[1]?.trim()) {
    return { title: quoted[1].trim() };
  }

  const fallback = raw
    .replace(/^(crear|crea|agrega|anota)\s+tarea\s*/i, "")
    .replace(/^[:\-]\s*/, "")
    .trim();
  if (fallback.length >= 3) return { title: fallback };

  return null;
}

const normalizeCareer = (name?: string | null) => (name || "").trim();

const careerPrompt = (careerName: string) => {
  const c = careerName.toLowerCase();

  if (!careerName) {
    return [
      "El estudiante no tiene carrera registrada.",
      "Aun así, da explicaciones universitarias claras, paso a paso, con ejemplos y ejercicios.",
    ].join("\n");
  }

  if (c.includes("derecho") || c.includes("legal") || c.includes("abog")) {
    return [
      `Carrera: ${careerName}.`,
      "Enfócate en: conceptos jurídicos, estructura IRAC, doctrina/jurisprudencia, redacción de argumentos, y ejemplos de casos.",
      "Evita dar 'asesoría legal' como si fueras su abogado: mantén un tono educativo y sugiere consultar fuentes/localidad.",
    ].join("\n");
  }

  if (
    c.includes("mecatr") ||
    c.includes("electr") ||
    c.includes("electron") ||
    c.includes("industrial") ||
    c.includes("sistemas") ||
    c.includes("informat") ||
    c.includes("comput") ||
    c.includes("telecom")
  ) {
    return [
      `Carrera: ${careerName}.`,
      "Enfócate en: razonamiento técnico, fórmulas, supuestos, pasos de cálculo, y buenas prácticas de ingeniería.",
      "Incluye ejemplos numéricos, pseudocódigo o diagramas ASCII cuando ayuden.",
    ].join("\n");
  }

  if (c.includes("medic") || c.includes("enferm") || c.includes("odont") || c.includes("salud")) {
    return [
      `Carrera: ${careerName}.`,
      "Enfócate en: anatomía/fisiología, protocolos clínicos a nivel académico, y razonamiento diagnóstico (sin reemplazar un médico).",
      "Si piden consejos para un caso real, advierte que es información educativa y recomiendas consultar un profesional.",
    ].join("\n");
  }

  if (c.includes("admin") || c.includes("cont") || c.includes("finan") || c.includes("econom")) {
    return [
      `Carrera: ${careerName}.`,
      "Enfócate en: ejemplos aplicados, métricas, estados financieros, micro/macro, y toma de decisiones.",
    ].join("\n");
  }

  return [
    `Carrera: ${careerName}.`,
    "Adapta tus ejemplos y analogías al contexto típico de esa carrera, manteniendo rigor universitario.",
  ].join("\n");
};

const buildSystemPrompt = (careerName: string) => {
  return [
    "Eres un chatbot tutor universitario de Caletas.",
    "Responde SIEMPRE en español.",
    "Objetivo: ayudar a estudiar, entender y practicar temas académicos de forma clara y accionable.",
    "Reglas:",
    "- Si el usuario no especifica materia/tema, pregunta 1-2 aclaraciones cortas (semestre, materia, nivel, objetivo).",
    "- Da respuestas estructuradas: explicación breve, pasos, ejemplo(s), y 3-5 preguntas de práctica cuando aplique.",
    "- Si el usuario pega un enunciado largo, resume y verifica supuestos antes de resolver.",
    "- No inventes datos del pensum del usuario; si falta contexto, pregunta.",
    "",
    careerPrompt(careerName),
  ].join("\n");
};

export async function POST(request: NextRequest) {
  return withIaGatewayRatesForRequest(async () => {
  try {
    if (!hasStudentIaLlmCredentials()) {
      return withCors(
        NextResponse.json(
          {
            error: STUDENT_IA_GATEWAY_KEY_HELP,
          },
          { status: 500 },
        ),
        request,
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }
    const sub = await getActiveSubscriptionForUser(session.user.id);
    const referralBoost = await getActiveReferralBoostForUser(session.user.id);
    const hasReferralIaDay = !!referralBoost;
    const hasSubscription = !!sub;
    let subscriptionIaGate: Awaited<ReturnType<typeof assertSubscriptionIaTokenGate>> | null = null;

    let nonSubIaAccess: Awaited<ReturnType<typeof assertTrialReferralOrWalletForIa>> | null = null;

    if (hasReferralIaDay) {
      // Día de IA completo (referidos): chat incluido con límites amplios.
    } else if (!hasSubscription) {
      nonSubIaAccess = await assertTrialReferralOrWalletForIa({ userId: session.user.id, endpoint: "ia/chat" });
      if (!nonSubIaAccess.ok) {
        return withCors(
          NextResponse.json(
            {
              error: nonSubIaAccess.error,
              code: nonSubIaAccess.code ?? "FREE_LIMIT_REACHED",
              endpoint: "ia/chat",
              limit: nonSubIaAccess.limit,
            },
            { status: 402 },
          ),
          request,
        );
      }
    } else if (!canUseIAChat(sub)) {
      return withCors(
        NextResponse.json(
          { error: "Tu plan actual no incluye Chat IA. Puedes usar las otras herramientas IA." },
          { status: 403 },
        ),
        request,
      );
    }

    const body = (await request.json()) as { messages?: ChatMessage[]; projectContext?: string };
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const messages = incoming
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }))
      .slice(-20);
    const projectContext =
      typeof body.projectContext === "string" ? body.projectContext.slice(0, 20000) : "";

    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return withCors(NextResponse.json({ error: "Envía al menos un mensaje de usuario" }, { status: 400 }), request);
    }

    const lastUserContent = messages.filter((m) => m.role === "user").pop()?.content;
    const model = await resolveUserOrDefaultModel(session.user.id, "chat", {
      chatLastUserText: typeof lastUserContent === "string" ? lastUserContent : undefined,
    });
    if (hasSubscription && sub) {
      const gate = await assertSubscriptionIaTokenGate({
        userId: session.user.id,
        userSubId: sub.id,
        plan: sub.subscriptionType,
        endpoint: "ia/chat",
        modelId: model,
      });
      if (!gate.ok) {
        return withCors(
          NextResponse.json(
            { error: gate.error, code: gate.code, endpoint: "ia/chat" },
            { status: 402 },
          ),
          request,
        );
      }
      subscriptionIaGate = gate;
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        carrera: {
          select: { nombre: true },
        },
      },
    });

    const careerName = normalizeCareer(user?.carrera?.nombre);
    const system = buildSystemPrompt(careerName);
    const systemWithContext = projectContext
      ? `${system}\n\nContexto adicional del proyecto (archivos subidos por el estudiante):\n${projectContext}\n\nUsa este contexto cuando sea relevante y cita el nombre del archivo si te basas en él.`
      : system;

    const taskIntent = parseTaskIntent(lastUserContent || "");
    if (taskIntent) {
      const created = await db.caletaTask.create({
        data: {
          userId: session.user.id,
          title: taskIntent.title,
          description: taskIntent.description?.trim() || null,
          status: "PENDIENTE",
          priority: "MEDIA",
        },
      });
      return withCors(
        NextResponse.json({
          message: `Listo. Cree la tarea \"${created.title}\" en tu tablero de Tareas y notas. Puedes verla en /tareas.`,
          careerName: careerName || null,
          action: { type: "task_created", taskId: created.id, link: "/tareas" },
        }),
        request,
      );
    }

    const openai = createOpenAIForStudentIa();
    const resp = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemWithContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.4,
      max_tokens: !hasSubscription && !hasReferralIaDay ? 450 : 1200,
    });

    const answer = resp.choices[0]?.message?.content?.trim();
    if (!answer) {
      return withCors(NextResponse.json({ error: "No se pudo generar respuesta" }, { status: 500 }), request);
    }
    logAiUsage({ userId: session.user.id, endpoint: "ia/chat", usage: resp.usage ?? null });
    if (hasSubscription && sub && subscriptionIaGate) {
      await settleSubscribedIaAfterCall({
        userSubId: sub.id,
        userId: session.user.id,
        model,
        endpoint: "ia/chat",
        reason: "ia/chat",
        gate: subscriptionIaGate,
        usage: resp.usage ?? null,
      });
    } else if (!hasSubscription && nonSubIaAccess?.ok && nonSubIaAccess.mode === "wallet") {
      const d = nonSubIaAccess.walletDiscountPercent ?? 0;
      const chargeCents = computeWalletChargeFromTokenUsage({
        model,
        usage: resp.usage,
        discountPercent: d,
      });
      try {
        await debitWalletForIa({
          userId: session.user.id,
          chargeCents,
          reason: "ia/chat",
          meta: { model, usage: resp.usage },
        });
      } catch (e) {
        console.error("[ia/chat] wallet debit", e);
      }
    }
    return withCors(NextResponse.json({ message: answer, careerName: careerName || null }), request);
  } catch (error) {
    console.error("Error in /api/ia/chat:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
  });
}
