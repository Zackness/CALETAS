import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY no está configurada" }, { status: 500 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);
    if (!sub) {
      return NextResponse.json(
        { error: "Necesitas una suscripción activa para usar IA" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as { messages?: ChatMessage[] };
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

    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Envía al menos un mensaje de usuario" }, { status: 400 });
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

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const answer = resp.choices[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "No se pudo generar respuesta" }, { status: 500 });
    }

    return NextResponse.json({
      message: answer,
      careerName: careerName || null,
    });
  } catch (error) {
    console.error("Error in /api/ia/chat:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

