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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      telefono?: string | null;
      isEmailVerified?: boolean;
      isTwoFactorEnabled?: boolean;
    };

    const data: any = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase().trim();
    if (body.role !== undefined) data.role = body.role;
    if (body.telefono !== undefined) data.telefono = body.telefono;
    if (body.isEmailVerified !== undefined) data.isEmailVerified = body.isEmailVerified;
    if (body.isTwoFactorEnabled !== undefined) {
      data.isTwoFactorEnabled = body.isTwoFactorEnabled;
    }

    if (body.password) {
      const bcrypt = await import("bcryptjs");
      data.password = await bcrypt.hash(body.password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        telefono: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

