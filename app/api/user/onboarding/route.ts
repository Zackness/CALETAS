import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingStatus: true },
    });

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }

    return NextResponse.json({ onboardingStatus: user.onboardingStatus });
  } catch (error) {
    console.error("[ONBOARDING_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const status = formData.get("status") as OnboardingStatus | null;

    if (!file && !status) {
      return new NextResponse("Se requiere un archivo o estado", { status: 400 });
    }

    let documentUrl = null;

    if (file) {
      // Aquí implementaremos la lógica para subir el archivo a un servicio de almacenamiento
      // Por ahora, solo actualizamos el estado
      documentUrl = "placeholder_url";
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStatus: status || OnboardingStatus.FINALIZADO,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ONBOARDING_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 