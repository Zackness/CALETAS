import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new NextResponse("No se proporcionó ningún archivo", { status: 400 });
    }

    // Convertir el archivo a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Crear el prompt para GPT-4 Vision
    const prompt = `Analiza esta imagen de una cédula de identidad venezolana y extrae la siguiente información en formato JSON:
    {
      "cedula": "número de cédula",
      "nombre": "nombre completo",
      "nombre2": "segundo nombre si existe",
      "apellido": "primer apellido",
      "apellido2": "segundo apellido si existe",
      "fechaNacimiento": "fecha de nacimiento en formato YYYY-MM-DD",
      "estadoCivil": "estado civil (soltero/casado)",
      "fechaVencimiento": "fecha de vencimiento en formato YYYY-MM-DD"
    }
    
    Asegúrate de que:
    1. La fecha de vencimiento sea precisa
    2. El estado civil sea "soltero" o "casado"
    3. El formato de las fechas sea YYYY-MM-DD
    4. El número de cédula sea exacto`;

    try {
      // Llamar a la API de OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      // Extraer y validar la respuesta
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No se pudo extraer información del documento");
      }

      // Intentar parsear el JSON de la respuesta
      let extractedData;
      try {
        extractedData = JSON.parse(content);
      } catch (error) {
        console.error("Error al parsear la respuesta de OpenAI:", error);
        return new NextResponse("Error al procesar la información del documento", { status: 500 });
      }

      // Validar los campos requeridos
      const requiredFields = ["cedula", "nombre", "fechaNacimiento", "estadoCivil", "fechaVencimiento"];
      const missingFields = requiredFields.filter(field => !extractedData[field]);
      
      if (missingFields.length > 0) {
        return new NextResponse(`Faltan campos requeridos: ${missingFields.join(", ")}`, { status: 400 });
      }

      return NextResponse.json(extractedData);
    } catch (openaiError: any) {
      console.error("Error en la API de OpenAI:", openaiError);
      
      // Manejar específicamente el error de país no soportado
      if (openaiError.status === 403 && openaiError.code === 'unsupported_country_region_territory') {
        return new NextResponse(
          "Lo sentimos, el servicio de análisis de documentos no está disponible en tu región. Por favor, intenta más tarde o contacta al soporte.",
          { status: 503 }
        );
      }
      
      // Para otros errores de OpenAI
      return new NextResponse(
        "Error al procesar el documento. Por favor, intenta nuevamente o contacta al soporte si el problema persiste.",
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en el análisis del documento:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 