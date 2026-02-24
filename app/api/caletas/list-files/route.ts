import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listBunnyFiles } from "@/lib/bunny";

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

    // Listar archivos de Bunny.net
    const folderToList = ["caletas", subfolder].filter(Boolean).join("/");
    const files = await listBunnyFiles(folderToList);

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
