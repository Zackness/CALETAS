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
      universidadId?: string;
      nombre?: string;
      codigo?: string;
      descripcion?: string;
      duracion?: number;
      creditos?: number;
    };

    if (!body.universidadId || !body.nombre?.trim() || !body.codigo?.trim()) {
      return NextResponse.json({ error: "universidadId, nombre y código son obligatorios" }, { status: 400 });
    }

    const carrera = await db.carrera.create({
      data: {
        universidadId: body.universidadId,
        nombre: body.nombre.trim(),
        codigo: body.codigo.trim().toUpperCase(),
        descripcion: body.descripcion?.trim() || null,
        duracion: Math.max(1, Number(body.duracion ?? 10)),
        creditos: Math.max(0, Number(body.creditos ?? 0)),
        isActive: true,
      },
      select: { id: true, nombre: true, codigo: true, universidadId: true },
    });

    return NextResponse.json({ carrera }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una carrera con ese código" }, { status: 409 });
    }
    console.error("Error creating carrera:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
