import { NextRequest, NextResponse } from "next/server";
import { generateUploadUrl } from "@/lib/bunny";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    // Debug: Verificar variables de entorno
    console.log('Environment Variables:', {
      storageZone: process.env.BUNNY_STORAGE_ZONE_NAME || '[MISSING]',
      apiKey: process.env.BUNNY_API_KEY ? '[PRESENT]' : '[MISSING]',
      baseUrl: process.env.BUNNY_BASE_URL || '[MISSING]'
    });

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el nombre del archivo de los query params
    const fileName = req.nextUrl.searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json(
        { error: "Nombre de archivo requerido" },
        { status: 400 }
      );
    }

    // Generar URL y headers para la subida
    const uploadConfig = await generateUploadUrl(fileName);

    // Debug: Verificar la configuración generada
    console.log('Upload Config:', {
      url: uploadConfig.url,
      hasHeaders: !!uploadConfig.headers,
      fileUrl: uploadConfig.fileUrl
    });

    return NextResponse.json(uploadConfig);
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    // Incluir más detalles del error en la respuesta
    return NextResponse.json(
      { 
        error: "Error al generar la URL de subida",
        details: error.message,
        env: {
          hasStorageZone: !!process.env.BUNNY_STORAGE_ZONE_NAME,
          hasApiKey: !!process.env.BUNNY_API_KEY,
          hasBaseUrl: !!process.env.BUNNY_BASE_URL
        }
      },
      { status: 500 }
    );
  }
}