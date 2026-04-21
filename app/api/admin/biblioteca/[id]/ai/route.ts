import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const, userId: null as string | null };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const, userId: session.user.id };
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

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY no está configurada" }, { status: 500 });
    }

    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const body = (await request.json()) as Body;
    const prompt = (body.prompt || "").trim();
    if (!prompt) return NextResponse.json({ error: "prompt es requerido" }, { status: 400 });

    const context =
      body.scope === "selection"
        ? (body.selectionText || "").trim()
        : (body.documentText || "").trim();

    const system = [
      "Eres un asistente de redacción para Caletas.",
      "Objetivo: ayudar a escribir y mejorar un libro académico en Markdown.",
      "Debes responder SIEMPRE en español.",
      "Puedes usar LaTeX inline $...$ y bloques $$...$$ cuando sea útil.",
      "No inventes fuentes ni datos específicos si no están en el contexto; si falta info, escribe placeholders claros.",
      "Devuelve ÚNICAMENTE el texto final a insertar en el documento, sin explicaciones.",
    ].join("\n");

    const user = [
      `Título del libro: ${body.titulo || "N/A"}`,
      `Ámbito: ${body.scope === "selection" ? "SELECCIÓN" : "DOCUMENTO"}`,
      "",
      "INSTRUCCIÓN:",
      prompt,
      "",
      "CONTEXTO (puede estar vacío):",
      context ? context.slice(0, 24_000) : "(sin contexto)",
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

    logAiUsage({ userId: admin.userId, endpoint: "admin/biblioteca/ai", usage: resp.usage ?? null });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    if (!text) return NextResponse.json({ error: "La IA no devolvió contenido" }, { status: 500 });

    return NextResponse.json({ text, applyMode: body.applyMode });
  } catch (e) {
    console.error("admin biblioteca ai:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

