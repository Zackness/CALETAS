import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmailVerificationCodeEmail } from "@/lib/mail";

const TTL_MINUTES = 10;

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, isEmailVerified: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    if (user.isEmailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const code = randomCode();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    const identifier = `email_verify_code:${user.id}`;

    // Guardamos el código en texto (tamaño y alcance limitado) dentro de AuthVerification.
    // Si quieres endurecerlo luego, lo cambiamos a hash.
    await db.authVerification.upsert({
      where: { id: identifier },
      update: { value: code, expiresAt },
      create: { id: identifier, identifier, value: code, expiresAt },
    });

    await sendEmailVerificationCodeEmail(user.email, code);
    return NextResponse.json({ ok: true, expiresInMinutes: TTL_MINUTES });
  } catch (e) {
    console.error("Error sending email verification code:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

