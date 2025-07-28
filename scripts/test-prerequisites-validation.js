const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrerequisitesValidation() {
  try {
    console.log('🔍 Probando validación de prerrequisitos...\n');

    // Buscar Computación II en la base de datos
    const computacion2 = await prisma.materia.findFirst({
      where: {
        nombre: {
          contains: 'Computación'
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
      console.log('❌ No se encontró Computación II en la base de datos');
      return;
    }

    console.log(`📚 Materia encontrada: ${computacion2.codigo} - ${computacion2.nombre}`);
    console.log(`📋 Prerrequisitos: ${computacion2.prerrequisitos.length}`);

    if (computacion2.prerrequisitos.length > 0) {
      console.log('\n📝 Lista de prerrequisitos:');
      computacion2.prerrequisitos.forEach((prerreq, index) => {
        console.log(`${index + 1}. ${prerreq.prerrequisito.codigo} - ${prerreq.prerrequisito.nombre} (${prerreq.prerrequisito.semestre})`);
      });
    } else {
      console.log('✅ Esta materia no tiene prerrequisitos');
    }

    // Buscar Computación I para verificar si existe
    const computacion1 = await prisma.materia.findFirst({
      where: {
        nombre: {
          contains: 'Computación I'
        }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        semestre: true,
      },
    });

    if (computacion1) {
      console.log(`\n✅ Computación I encontrada: ${computacion1.codigo} - ${computacion1.nombre} (${computacion1.semestre})`);
    } else {
      console.log('\n❌ Computación I no encontrada en la base de datos');
    }

    // Buscar todas las materias que contengan "Computación"
    const materiasComputacion = await prisma.materia.findMany({
      where: {
        nombre: {
          contains: 'Computación'
        }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        semestre: true,
      },
      orderBy: {
        codigo: 'asc'
      }
    });

    console.log('\n📚 Todas las materias de Computación:');
    materiasComputacion.forEach((materia, index) => {
      console.log(`${index + 1}. ${materia.codigo} - ${materia.nombre} (${materia.semestre})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrerequisitesValidation(); 