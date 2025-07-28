import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const texto = formData.get("texto") as string;

    if (!file && !texto) {
      return NextResponse.json({ error: "Se requiere un archivo PDF o texto" }, { status: 400 });
    }

    let contenidoParaProcesar = "";

    if (file) {
      // Procesar archivo PDF
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 10MB" }, { status: 400 });
      }

      try {
        // Para PDFs, usar solo el texto proporcionado por ahora
        // En el futuro se puede integrar con una librería más estable
        contenidoParaProcesar = "Contenido PDF (análisis de texto no disponible por ahora)";
        console.log("📄 Archivo PDF detectado, análisis de texto simplificado");
      } catch (error) {
        console.error("Error processing PDF:", error);
        return NextResponse.json({ error: "No se pudo procesar el PDF" }, { status: 500 });
      }

      if (!contenidoParaProcesar || contenidoParaProcesar.length < 100) {
        return NextResponse.json({ error: "El PDF no tiene suficiente texto para procesar" }, { status: 400 });
      }
    } else {
      // Usar texto proporcionado
      contenidoParaProcesar = texto;
      if (contenidoParaProcesar.length < 50) {
        return NextResponse.json({ error: "El texto es demasiado corto para procesar" }, { status: 400 });
      }
    }

    // Limitar el contenido para evitar tokens excesivos
    const contenidoLimitado = contenidoParaProcesar.slice(0, 8000);

    // Preparar prompt para la IA
    const prompt = `
Analiza el siguiente contenido y genera un resumen educativo estructurado:

CONTENIDO:
${contenidoLimitado}

Genera un resumen que incluya:
1. Tema principal
2. Puntos clave (3-5 puntos)
3. Conceptos importantes
4. Aplicaciones prácticas
5. Conclusiones relevantes

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "temaPrincipal": "Tema principal del contenido",
  "puntosClave": ["Punto 1", "Punto 2", "Punto 3"],
  "conceptosImportantes": ["Concepto 1", "Concepto 2", "Concepto 3"],
  "aplicacionesPracticas": ["Aplicación 1", "Aplicación 2"],
  "conclusiones": "Resumen de las conclusiones principales",
  "resumenGeneral": "Resumen general del contenido en 2-3 párrafos"
}

El resumen debe ser claro, educativo y útil para estudiantes universitarios.
`;

    // Generar resumen con OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un asistente educativo especializado en crear resúmenes claros y estructurados para estudiantes universitarios."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const respuestaIA = response.choices[0]?.message?.content;
    
    if (!respuestaIA) {
      return NextResponse.json({ error: "Error al generar el resumen" }, { status: 500 });
    }

    // Parsear la respuesta JSON
    let resumenGenerado;
    try {
      resumenGenerado = JSON.parse(respuestaIA);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return NextResponse.json({ error: "Error al procesar la respuesta de la IA" }, { status: 500 });
    }

    // Validar estructura de la respuesta
    const camposRequeridos = ["temaPrincipal", "puntosClave", "conceptosImportantes", "aplicacionesPracticas", "conclusiones", "resumenGeneral"];
    for (const campo of camposRequeridos) {
      if (!resumenGenerado[campo]) {
        return NextResponse.json({ error: `Campo requerido faltante: ${campo}` }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      resumen: resumenGenerado,
      fuente: file ? `PDF: ${file.name}` : "Texto proporcionado"
    });

  } catch (error) {
    console.error("Error generating resumen:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 