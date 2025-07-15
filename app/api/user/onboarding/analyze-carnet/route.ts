import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
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

    // Guardar archivo temporalmente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const tempDir = join(process.cwd(), "temp");
    const fileName = `carnet_${Date.now()}_${file.name}`;
    const filePath = join(tempDir, fileName);
    
    await writeFile(filePath, buffer);

    // Convertir imagen a base64 para OpenAI
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Analizar con OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este carnet universitario venezolano y extrae la siguiente información en formato JSON:

{
  "nombre": "Nombre completo del estudiante",
  "expediente": "Número de expediente o matrícula",
  "carrera": "Nombre de la carrera o programa de estudio",
  "semestre": "Semestre actual (S1, S2, S3, etc.)"
}

Instrucciones específicas:
- Busca el nombre completo del estudiante en el carnet
- Identifica el número de expediente o matrícula (puede aparecer como "Expediente", "Matrícula", "Carnet No.", etc.)
- Extrae el nombre de la carrera o programa de estudio
- Determina el semestre actual basándote en la información visible
- Si no encuentras alguna información, usa "No disponible" para ese campo
- Asegúrate de que la respuesta sea un JSON válido`
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
      max_tokens: 500,
    });

    const analysis = response.choices[0]?.message?.content;
    
    if (!analysis) {
      return NextResponse.json(
        { error: "No se pudo analizar el carnet" },
        { status: 500 }
      );
    }

    // Intentar parsear la respuesta JSON
    let parsedData;
    try {
      // Extraer JSON de la respuesta (puede contener texto adicional)
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se encontró JSON en la respuesta");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return NextResponse.json(
        { error: "Error al procesar la respuesta de la IA" },
        { status: 500 }
      );
    }

    // Validar que tenemos los campos requeridos
    const requiredFields = ["nombre", "expediente", "carrera", "semestre"];
    const missingFields = requiredFields.filter(field => !parsedData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Campos faltantes en el análisis: ${missingFields.join(", ")}`,
          partialData: parsedData 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error("Error analyzing carnet:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 