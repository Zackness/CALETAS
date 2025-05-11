import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Asegúrate de que la ruta sea correcta

export async function GET(req: Request) {
  try {
    // Obtén la sesión del usuario
    const session = await auth();

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

    // Obtén los familiares relacionados al usuario autenticado
    const familiares = await db.familiar.findMany({
      where: {
        usuarioId: session.user.id,
      },
    });

    return NextResponse.json({ user, familiares }, { status: 200 });
  } catch (error) {
    console.error("Error interno del servidor:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}