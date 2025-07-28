import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { recursoId } = body;

    if (!recursoId) {
      return NextResponse.json({ error: "ID de recurso requerido" }, { status: 400 });
    }

    // Obtener el recurso
    const recurso = await db.recurso.findUnique({
      where: { id: recursoId },
      include: {
        materia: {
          select: {
            nombre: true,
            codigo: true,
          }
        },
        autor: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!recurso) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario tiene acceso al recurso
    const tieneAcceso = recurso.esPublico || recurso.autorId === session.user.id;
    if (!tieneAcceso) {
      return NextResponse.json({ error: "No tienes acceso a este recurso" }, { status: 403 });
    }

    // Preparar el contenido para la IA
    const contenidoParaIA = `
Título del recurso: ${recurso.titulo}
Descripción: ${recurso.descripcion}
Contenido: ${recurso.contenido}
Materia: ${recurso.materia.nombre} (${recurso.materia.codigo})
Tipo de recurso: ${recurso.tipo}
Tags: ${recurso.tags || 'N/A'}

Genera un cuestionario de 5 preguntas basado en este contenido. Cada pregunta debe tener:
1. Una pregunta clara y específica
2. 4 opciones de respuesta (A, B, C, D)
3. Una respuesta correcta (índice 0-3)
4. Una explicación breve de por qué es correcta

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin markdown, sin \`\`\`json, sin explicaciones adicionales.

Estructura JSON esperada:
{
  "preguntas": [
    {
      "pregunta": "Texto de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": 0,
      "explicacion": "Explicación de por qué esta es la respuesta correcta"
    }
  ]
}

Las preguntas deben ser variadas y cubrir diferentes aspectos del contenido, desde conceptos básicos hasta aplicaciones prácticas.
`;

    // Generar cuestionario con OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un profesor universitario experto en crear cuestionarios educativos efectivos. Genera preguntas claras, relevantes y que evalúen la comprensión del contenido. Responde ÚNICAMENTE en formato JSON válido, sin markdown, sin ```json, sin explicaciones adicionales."
        },
        {
          role: "user",
          content: contenidoParaIA
        }
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    const respuestaIA = response.choices[0]?.message?.content;
    
    if (!respuestaIA) {
      return NextResponse.json({ error: "Error al generar el cuestionario" }, { status: 500 });
    }

    // Parsear la respuesta JSON
    let cuestionarioGenerado;
    try {
      // Limpiar la respuesta de markdown si viene envuelta en ```json
      let cleanResponse = respuestaIA.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7);
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
      }
      cleanResponse = cleanResponse.trim();
      
      console.log("🔍 Respuesta limpia de la IA:", cleanResponse.substring(0, 200));
      
      cuestionarioGenerado = JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Respuesta original:", respuestaIA);
      return NextResponse.json({ error: "Error al procesar la respuesta de la IA" }, { status: 500 });
    }

    // Validar estructura de la respuesta
    if (!cuestionarioGenerado.preguntas || !Array.isArray(cuestionarioGenerado.preguntas)) {
      return NextResponse.json({ error: "Formato de respuesta inválido" }, { status: 500 });
    }

    // Agregar IDs y recursoId a las preguntas
    const preguntasConIds = cuestionarioGenerado.preguntas.map((pregunta: any, index: number) => ({
      id: (index + 1).toString(),
      ...pregunta,
      recursoId: recursoId
    }));

    return NextResponse.json({ 
      preguntas: preguntasConIds,
      recurso: {
        titulo: recurso.titulo,
        materia: recurso.materia.nombre
      }
    });

  } catch (error) {
    console.error("Error generating cuestionario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 