const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllSolicitudes() {
  try {
    console.log('Iniciando eliminación de todas las solicitudes...');
    
    // Primero eliminamos los detalles relacionados
    await prisma.detalle.deleteMany();
    console.log('Detalles eliminados');
    
    // Luego eliminamos las notas relacionadas
    await prisma.nota.deleteMany();
    console.log('Notas eliminadas');
    
    // Finalmente eliminamos las solicitudes
    await prisma.solicitud.deleteMany();
    console.log('Solicitudes eliminadas');
    
    console.log('¡Proceso completado con éxito!');
  } catch (error) {
    console.error('Error al eliminar las solicitudes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllSolicitudes(); 