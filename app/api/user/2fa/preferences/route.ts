import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_METHODS = new Set(["TOTP", "PASSKEY", "EMAIL_OTP"]);

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      preferredMethod?: string;
      emailFallbackEnabled?: boolean;
    };

    const preferredMethod = (body.preferredMethod || "").toUpperCase();
    if (!ALLOWED_METHODS.has(preferredMethod)) {
      return NextResponse.json({ error: "Método 2FA inválido" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorPreferredMethod: preferredMethod,
        twoFactorEmailFallbackEnabled:
          typeof body.emailFallbackEnabled === "boolean"
            ? body.emailFallbackEnabled
            : true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating 2FA preferences:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

