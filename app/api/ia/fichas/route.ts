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

Genera 3 fichas de estudio basadas en este contenido. Cada ficha debe incluir:
1. Un concepto principal
2. Una definición clara y concisa
3. 3 ejemplos prácticos
4. 3 puntos clave para recordar

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "fichas": [
    {
      "concepto": "Nombre del concepto",
      "definicion": "Definición clara y concisa",
      "ejemplos": ["Ejemplo 1", "Ejemplo 2", "Ejemplo 3"],
      "puntosClave": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
    }
  ]
}
`;

    // Generar fichas con OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un asistente educativo especializado en crear fichas de estudio efectivas. Genera fichas claras, concisas y útiles para estudiantes universitarios."
        },
        {
          role: "user",
          content: contenidoParaIA
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const respuestaIA = response.choices[0]?.message?.content;
    
    if (!respuestaIA) {
      return NextResponse.json({ error: "Error al generar las fichas" }, { status: 500 });
    }

    // Parsear la respuesta JSON
    let fichasGeneradas;
    try {
      fichasGeneradas = JSON.parse(respuestaIA);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return NextResponse.json({ error: "Error al procesar la respuesta de la IA" }, { status: 500 });
    }

    // Validar estructura de la respuesta
    if (!fichasGeneradas.fichas || !Array.isArray(fichasGeneradas.fichas)) {
      return NextResponse.json({ error: "Formato de respuesta inválido" }, { status: 500 });
    }

    // Agregar IDs y recursoId a las fichas
    const fichasConIds = fichasGeneradas.fichas.map((ficha: any, index: number) => ({
      id: (index + 1).toString(),
      ...ficha,
      recursoId: recursoId
    }));

    return NextResponse.json({ 
      fichas: fichasConIds,
      recurso: {
        titulo: recurso.titulo,
        materia: recurso.materia.nombre
      }
    });

  } catch (error) {
    console.error("Error generating fichas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 