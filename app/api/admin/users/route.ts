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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { search = "", role, page = "1", pageSize = "50" } =
      Object.fromEntries(request.nextUrl.searchParams.entries());

    const pageNumber = Math.max(Number(page) || 1, 1);
    const take = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
    const skip = (pageNumber - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page: pageNumber, pageSize: take });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      telefono?: string;
    };

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Nombre y correo son obligatorios" },
        { status: 400 },
      );
    }

    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo" },
        { status: 400 },
      );
    }

    let hashedPassword: string | null = null;
    if (body.password) {
      const bcrypt = await import("bcryptjs");
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    const user = await db.user.create({
      data: {
        name: body.name,
        email,
        password: hashedPassword,
        role: (body.role as any) || "CLIENT",
        telefono: body.telefono || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        telefono: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

