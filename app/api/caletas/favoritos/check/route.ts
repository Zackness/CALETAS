import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recursoId = searchParams.get('recursoId');

    if (!recursoId) {
      return NextResponse.json(
        { error: "ID del recurso es requerido" },
        { status: 400 }
      );
    }

    // Verificar si está en favoritos
    const favorito = await db.favorito.findUnique({
      where: {
        usuarioId_recursoId: {
          usuarioId: session.user.id,
          recursoId: recursoId
        }
      }
    });

    return NextResponse.json({
      success: true,
      isFavorito: !!favorito,
      favoritoId: favorito?.id || null
    });

  } catch (error) {
    console.error("Error verificando favorito:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
