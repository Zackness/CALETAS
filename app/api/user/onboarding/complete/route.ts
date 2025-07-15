import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingStatus, EstadoDeResidencia } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const userType = formData.get("userType") as string;
    const universidad = formData.get("universidad") as string;
    const telefono = formData.get("telefono") as string;
    const estado = formData.get("estado") as string;
    const ciudad = formData.get("ciudad") as string;
    const semestreActual = formData.get("semestreActual") as string;
    const materiasActuales = formData.get("materiasActuales") as string;
    const carnetData = formData.get("carnetData") as string;

    // Parsear datos del carnet
    let carnetInfo = null;
    if (carnetData) {
      try {
        carnetInfo = JSON.parse(carnetData);
      } catch (error) {
        console.error("Error parsing carnet data:", error);
      }
    }

    // Actualizar el perfil del usuario - solo campos básicos por ahora
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        // Información básica
        telefono: telefono || null,
        EstadoDeResidencia: estado as EstadoDeResidencia || null,
        ciudadDeResidencia: ciudad || null,
        
        // Estado del onboarding
        onboardingStatus: OnboardingStatus.FINALIZADO,
      },
    });

    // Si hay materias actuales, guardarlas
    if (materiasActuales) {
      try {
        const materiasIds = JSON.parse(materiasActuales);
        if (Array.isArray(materiasIds) && materiasIds.length > 0) {
          // Aquí podrías guardar las materias actuales en una tabla separada
          // Por ahora solo las guardamos como JSON en el perfil
          await db.user.update({
            where: { id: session.user.id },
        data: {
              materiasActuales: materiasIds,
            },
          });
        }
      } catch (error) {
        console.error("Error parsing materias actuales:", error);
      }
    }

    // Actualizar campos universitarios usando SQL directo
    if (universidad || semestreActual || carnetInfo?.nombre || carnetInfo?.expediente || userType) {
      const updateData: any = {};
      if (universidad) updateData.universidadId = universidad;
      if (semestreActual) updateData.semestreActual = semestreActual;
      if (carnetInfo?.nombre) updateData.name = carnetInfo.nombre;
      if (carnetInfo?.expediente) updateData.expediente = carnetInfo.expediente;
      if (userType) updateData.userType = userType;
      
      await db.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      message: "Onboarding completado exitosamente",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        expediente: updatedUser.expediente,
        universidadId: updatedUser.universidadId,
        semestreActual: updatedUser.semestreActual,
        onboardingStatus: updatedUser.onboardingStatus,
      },
    });

  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 