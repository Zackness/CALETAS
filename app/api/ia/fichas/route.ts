import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import pdfParse from "pdf-parse";

export const maxDuration = 60; // segundos
export const maxBodySize = "10mb";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    console.log("[IA FICHAS] file recibido:", file && 'name' in file ? file.name : typeof file, file);
    if (!file || !(file instanceof Blob)) {
      console.error("[IA FICHAS] No se recibió un archivo PDF válido");
      return NextResponse.json({ error: "Archivo PDF requerido" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[IA FICHAS] buffer length:", buffer.length);
    if (buffer.length < 100) {
      console.error("[IA FICHAS] El buffer del PDF es muy pequeño");
    }
    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (err) {
      console.error("[IA FICHAS] Error al procesar el PDF con pdf-parse:", err);
      return NextResponse.json({ error: "No se pudo procesar el PDF" }, { status: 500 });
    }
    const text = pdfData.text;
    if (!text || text.length < 100) {
      console.error("[IA FICHAS] El PDF no tiene suficiente texto");
      return NextResponse.json({ error: "El PDF no tiene suficiente texto" }, { status: 400 });
    }
    
    // Prompt para OpenAI usando AI SDK
    const prompt = `Eres un asistente educativo universitario. A partir del siguiente texto extraído de un PDF, genera un cuestionario de selección simple para estudiar. El cuestionario debe tener entre 5 y 20 preguntas, cada una con 4 opciones, solo una correcta, y una breve explicación de la respuesta correcta. Devuelve el resultado en JSON con el formato:

{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct": 0, // índice de la opción correcta
      "explanation": "..."
    },
    ...
  ]
}

Texto del PDF:
"""
${text.slice(0, 8000)}
"""`;

    const { text: aiResponse } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      system: "Eres un asistente educativo universitario.",
      temperature: 0.3,
      maxTokens: 3000,
    });

    // Buscar JSON en la respuesta
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "No se pudo generar el cuestionario" }, { status: 500 });
    }
    const questions = JSON.parse(match[0]).questions;
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "El formato del cuestionario es inválido" }, { status: 500 });
    }
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generando fichas IA:", error);
    return NextResponse.json({ error: "Error interno generando el cuestionario" }, { status: 500 });
  }
} 