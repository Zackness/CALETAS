import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para analizar PDFs directamente con GPT-4o
async function analyzePDFWithGPT(buffer: Buffer, fileType: string): Promise<any> {
  try {
    console.log("🔍 Iniciando análisis de PDF con GPT-4o...");
    console.log("📄 Tipo de archivo:", fileType);
    console.log("📄 Tamaño del buffer:", buffer.length);
    
    // Primero subir el archivo para obtener file_id
    const formData = new FormData();
    const blob = new Blob([buffer], { type: fileType });
    formData.append('file', blob, 'document.pdf');
    formData.append('purpose', 'assistants');
    
    console.log("📤 Subiendo archivo a OpenAI...");
    
    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ Error subiendo archivo:", uploadResponse.status, errorText);
      throw new Error(`Error uploading file: ${uploadResponse.statusText} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.id;
    
    console.log("📤 Archivo subido con file_id:", fileId);
    
    // Análisis directo con GPT-4o usando file_id
    console.log("🤖 Iniciando análisis con GPT-4o...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un moderador de contenido académico. Analiza este PDF y determina si es apropiado para una plataforma educativa universitaria. Responde ÚNICAMENTE en formato JSON válido."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este PDF y determina si es apropiado para una plataforma educativa.

CRITERIOS DE EVALUACIÓN:
✅ CONTENIDO APROPIADO:
- Materiales de estudio (apuntes, exámenes, ejercicios, guías)
- Contenido educativo relacionado con materias universitarias
- Documentos de estudio, presentaciones académicas
- Información técnica o científica válida
- Fórmulas matemáticas, diagramas educativos
- Código de programación, documentación técnica
- Investigaciones académicas, papers científicos

❌ CONTENIDO INAPROPIADO:
- Revistas para adultos, contenido sexual o pornográfico
- Desnudos, contenido explícito o sugerente
- Chismes o información personal de estudiantes
- Memes, fotos sin contexto educativo
- Contenido ofensivo, discriminatorio o inapropiado
- Texto sin sentido o spam
- Información personal o confidencial
- Contenido político o religioso no académico
- Contenido comercial no educativo
- Contenido violento o peligroso

IMPORTANTE: Analiza el CONTENIDO REAL del PDF, tanto texto como imágenes.
Si el contenido contiene material sexual, para adultos, o inapropiado, debe ser rechazado.

Responde ÚNICAMENTE en formato JSON válido, sin markdown, sin \`\`\`json, sin explicaciones adicionales.

Ejemplo de respuesta esperada:
{"esApropiado": true, "razon": "Contenido académico válido", "confianza": 0.9, "categoria": "ACADEMICO", "detalles": "Análisis específico"}`
            },
            {
              type: "file",
              file: {
                file_id: fileId
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      console.error("❌ No se recibió respuesta de OpenAI");
      throw new Error("No se recibió respuesta de OpenAI");
    }

    console.log("📄 Respuesta de GPT-4o recibida:", responseText.substring(0, 200));
    
    // Parsear respuesta JSON
    let cleanResponse = responseText.trim();
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
    
    const resultado = JSON.parse(cleanResponse);
    console.log("🔍 Análisis directo del PDF con GPT-4o:", resultado);
    
    // Limpiar el archivo subido
    try {
      await fetch(`https://api.openai.com/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      console.log("🗑️ Archivo temporal eliminado:", fileId);
    } catch (cleanupError) {
      console.error("Error limpiando archivo temporal:", cleanupError);
    }
    
    return resultado;
  } catch (error) {
    console.error("❌ Error analyzing PDF with GPT:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando análisis de contenido...");
    
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

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    console.log("📁 Archivo recibido:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipo de archivo no permitido",
        esApropiado: false,
        razon: "Tipo de archivo no permitido"
      }, { status: 400 });
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "Archivo demasiado grande",
        esApropiado: false,
        razon: "Archivo demasiado grande"
      }, { status: 400 });
    }

    let resultado;

    if (file.type === "application/pdf") {
      // Para PDFs: Análisis directo con GPT-4o
      console.log("📄 Archivo PDF detectado, analizando directamente con GPT-4o");
      console.log("📄 Nombre del archivo:", file.name);
      
      try {
        // Convertir archivo a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        console.log("📄 Buffer creado, tamaño:", buffer.length);
        
        // Analizar PDF directamente con GPT-4o
        resultado = await analyzePDFWithGPT(buffer, file.type);
        
        if (!resultado) {
          throw new Error("Análisis de PDF falló");
        }
        
        console.log("✅ Análisis directo del PDF completado:", resultado);
      } catch (pdfError) {
        console.error("❌ Error procesando PDF:", pdfError);
        return NextResponse.json({ 
          error: "Error analizando PDF",
          esApropiado: false,
          razon: "Error en análisis del contenido"
        }, { status: 500 });
      }
    } else {
      // Para imágenes, usar OpenAI Vision API para analizar el contenido real
      console.log("🖼️ Archivo de imagen detectado, analizando contenido real con Vision API");
      
      try {
        // Convertir imagen a base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        
        // Análisis con Vision API
        const visionResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Eres un moderador de contenido académico. Analiza esta imagen y determina si es apropiada para una plataforma educativa universitaria. Responde ÚNICAMENTE en formato JSON válido."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analiza esta imagen y determina si es apropiada para una plataforma educativa.

CRITERIOS DE EVALUACIÓN:
✅ CONTENIDO APROPIADO:
- Materiales de estudio (apuntes, exámenes, ejercicios)
- Presentaciones académicas, diagramas educativos
- Fórmulas matemáticas, código de programación
- Documentos técnicos, gráficos científicos
- Contenido educativo relacionado con materias universitarias

❌ CONTENIDO INAPROPIADO:
- Fotos personales, selfies, retratos
- Cosplay, disfraces, contenido de entretenimiento
- Memes, contenido humorístico no educativo
- Contenido sexual, desnudos, contenido explícito
- Contenido ofensivo o discriminatorio
- Spam, contenido comercial no académico
- Contenido político no académico
- Contenido violento o peligroso

Responde ÚNICAMENTE con JSON:
{"esApropiado": true/false, "razon": "Explicación detallada", "confianza": 0.0-1.0, "categoria": "ACADEMICO"|"INAPROPIADO"|"DUDOSO", "detalles": "Análisis específico del contenido visual"}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        });
        
        const visionResult = visionResponse.choices[0]?.message?.content;
        if (visionResult) {
          // Parsear respuesta de Vision API
          let cleanVisionResponse = visionResult.trim();
          if (cleanVisionResponse.startsWith('```json')) {
            cleanVisionResponse = cleanVisionResponse.substring(7);
          }
          if (cleanVisionResponse.startsWith('```')) {
            cleanVisionResponse = cleanVisionResponse.substring(3);
          }
          if (cleanVisionResponse.endsWith('```')) {
            cleanVisionResponse = cleanVisionResponse.substring(0, cleanVisionResponse.length - 3);
          }
          cleanVisionResponse = cleanVisionResponse.trim();
          
          resultado = JSON.parse(cleanVisionResponse);
          console.log("🔍 Análisis de imagen:", resultado);
        } else {
          throw new Error("No se recibió respuesta de Vision API");
        }
      } catch (visionError) {
        console.error("Error en análisis de imagen:", visionError);
        return NextResponse.json({ 
          error: "Error analizando imagen",
          esApropiado: false,
          razon: "Error en análisis del contenido"
        }, { status: 500 });
      }
    }
    
    console.log("✅ Análisis completado:", resultado);
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error("❌ Error en análisis de contenido:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      esApropiado: false,
      razon: "Error en análisis"
    }, { status: 500 });
  }
} 