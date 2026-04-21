import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function requireOwner(headers: Headers, id: string) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const, userId: null as string | null };
  const doc = await db.tesisDocumento.findUnique({ where: { id }, select: { ownerId: true } });
  if (!doc) return { ok: false as const, status: 404 as const, userId: session.user.id };
  if (doc.ownerId !== session.user.id) return { ok: false as const, status: 403 as const, userId: session.user.id };
  return { ok: true as const, userId: session.user.id };
}

type Body = {
  prompt: string;
  scope: "selection" | "document";
  applyMode: "insert" | "replace";
  selectionText?: string;
  documentText?: string;
  titulo?: string;
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY no está configurada" }, { status: 500 });
    }

    const { id } = await context.params;
    const authz = await requireOwner(request.headers, id);
    if (!authz.ok) return NextResponse.json({ error: "No autorizado" }, { status: authz.status });

    const sub = await getActiveSubscriptionForUser(authz.userId);
    if (!sub) {
      return NextResponse.json({ error: "Necesitas una suscripción activa para usar IA" }, { status: 402 });
    }

    const body = (await request.json()) as Body;
    const prompt = (body.prompt || "").trim();
    if (!prompt) return NextResponse.json({ error: "prompt es requerido" }, { status: 400 });

    const contextText =
      body.scope === "selection" ? (body.selectionText || "").trim() : (body.documentText || "").trim();

    const system = [
      "Eres un asistente de redacción académica para Caletas.",
      "Objetivo: ayudar a escribir y mejorar una tesis en Markdown.",
      "Debes responder SIEMPRE en español.",
      "Puedes usar LaTeX inline $...$ y bloques $$...$$ cuando sea útil.",
      "Mantén el tono formal, claro y con estructura (títulos, subtítulos, listas) cuando aplique.",
      "No inventes fuentes ni datos específicos si no están en el contexto; si falta info, escribe placeholders claros.",
      "Devuelve ÚNICAMENTE el texto final en Markdown, sin explicaciones ni preámbulos.",
    ].join("\n");

    const user = [
      `Título de la tesis: ${body.titulo || "N/A"}`,
      `Ámbito: ${body.scope === "selection" ? "SELECCIÓN" : "DOCUMENTO"}`,
      "",
      "INSTRUCCIÓN:",
      prompt,
      "",
      "CONTEXTO (puede estar vacío):",
      contextText ? contextText.slice(0, 24_000) : "(sin contexto)",
      "",
      "RESPUESTA: Devuelve solo el texto final (Markdown).",
    ].join("\n");

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 1800,
    });

    logAiUsage({ userId: authz.userId, endpoint: "tesis/ai", usage: resp.usage ?? null });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    if (!text) return NextResponse.json({ error: "La IA no devolvió contenido" }, { status: 500 });

    return NextResponse.json({ text, applyMode: body.applyMode });
  } catch (e) {
    console.error("tesis ai:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

