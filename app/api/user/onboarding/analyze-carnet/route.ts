import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const universidadId = formData.get("universidadId") as string;
    const documentTypeRaw = formData.get("documentType");
    const documentType = documentTypeRaw === "planilla" ? "planilla" : "carnet";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    if (!universidadId) {
      return NextResponse.json(
        { error: "Se requiere el ID de la universidad para validar el carnet" },
        { status: 400 }
      );
    }

    // Obtener información de la universidad seleccionada
    const universidad = await db.universidad.findUnique({
      where: { id: universidadId },
      select: {
        id: true,
        nombre: true,
        siglas: true,
        estado: true,
        ciudad: true,
      }
    });

    if (!universidad) {
      return NextResponse.json(
        { error: "Universidad no encontrada" },
        { status: 404 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se aceptan JPEG, JPG, PNG y PDF" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer directamente sin guardar en disco
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convertir imagen a base64 para OpenAI
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Analizar con OpenAI con validación específica de universidad
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este documento de estudiante (puede ser CARNET universitario o PLANILLA DE INSCRIPCIÓN) y responde ÚNICAMENTE con un JSON válido.

IMPORTANTE: Debes responder SOLO con el JSON, sin texto adicional antes o después.

{
  "nombre": "Nombre completo del estudiante",
  "expediente": "Número de expediente o matrícula",
  "universidad": "Nombre de la universidad que aparece en el documento",
  "siglas": "Siglas de la universidad que aparecen en el documento"
}

INSTRUCCIONES SIMPLES:
1. Busca el nombre completo del estudiante en el documento
2. Identifica el número de expediente o matrícula (puede aparecer como "EXP:", "Expediente", "Matrícula", "Carnet No.", etc.)
3. Identifica el nombre completo de la universidad que aparece en el documento
4. Identifica las siglas de la universidad que aparecen en el documento
5. Si no encuentras alguna información, usa "No disponible" para ese campo
6. RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL

NO necesitas extraer carrera ni semestre. Solo extrae la información que está visible.

Tipo esperado (para tu referencia): ${documentType === "planilla" ? "PLANILLA DE INSCRIPCIÓN" : "CARNET UNIVERSITARIO"}.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    });

    const analysis = response.choices[0]?.message?.content;
    
    if (!analysis) {
      return NextResponse.json(
        { error: "No se pudo analizar el carnet" },
        { status: 500 }
      );
    }

    logAiUsage({ userId: null, endpoint: "user/onboarding/analyze-carnet", usage: response.usage ?? null });

    // Intentar parsear la respuesta JSON
    let parsedData;
    try {
      // Limpiar la respuesta de posibles caracteres extra
      let cleanAnalysis = analysis.trim();
      
      // Si la respuesta no empieza con {, buscar el JSON
      if (!cleanAnalysis.startsWith('{')) {
        const jsonMatch = cleanAnalysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanAnalysis = jsonMatch[0];
        } else {
          throw new Error("No se encontró JSON en la respuesta");
        }
      }
      
      // Si la respuesta no termina con }, buscar el final del JSON
      if (!cleanAnalysis.endsWith('}')) {
        const lastBraceIndex = cleanAnalysis.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          cleanAnalysis = cleanAnalysis.substring(0, lastBraceIndex + 1);
        }
      }
      
      parsedData = JSON.parse(cleanAnalysis);
      
      // Log para debugging
      console.log("AI Response:", analysis);
      console.log("Parsed Data:", parsedData);
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw AI response:", analysis);
      return NextResponse.json(
        { error: "Error al procesar la respuesta de la IA" },
        { status: 500 }
      );
    }

    // Validar que tenemos los campos básicos requeridos
    const requiredFields = ["nombre", "expediente", "universidad", "siglas"];
    const missingFields = [];
    
    // Verificar y establecer valores por defecto si faltan
    for (const field of requiredFields) {
      if (!parsedData[field]) {
        parsedData[field] = "No disponible";
        missingFields.push(field);
      }
    }
    
    // Validar que el documento pertenece a la universidad seleccionada (siglas o nombre)
    const normalize = (s: unknown) =>
      String(typeof s === "string" ? s : "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const siglasDoc = normalize(parsedData.siglas);
    const siglasSel = normalize(universidad.siglas);
    const uniDoc = normalize(parsedData.universidad);
    const uniSel = normalize(universidad.nombre);

    const siglasCoinciden = !!siglasDoc && !!siglasSel && siglasDoc === siglasSel;
    const nombreCoincide =
      !!uniDoc && !!uniSel && (uniDoc.includes(uniSel) || uniSel.includes(uniDoc) || uniDoc.includes(siglasSel));

    if (!siglasCoinciden && !nombreCoincide) {
      return NextResponse.json(
        { 
          error: "El documento no pertenece a la universidad seleccionada",
          details: `El documento muestra "${parsedData.siglas || parsedData.universidad}" pero seleccionaste "${universidad.siglas} - ${universidad.nombre}"`,
          carnetData: parsedData
        },
        { status: 400 }
      );
    }
    
    // Si faltan campos críticos, mostrar warning pero continuar
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      console.log("Parsed data with defaults:", parsedData);
    }

    // Agregar información de la universidad validada
    parsedData.universidadId = universidad.id;
    parsedData.universidadValidada = universidad.nombre;
    parsedData.esValido = true; // Si llegamos aquí, el carnet es válido
    parsedData.documentType = documentType;

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error("Error analyzing carnet:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 