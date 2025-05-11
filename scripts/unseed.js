const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Primero eliminamos todas las solicitudes que puedan estar relacionadas
    console.log('Eliminando solicitudes existentes...');
    await prisma.solicitud.deleteMany({});
    
    // Luego eliminamos todos los documentos
    console.log('Eliminando documentos existentes...');
    await prisma.documento.deleteMany({});
    
    // Finalmente eliminamos todos los servicios
    console.log('Eliminando servicios existentes...');
    await prisma.servicio.deleteMany({});
    
    console.log('Base de datos limpiada exitosamente');
  } catch (error) {
    console.error('Error durante la limpieza:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error ejecutando unseed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 