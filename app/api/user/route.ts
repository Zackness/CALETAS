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

    // Obtén los datos del usuario autenticado
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error interno del servidor:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}