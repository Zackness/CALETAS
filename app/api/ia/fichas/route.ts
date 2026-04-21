import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import OpenAI from "openai";
import { canAccessFullCaletasPlan, getActiveSubscriptionForUser } from "@/lib/subscription";
import { logAiUsage } from "@/lib/ai-usage";
import { assertAiTrialAllowed } from "@/lib/ai-trial";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }
    const sub = await getActiveSubscriptionForUser(session.user.id);
    const hasSubscription = !!sub;
    if (!hasSubscription) {
      const gate = await assertAiTrialAllowed({ userId: session.user.id, endpoint: "ia/fichas" });
      if (!gate.ok) {
        return withCors(
          NextResponse.json(
            {
              error: gate.error,
              code: "FREE_LIMIT_REACHED",
              endpoint: "ia/fichas",
              limit: gate.info.limit,
            },
            { status: 402 },
          ),
          request,
        );
      }
    }
    const body = await request.json();
    const { recursoId } = body;
    if (!recursoId) {
      return withCors(NextResponse.json({ error: "ID de recurso requerido" }, { status: 400 }), request);
    }

    const viewer = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true },
    });
    const hasFullCaletasPlan = canAccessFullCaletasPlan(sub);

    let visibilityWhere: any;
    if (hasFullCaletasPlan) {
      visibilityWhere = {};
    } else if (!viewer?.universidadId) {
      visibilityWhere = {
        OR: [{ universidadId: null }, { autorId: session.user.id }],
      };
    } else {
      visibilityWhere = {
        OR: [{ universidadId: null }, { universidadId: viewer.universidadId }, { autorId: session.user.id }],
      };
    }

    // Obtener el recurso SOLO si el usuario puede verlo
    const recurso = await db.recurso.findFirst({
      where: {
        id: recursoId,
        ...(visibilityWhere || {}),
      },
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
      return withCors(NextResponse.json({ error: "Recurso no encontrado o sin acceso" }, { status: 404 }), request);
    }
    
    const autorNombre =
      (recurso as any).esAnonimo && recurso.autorId !== session.user.id
        ? "Anónimo"
        : recurso.autor?.name || "N/A";

    const materiaContexto = recurso.materia
      ? `Materia: ${recurso.materia.nombre} (${recurso.materia.codigo})`
      : "Materia: caleta genérica (sin materia asociada)";

    // Preparar el contenido para la IA
    const contenidoParaIA = `
Título del recurso: ${recurso.titulo}
Descripción: ${recurso.descripcion}
Contenido: ${recurso.contenido}
${materiaContexto}
Tipo de recurso: ${recurso.tipo}
Tags: ${recurso.tags || 'N/A'}
Autor: ${autorNombre}

Genera 3 fichas de estudio basadas en este contenido. Cada ficha debe incluir:
1. Un concepto principal
2. Una definición clara y concisa
3. 3 ejemplos prácticos
4. 3 puntos clave para recordar

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin markdown, sin \`\`\`json, sin explicaciones adicionales.

Estructura JSON esperada:
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
          content: "Eres un asistente educativo especializado en crear fichas de estudio efectivas. Genera fichas claras, concisas y útiles para estudiantes universitarios. Responde ÚNICAMENTE en formato JSON válido, sin markdown, sin ```json, sin explicaciones adicionales."
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

    logAiUsage({ userId: session.user.id, endpoint: "ia/fichas", usage: response.usage ?? null });

    // Parsear la respuesta JSON
    let fichasGeneradas;
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
      
      fichasGeneradas = JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Respuesta original:", respuestaIA);
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

    return withCors(NextResponse.json({
      fichas: fichasConIds,
      recurso: {
        titulo: recurso.titulo,
        materia: recurso.materia?.nombre ?? "Genérica",
      },
    }), request);
  } catch (error) {
    console.error("Error generating fichas:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
} 