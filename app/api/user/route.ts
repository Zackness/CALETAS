import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCorsHeaders } from '@/lib/cors';

export async function GET(req: Request) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      const res = new NextResponse("No tienes autorización", { status: 401 });
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Obtén los datos del usuario autenticado (sin campos sensibles como `password`)
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        apellido: true,
        ciudadDeResidencia: true,
        telefono: true,
        isTwoFactorEnabled: true,
        isEmailVerified: true,
        carrera: {
          select: {
            nombre: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        authAccounts: {
          select: {
            providerId: true,
          },
        },
      },
    });

    if (!user) {
      const res = NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const providers = user.authAccounts.map((a) => a.providerId);
    const hasCredentialAccount = providers.includes("credential");
    const isOAuth = providers.some((p) => p !== "credential");

    const res = NextResponse.json(
      {
        user: {
          ...user,
          authAccounts: undefined,
        },
        isOAuth,
        hasCredentialAccount,
      },
      { status: 200 },
    );
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (error) {
    console.error("Error interno del servidor:", error);
    const res = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}