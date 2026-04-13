import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const body = (await request.json()) as {
      nombre?: string;
      siglas?: string;
      tipo?: string;
      estado?: string;
      ciudad?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
      website?: string;
    };

    const nombre = body.nombre?.trim();
    const siglas = body.siglas?.trim().toUpperCase();
    if (!nombre || !siglas) {
      return NextResponse.json({ error: "Nombre y siglas son obligatorios" }, { status: 400 });
    }

    const universidad = await db.universidad.create({
      data: {
        nombre,
        siglas,
        tipo: body.tipo?.trim() || "UNIVERSIDAD",
        estado: body.estado?.trim() || "N/A",
        ciudad: body.ciudad?.trim() || "N/A",
        direccion: body.direccion?.trim() || "Por definir",
        telefono: body.telefono?.trim() || "Por definir",
        email: body.email?.trim() || `${siglas.toLowerCase()}@institucion.local`,
        website: body.website?.trim() || null,
        isActive: true,
      },
      select: { id: true, nombre: true, siglas: true, tipo: true },
    });

    return NextResponse.json({ universidad }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una institución con ese nombre o siglas" }, { status: 409 });
    }
    console.error("Error creating institution:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
