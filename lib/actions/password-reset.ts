"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type PasswordResetRequestResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function requestPasswordResetWithEmailCheck(
  email: string,
  redirectTo: string,
): Promise<PasswordResetRequestResult> {
  const normalized = email.trim();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  const user = await db.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      password: true,
      authAccounts: {
        where: { providerId: "credential" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return {
      ok: false,
      error:
        "Este correo no está registrado en CALETAS. Verifica que lo escribiste bien o crea una cuenta nueva.",
    };
  }

  const hasPassword = Boolean(user.password) || user.authAccounts.length > 0;

  if (!hasPassword) {
    return {
      ok: false,
      error:
        "Esta cuenta no tiene contraseña porque se creó con Google o Twitch. Inicia sesión con ese método.",
    };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error("[password-reset] requestPasswordReset failed:", error);
    return {
      ok: false,
      error: "No se pudo enviar el enlace. Intenta de nuevo en unos minutos.",
    };
  }

  return {
    ok: true,
    message:
      "Te enviamos un enlace de recuperación a tu correo. Revisa tu bandeja de entrada y spam.",
  };
}
