import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Obtén la sesión del usuario
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    // Verifica si el usuario está autenticado
    if (!session?.user?.id) {
      return new NextResponse("No tienes autorización", { status: 401 });
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
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const providers = user.authAccounts.map((a) => a.providerId);
    const hasCredentialAccount = providers.includes("credential");
    const isOAuth = providers.some((p) => p !== "credential");

    return NextResponse.json(
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
  } catch (error) {
    console.error("Error interno del servidor:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}