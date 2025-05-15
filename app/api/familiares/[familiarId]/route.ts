import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const familiarId = url.pathname.split('/').pop();
    
    const body = await req.json();
    const { telefono, analyzedData } = body;

    // Verificar que el familiar pertenece al usuario
    const familiar = await db.familiar.findFirst({
      where: {
        id: familiarId,
        usuarioId: session.user.id
      }
    });

    if (!familiar) {
      return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
    }

    // Actualizar el familiar
    const updatedFamiliar = await db.familiar.update({
      where: {
        id: familiarId
      },
      data: {
        telefono,
        ...(analyzedData && {
          nombre: analyzedData.nombre,
          nombre2: analyzedData.nombre2 || null,
          apellido: analyzedData.apellido || null,
          apellido2: analyzedData.apellido2 || null,
          cedula: analyzedData.cedula,
          fechaNacimiento: new Date(analyzedData.fechaNacimiento),
        })
      }
    });

    return NextResponse.json(updatedFamiliar);
  } catch (error) {
    console.error("[FAMILIAR_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const familiarId = url.pathname.split('/').pop();

    // Verificar que el familiar pertenece al usuario
    const familiar = await db.familiar.findFirst({
      where: {
        id: familiarId,
        usuarioId: session.user.id
      }
    });

    if (!familiar) {
      return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
    }

    // Eliminar el familiar
    await db.familiar.delete({
      where: {
        id: familiarId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FAMILIAR_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 