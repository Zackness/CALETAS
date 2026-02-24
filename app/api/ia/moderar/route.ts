import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 400 });
    }

    let contenidoParaAnalizar = "";
    const esImagen = file.type !== "application/pdf";

    if (file.type === "application/pdf") {
      // Para PDFs, usar solo el título y descripción por ahora
      contenidoParaAnalizar = `PDF: ${titulo || ""} ${descripcion || ""}`;
      console.log("📄 Archivo PDF detectado, analizando título y descripción");
    } else {
      // Para imágenes, usar solo el título y descripción por ahora
      contenidoParaAnalizar = `Imagen: ${titulo || ""} ${descripcion || ""}`;
      console.log("🖼️ Archivo de imagen detectado, analizando título y descripción");
    }

    // Limitar el contenido para evitar tokens excesivos
    const contenidoLimitado = contenidoParaAnalizar.slice(0, 4000);

    // Prompt para moderación
    const prompt = `
Eres un moderador de contenido académico universitario. Tu tarea es evaluar si el contenido es apropiado para una plataforma educativa.

CONTENIDO A EVALUAR:
${contenidoLimitado}

CRITERIOS DE MODERACIÓN:
✅ CONTENIDO APROPIADO:
- Materiales de estudio (apuntes, exámenes, ejercicios)
- Presentaciones académicas
- Guías de laboratorio
- Resúmenes de clases
- Diagramas y gráficos educativos
- Fórmulas matemáticas
- Código de programación
- Documentos técnicos

❌ CONTENIDO NO APROPIADO:
- Contenido sexual o pornográfico
- Desnudos o contenido explícito
- Memes o contenido humorístico no educativo
- Chismes sobre estudiantes o profesores
- Contenido ofensivo o discriminatorio
- Spam o contenido comercial
- Contenido político no académico
- Fotos personales no relacionadas con estudios
- Contenido violento o peligroso
- Texto sin sentido o spam

Responde ÚNICAMENTE con un JSON válido:
{
  "esApropiado": true/false,
  "razon": "Explicación breve de la decisión",
  "confianza": 0.95,
  "categoria": "EDUCATIVO" | "INAPROPIADO" | "DUDOSO",
  "detalles": {
    "tipoContenido": "Descripción del tipo de contenido detectado",
    "recomendacion": "Recomendación para el usuario"
  }
}

Si el contenido es inapropiado, proporciona una razón clara y específica.
`;

    // Analizar con OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: "Eres un moderador de contenido académico estricto pero justo. Tu objetivo es mantener la calidad educativa de la plataforma."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1, // Baja temperatura para consistencia
      max_tokens: 500,
    });

    const respuestaIA = response.choices[0]?.message?.content;
    
    if (!respuestaIA) {
      return NextResponse.json({ error: "Error en la moderación" }, { status: 500 });
    }

    // Parsear la respuesta JSON
    let resultadoModeracion;
    try {
      resultadoModeracion = JSON.parse(respuestaIA);
    } catch (error) {
      console.error("Error parsing moderation response:", error);
      return NextResponse.json({ error: "Error al procesar la moderación" }, { status: 500 });
    }

    // Validar estructura de la respuesta
    if (typeof resultadoModeracion.esApropiado !== 'boolean') {
      return NextResponse.json({ error: "Respuesta de moderación inválida" }, { status: 500 });
    }

    return NextResponse.json({
      aprobado: resultadoModeracion.esApropiado,
      razon: resultadoModeracion.razon,
      confianza: resultadoModeracion.confianza || 0.8,
      categoria: resultadoModeracion.categoria || "DUDOSO",
      detalles: resultadoModeracion.detalles || {}
    });

  } catch (error) {
    console.error("Error in content moderation:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 