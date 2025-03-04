import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, familiarId, testigo1, testigo2 } = await req.json();

    // Validar los datos recibidos
    if (!usuarioId || !testigo1 || !testigo2) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar si ya existe una solicitud hecha por esta persona en el último año
    const existingSolicitud = await db.solicitud.findFirst({
      where: {
        OR: [
          { usuarioId },
          { familiarId },
        ],
        createdAt: {
          gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
    });

    if (existingSolicitud) {
      return NextResponse.json({ error: "Ya existe una solicitud hecha por esta persona en el último año." }, { status: 400 });
    }

    // Crear la solicitud
    const solicitud = await db.solicitud.create({
      data: {
        usuarioId,
        familiarId,
        documentoId: "a3d50fb4-0fc3-4f6f-81a7-16786dce301a",
        detalle: {
          create: {
            Testigo1: testigo1,
            Testigo2: testigo2,
          },
        },
      },
    });

    return NextResponse.json({ succes: "Solicitud creada exitosamente.", solicitud }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}