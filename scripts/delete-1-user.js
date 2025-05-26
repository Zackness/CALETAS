const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteOneUser() {
  try {
    console.log('Iniciando eliminación del usuario...');
    const userId = 'cma5v3k9i0000l404qjdrjt3m';
    
    // Primero eliminamos las notificaciones
    console.log('Eliminando notificaciones...');
    await prisma.notificacion.deleteMany({
      where: { usuarioId: userId }
    });

    // Eliminamos los documentos editables
    console.log('Eliminando documentos editables...');
    await prisma.documentoEditable.deleteMany({
      where: { habilitadoPor: userId }
    });

    // Eliminamos las solicitudes asignadas como abogado
    console.log('Eliminando solicitudes asignadas...');
    await prisma.solicitudAbogado.deleteMany({
      where: { abogadoId: userId }
    });

    // Eliminamos las asignaciones realizadas
    console.log('Eliminando asignaciones realizadas...');
    await prisma.solicitudAbogado.deleteMany({
      where: { asignadoPor: userId }
    });

    // Obtenemos todas las solicitudes del usuario
    console.log('Obteniendo solicitudes del usuario...');
    const solicitudes = await prisma.solicitud.findMany({
      where: { usuarioId: userId },
      select: { id: true }
    });

    // Para cada solicitud, eliminamos sus relaciones primero
    for (const solicitud of solicitudes) {
      console.log(`Eliminando relaciones de la solicitud ${solicitud.id}...`);
      
      // Eliminamos los detalles de la solicitud
      await prisma.detalle.deleteMany({
        where: { solicitudId: solicitud.id }
      });

      // Eliminamos los documentos editables de la solicitud
      await prisma.documentoEditable.deleteMany({
        where: { solicitudId: solicitud.id }
      });

      // Eliminamos las notificaciones de la solicitud
      await prisma.notificacion.deleteMany({
        where: { solicitudId: solicitud.id }
      });

      // Eliminamos las asignaciones de abogados de la solicitud
      await prisma.solicitudAbogado.deleteMany({
        where: { solicitudId: solicitud.id }
      });
    }

    // Ahora podemos eliminar las solicitudes
    console.log('Eliminando solicitudes...');
    await prisma.solicitud.deleteMany({
      where: { usuarioId: userId }
    });

    // Eliminamos los familiares
    console.log('Eliminando familiares...');
    await prisma.familiar.deleteMany({
      where: { usuarioId: userId }
    });

    // Eliminamos la suscripción de Stripe
    console.log('Eliminando suscripción de Stripe...');
    await prisma.userSubscription.deleteMany({
      where: { userId: userId }
    });

    // Eliminamos el cliente de Stripe
    console.log('Eliminando cliente de Stripe...');
    await prisma.stripeCustomer.deleteMany({
      where: { userId: userId }
    });

    // Eliminamos la confirmación de dos factores
    console.log('Eliminando confirmación de dos factores...');
    await prisma.twoFactorConfirmation.deleteMany({
      where: { userId: userId }
    });

    // Eliminamos las cuentas
    console.log('Eliminando cuentas...');
    await prisma.account.deleteMany({
      where: { userId: userId }
    });

    // Finalmente eliminamos el usuario
    console.log('Eliminando usuario...');
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log('Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOneUser();