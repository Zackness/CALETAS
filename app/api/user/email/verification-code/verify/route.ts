import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as { code?: string };
    const code = String(body?.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isEmailVerified: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    if (user.isEmailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const identifier = `email_verify_code:${user.id}`;
    const row = await db.authVerification.findUnique({
      where: { id: identifier },
      select: { value: true, expiresAt: true },
    });
    if (!row) return NextResponse.json({ error: "No hay código activo. Reenvía el código." }, { status: 400 });
    if (row.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "El código expiró. Reenvía el código." }, { status: 400 });
    }
    if (row.value !== code) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerified: new Date() },
      }),
      db.authVerification.delete({ where: { id: identifier } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error verifying email code:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

