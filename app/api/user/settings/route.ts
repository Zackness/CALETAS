import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { getUserByEmail, getUserById } from "@/data/user";
import bcrypt from "bcrypt";

type SettingsBody = {
  email?: string;
  password?: string;
  newPassword?: string;
  telefono?: string;
  ciudadDeResidencia?: string;
};

function withCors(res: NextResponse, req: NextRequest) {
  const cors = getCorsHeaders(req);
  Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(
        NextResponse.json({ error: "No tienes autorización" }, { status: 401 }),
        request,
      );
    }

    const body = (await request.json()) as SettingsBody;

    const dbUser = await getUserById(session.user.id);
    if (!dbUser) {
      return withCors(
        NextResponse.json({ error: "No tienes autorización" }, { status: 401 }),
        request,
      );
    }

    const linkedAccounts = await db.authAccount.findMany({
      where: { userId: session.user.id },
      select: { providerId: true },
    });
    const isOAuth = linkedAccounts.some((a) => a.providerId !== "credential");

    const typedValues = { ...body };
    if (isOAuth) {
      typedValues.email = undefined;
      typedValues.password = undefined;
      typedValues.newPassword = undefined;
    }

    if (typedValues.email && typedValues.email !== session.user.email) {
      const existingUser = await getUserByEmail(typedValues.email);
      if (existingUser && existingUser.id !== session.user.id) {
        return withCors(
          NextResponse.json(
            { error: "El correo electrónico se encuentra en uso" },
            { status: 400 },
          ),
          request,
        );
      }
      await auth.api.changeEmail({
        body: {
          newEmail: typedValues.email,
          callbackURL: "/ajustes",
        },
        headers: request.headers,
      });
      return withCors(
        NextResponse.json({
          succes: "Hemos enviado un correo para verificar tu nuevo Email",
        }),
        request,
      );
    }

    if (typedValues.password && typedValues.newPassword) {
      const passwordsMatch = await bcrypt.compare(
        typedValues.password,
        dbUser.password || "",
      );
      if (!passwordsMatch) {
        return withCors(
          NextResponse.json(
            { error: "Contraseña incorrecta" },
            { status: 400 },
          ),
          request,
        );
      }
      const hashedPassword = await bcrypt.hash(typedValues.newPassword, 10);
      typedValues.password = hashedPassword;
      (typedValues as Record<string, unknown>).newPassword = undefined;
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        email: typedValues.email || undefined,
        password: (typedValues as { password?: string }).password || undefined,
        telefono: typedValues.telefono ?? undefined,
        ciudadDeResidencia: typedValues.ciudadDeResidencia ?? undefined,
      },
    });

    return withCors(
      NextResponse.json({ succes: "Configuración actualizada!" }),
      request,
    );
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return withCors(
      NextResponse.json(
        { error: "Algo ha salido mal!" },
        { status: 500 },
      ),
      request,
    );
  }
}
