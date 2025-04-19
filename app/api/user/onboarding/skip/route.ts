import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Actualizar el estado de onboarding a CANCELADO
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingStatus: "CANCELADO",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al saltar el onboarding:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 