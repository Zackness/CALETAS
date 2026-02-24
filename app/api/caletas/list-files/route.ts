import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cpanelStorage } from "@/lib/cpanel-storage";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subfolder = searchParams.get("subfolder") || "";

    // Listar archivos de cPanel
    const files = await cpanelStorage.listFiles(subfolder);

    return NextResponse.json({
      success: true,
      files,
      count: files.length
    });

  } catch (error) {
    console.error("Error listando archivos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
