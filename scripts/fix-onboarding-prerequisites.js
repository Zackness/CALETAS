const { PrismaClient, EstadoMateria, OnboardingStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOnboardingPrerequisites() {
  try {
    console.log('🔧 Iniciando corrección de prerrequisitos del onboarding...');

    // Obtener todos los usuarios que han completado el onboarding
    const users = await prisma.user.findMany({
      where: {
        onboardingStatus: OnboardingStatus.COMPLETADO,
        userType: 'allied'
      },
      include: {
        materiasEstudiante: {
          include: {
            materia: {
              include: {
                prerrequisitos: {
                  include: {
                    prerrequisito: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Encontrados ${users.length} usuarios con onboarding completado`);

    let totalFixed = 0;

    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.name} (${user.email})`);
      
      // Obtener materias en curso del usuario
      const materiasEnCurso = user.materiasEstudiante.filter(
        me => me.estado === EstadoMateria.EN_CURSO
      );

      console.log(`📚 Materias en curso: ${materiasEnCurso.length}`);

      // Para cada materia en curso, verificar sus prerrequisitos
      for (const materiaEnCurso of materiasEnCurso) {
        const prerrequisitos = materiaEnCurso.materia.prerrequisitos;
        
        console.log(`  🔍 Verificando prerrequisitos de ${materiaEnCurso.materia.codigo} - ${materiaEnCurso.materia.nombre}`);
        
        for (const prerreq of prerrequisitos) {
          const prerrequisitoId = prerreq.prerrequisito.id;
          
          // Verificar si el prerrequisito ya está marcado como aprobado
          const prerrequisitoExistente = user.materiasEstudiante.find(
            me => me.materiaId === prerrequisitoId
          );

          if (!prerrequisitoExistente) {
            // Crear registro del prerrequisito como aprobado
            console.log(`    ✅ Creando prerrequisito: ${prerreq.prerrequisito.codigo} - ${prerreq.prerrequisito.nombre}`);
            
            await prisma.materiaEstudiante.create({
              data: {
                userId: user.id,
                materiaId: prerrequisitoId,
                estado: EstadoMateria.APROBADA,
                nota: 16.0, // Nota por defecto
                semestreCursado: "ANTERIOR",
                fechaInicio: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 meses atrás
                fechaFin: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000), // 1 mes atrás
                observaciones: "Prerrequisito marcado automáticamente durante corrección del onboarding"
              }
            });
            
            totalFixed++;
          } else if (prerrequisitoExistente.estado !== EstadoMateria.APROBADA) {
            // Actualizar estado del prerrequisito existente a aprobado
            console.log(`    🔄 Actualizando estado de prerrequisito: ${prerreq.prerrequisito.codigo}`);
            
            await prisma.materiaEstudiante.update({
              where: { id: prerrequisitoExistente.id },
              data: {
                estado: EstadoMateria.APROBADA,
                nota: prerrequisitoExistente.nota || 16.0,
                observaciones: prerrequisitoExistente.observaciones 
                  ? `${prerrequisitoExistente.observaciones} (Estado corregido automáticamente)`
                  : "Estado corregido automáticamente durante corrección del onboarding"
              }
            });
            
            totalFixed++;
          } else {
            console.log(`    ✅ Prerrequisito ya aprobado: ${prerreq.prerrequisito.codigo}`);
          }
        }
      }
    }

    console.log(`\n🎉 Corrección completada!`);
    console.log(`📈 Total de registros corregidos: ${totalFixed}`);
    console.log(`👥 Usuarios procesados: ${users.length}`);

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
fixOnboardingPrerequisites(); 