import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// POST - Agregar caleta a favoritos
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const caletaId = params.id;

    // Verificar que la caleta existe
    const caleta = await db.caleta.findUnique({
      where: {
        id: caletaId,
        isActive: true
      }
    });

    if (!caleta) {
      return NextResponse.json(
        { error: "Caleta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya está en favoritos
    const favoritoExistente = await db.caletaFavorita.findUnique({
      where: {
        usuarioId_caletaId: {
          usuarioId: session.user.id,
          caletaId: caletaId
        }
      }
    });

    if (favoritoExistente) {
      return NextResponse.json(
        { error: "La caleta ya está en tus favoritos" },
        { status: 400 }
      );
    }

    // Agregar a favoritos
    const favorito = await db.caletaFavorita.create({
      data: {
        usuarioId: session.user.id,
        caletaId: caletaId
      }
    });

    return NextResponse.json(
      { message: "Caleta agregada a favoritos", favorito },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Error al agregar a favoritos" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar caleta de favoritos
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const caletaId = params.id;

    // Verificar que la caleta existe
    const caleta = await db.caleta.findUnique({
      where: {
        id: caletaId,
        isActive: true
      }
    });

    if (!caleta) {
      return NextResponse.json(
        { error: "Caleta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si está en favoritos
    const favoritoExistente = await db.caletaFavorita.findUnique({
      where: {
        usuarioId_caletaId: {
          usuarioId: session.user.id,
          caletaId: caletaId
        }
      }
    });

    if (!favoritoExistente) {
      return NextResponse.json(
        { error: "La caleta no está en tus favoritos" },
        { status: 400 }
      );
    }

    // Quitar de favoritos
    await db.caletaFavorita.delete({
      where: {
        usuarioId_caletaId: {
          usuarioId: session.user.id,
          caletaId: caletaId
        }
      }
    });

    return NextResponse.json(
      { message: "Caleta removida de favoritos" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Error al quitar de favoritos" },
      { status: 500 }
    );
  }
} 