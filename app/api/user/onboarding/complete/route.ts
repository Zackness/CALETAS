import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { userData, spouseData } = await req.json();

    // Validar los datos del usuario
    if (!userData?.cedula || !userData?.nombre || !userData?.fechaNacimiento) {
      return new NextResponse("Faltan datos requeridos del usuario", { status: 400 });
    }

    // Actualizar el usuario con los datos extraídos
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        cedula: userData.cedula,
        name: userData.nombre,
        name2: userData.nombre2,
        apellido: userData.apellido,
        apellido2: userData.apellido2,
        fechaNacimiento: new Date(userData.fechaNacimiento),
        onboardingStatus: "FINALIZADO",
      },
    });

    // Si hay datos del cónyuge, crear un familiar
    if (spouseData?.cedula && spouseData?.nombre) {
      await db.familiar.create({
        data: {
          nombre: spouseData.nombre,
          nombre2: spouseData.nombre2,
          apellido: spouseData.apellido,
          apellido2: spouseData.apellido2,
          cedula: spouseData.cedula,
          parentesco: "ESPOSO",
          fechaNacimiento: spouseData.fechaNacimiento ? new Date(spouseData.fechaNacimiento) : null,
          usuarioId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al completar el onboarding:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 