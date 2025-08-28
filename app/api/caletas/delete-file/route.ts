import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFromCPanel } from "@/lib/cpanel-storage";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "URL del archivo es requerida" },
        { status: 400 }
      );
    }

    // Intentar eliminar el archivo de cPanel
    const success = await deleteFromCPanel(fileUrl);

    if (success) {
      return NextResponse.json({
        success: true,
        mensaje: "Archivo eliminado exitosamente"
      });
    } else {
      return NextResponse.json(
        { error: "No se pudo eliminar el archivo" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error eliminando archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
