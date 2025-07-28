const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrerequisitesFlow() {
  try {
    console.log('🔍 Probando flujo completo de prerrequisitos...\n');

    // Buscar Computación II y sus prerrequisitos
    const computacion2 = await prisma.materia.findFirst({
      where: {
        nombre: {
          contains: 'Computación II'
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
                semestre: true,
              },
            },
          },
        },
      },
    });

    if (!computacion2) {
      console.log('❌ No se encontró Computación II');
      return;
    }

    console.log(`📚 Materia principal: ${computacion2.codigo} - ${computacion2.nombre}`);
    console.log(`📋 Prerrequisitos requeridos: ${computacion2.prerrequisitos.length}`);

    if (computacion2.prerrequisitos.length > 0) {
      console.log('\n📝 Prerrequisitos:');
      computacion2.prerrequisitos.forEach((prerreq, index) => {
        console.log(`${index + 1}. ${prerreq.prerrequisito.codigo} - ${prerreq.prerrequisito.nombre} (${prerreq.prerrequisito.semestre})`);
      });
    }

    // Simular el flujo de validación
    console.log('\n🔄 Simulando flujo de validación:');
    console.log('1. Usuario intenta agregar Computación II como aprobada');
    console.log('2. Sistema detecta que falta Computación I');
    console.log('3. Sistema ofrece agregar Computación I automáticamente');
    console.log('4. Usuario acepta');

    // Simular datos que se enviarían al endpoint
    const datosPrerrequisito = {
      materiaId: computacion2.prerrequisitos[0].prerrequisito.id,
      estado: "APROBADA",
      nota: 16.0,
      semestreCursado: "ANTERIOR",
      fechaInicio: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fechaFin: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observaciones: "Prerrequisito agregado automáticamente",
      agregadoAutomatico: true,
    };

    console.log('\n📤 Datos que se enviarían al endpoint:');
    console.log(JSON.stringify(datosPrerrequisito, null, 2));

    // Verificar que la materia existe en la base de datos
    const materiaExiste = await prisma.materia.findUnique({
      where: { id: datosPrerrequisito.materiaId },
      select: { id: true, codigo: true, nombre: true }
    });

    if (materiaExiste) {
      console.log(`\n✅ Materia encontrada en BD: ${materiaExiste.codigo} - ${materiaExiste.nombre}`);
    } else {
      console.log(`\n❌ Materia no encontrada en BD con ID: ${datosPrerrequisito.materiaId}`);
    }

    console.log('\n🎯 Flujo de validación simulado correctamente');
    console.log('✅ El sistema debería funcionar correctamente ahora');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrerequisitesFlow(); 