const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllUsersFamiliares() {
    try {
        console.log('Iniciando eliminación de todos los usuarios familiares...');

        // Primero eliminamos los detalles relacionados
        await prisma.familiar.deleteMany();
        console.log('Familiares eliminados');

        //Luego eliminamos los usuarios
        await prisma.user.deleteMany();
        console.log('Usuarios eliminados');

        console.log('¡Proceso completado con éxito!');
    } catch (error) {
        console.error('Error al eliminar los usuarios familiares:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllUsersFamiliares();