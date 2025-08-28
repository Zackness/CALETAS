const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanCaletas() {
  try {
    console.log('🧹 Iniciando limpieza de caletas...');
    
    // Primero eliminamos los favoritos asociados
    const deletedFavoritos = await prisma.favorito.deleteMany({});
    console.log(`✅ Eliminados ${deletedFavoritos.count} favoritos`);
    
    // Luego eliminamos todos los recursos (caletas)
    const deletedRecursos = await prisma.recurso.deleteMany({});
    console.log(`✅ Eliminados ${deletedRecursos.count} recursos (caletas)`);
    
    console.log('🎉 Limpieza completada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Favoritos eliminados: ${deletedFavoritos.count}`);
    console.log(`   - Recursos eliminados: ${deletedRecursos.count}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanCaletas();
