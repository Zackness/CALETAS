const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Limpiando materias duplicadas de UNEXPO...');
    
    // Obtener las carreras de UNEXPO
    const carreras = await prisma.carrera.findMany({
      where: {
        universidad: {
          siglas: "UNEXPO"
        }
      },
      select: {
        id: true,
        nombre: true,
        codigo: true
      }
    });
    
    console.log(`📚 Encontradas ${carreras.length} carreras de UNEXPO`);
    
    // Eliminar todas las materias de UNEXPO
    console.log('🗑️ Eliminando todas las materias existentes de UNEXPO...');
    const deletedMaterias = await prisma.materia.deleteMany({
      where: {
        carrera: {
          universidad: {
            siglas: "UNEXPO"
          }
        }
      }
    });
    console.log(`✅ Eliminadas ${deletedMaterias.count} materias existentes`);
    
    console.log('🎉 ¡Limpieza completada! Ahora puedes ejecutar el script de materias nuevamente.');
    
  } catch (error) {
    console.error('❌ Error limpiando materias:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 