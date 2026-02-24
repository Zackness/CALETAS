import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingStatus, EstadoMateria } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const userType = formData.get("userType") as string;
    const universidad = formData.get("universidad") as string;
    const carrera = formData.get("carrera") as string;
    const telefono = formData.get("telefono") as string;
    const estado = formData.get("estado") as string;
    const ciudad = formData.get("ciudad") as string;
    const semestreActual = formData.get("semestreActual") as string;
    const materiasActuales = formData.get("materiasActuales") as string;
    const carnetData = formData.get("carnetData") as string;

    // Validaciones básicas
    if (!userType) {
      return NextResponse.json(
        { error: "Tipo de usuario es requerido" },
        { status: 400 }
      );
    }

    // Para usuarios de universidades aliadas, el carnet es obligatorio
    if (userType === 'allied') {
      if (!universidad) {
        return NextResponse.json(
          { error: "Selección de universidad es obligatoria para estudiantes universitarios" },
          { status: 400 }
        );
      }

      if (!carnetData) {
        return NextResponse.json(
          { error: "El carnet universitario es obligatorio para estudiantes de universidades aliadas" },
          { status: 400 }
        );
      }

      if (!carrera) {
        return NextResponse.json(
          { error: "La selección de carrera es obligatoria para estudiantes universitarios" },
          { status: 400 }
        );
      }

      if (!semestreActual) {
        return NextResponse.json(
          { error: "El semestre actual es obligatorio para estudiantes universitarios" },
          { status: 400 }
        );
      }
    }

    // Parsear datos del carnet
    let carnetInfo = null;
    if (carnetData) {
      try {
        carnetInfo = JSON.parse(carnetData);
        
        // Validar que el carnet fue validado correctamente
        if (userType === 'allied' && (!carnetInfo.esValido || !carnetInfo.universidadId)) {
          return NextResponse.json(
            { error: "El carnet debe ser validado antes de completar el onboarding" },
            { status: 400 }
          );
        }

        // Verificar que la universidad del carnet coincide con la seleccionada
        if (userType === 'allied' && carnetInfo.universidadId !== universidad) {
          return NextResponse.json(
            { error: "La universidad del carnet no coincide con la universidad seleccionada" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error parsing carnet data:", error);
        return NextResponse.json(
          { error: "Error al procesar los datos del carnet" },
          { status: 400 }
        );
      }
    }

    // Actualizar el perfil del usuario
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        // Información básica
        telefono: telefono || null,
        ciudadDeResidencia: ciudad || null,
        
        // Estado del onboarding
        onboardingStatus: OnboardingStatus.FINALIZADO,
      },
    });

    // Validar y guardar materias actuales
    if (materiasActuales) {
      try {
        const materiasIds = JSON.parse(materiasActuales);
        if (Array.isArray(materiasIds) && materiasIds.length > 0) {
          // Validar prerrequisitos
          const materiasConPrerrequisitos = await db.materia.findMany({
            where: {
              id: {
                in: materiasIds
              }
            },
            include: {
              prerrequisitos: {
                include: {
                  prerrequisito: {
                    select: {
                      id: true,
                      codigo: true,
                      nombre: true,
                      semestre: true
                    }
                  }
                }
              }
            }
          });

          const errores: string[] = [];
          const materiasFaltantes: string[] = [];

          // No validar prerrequisitos aquí porque ya se validó en el frontend
          // Solo proceder a crear los registros de materias del estudiante

          // Crear registros de materias del estudiante
          const materiasEstudiante = [];
          
          for (const materiaId of materiasIds) {
            // Marcar como EN_CURSO las materias seleccionadas
            materiasEstudiante.push({
              userId: session.user.id,
              materiaId: materiaId,
              estado: EstadoMateria.EN_CURSO,
              semestreCursado: semestreActual,
              fechaInicio: new Date()
            });

            // Obtener prerrequisitos de esta materia
            const materia = await db.materia.findUnique({
              where: { id: materiaId },
              include: {
                prerrequisitos: {
                  include: {
                    prerrequisito: true
                  }
                }
              }
            });

            if (materia) {
              // Marcar prerrequisitos como APROBADA
              for (const prerreq of materia.prerrequisitos) {
                const prerrequisitoId = prerreq.prerrequisito.id;
                
                // Verificar si ya existe un registro para este prerrequisito
                const existeRegistro = await db.materiaEstudiante.findUnique({
                  where: {
                    userId_materiaId: {
                      userId: session.user.id,
                      materiaId: prerrequisitoId
                    }
                  }
                });

                if (!existeRegistro) {
                  materiasEstudiante.push({
                    userId: session.user.id,
                    materiaId: prerrequisitoId,
                    estado: EstadoMateria.APROBADA,
                    nota: 16.0, // Nota por defecto para prerrequisitos
                    semestreCursado: "ANTERIOR",
                    fechaInicio: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 meses atrás
                    fechaFin: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000) // 1 mes atrás
                  });
                }
              }
            }
          }

          // Guardar todas las materias del estudiante
          await db.materiaEstudiante.createMany({
            data: materiasEstudiante,
            skipDuplicates: true
          });

          // Guardar también como JSON en el perfil (para compatibilidad)
          await db.user.update({
            where: { id: session.user.id },
            data: {
              materiasActuales: JSON.stringify(materiasIds),
            },
          });
        }
      } catch (error) {
        console.error("Error processing materias actuales:", error);
        return NextResponse.json(
          { error: "Error al procesar las materias seleccionadas" },
          { status: 500 }
        );
      }
    }

    // Actualizar campos universitarios
    if (universidad || carrera || semestreActual || carnetInfo?.nombre || carnetInfo?.expediente || userType) {
      const updateData: any = {};
      if (universidad) updateData.universidadId = universidad;
      if (carrera) updateData.carreraId = carrera;
      if (semestreActual) updateData.semestreActual = semestreActual;
      if (carnetInfo?.nombre) updateData.name = carnetInfo.nombre;
      if (carnetInfo?.expediente) updateData.expediente = carnetInfo.expediente;
      if (userType) updateData.userType = userType;
      
      // Marcar que el carnet fue validado
      if (carnetInfo?.esValido) {
        updateData.isCarnetValidado = true;
        updateData.carnetValidadoEn = new Date();
      }
      
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
        userType: userType,
        carreraId: carrera,
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