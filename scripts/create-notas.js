// Script para crear notas predefinidas en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando creación de notas predefinidas...');

    // Nota básica con ID específico
    const notaBasica = await prisma.nota.upsert({
      where: { id: "e20313fa-a6a3-4585-8b1f-9151452976a1" },
      update: {
        contenido: "No se ha asignado ninguna nota a esta solicitud. Esta es la nota por defecto para solicitudes sin notas específicas.",
        updatedAt: new Date(),
      },
      create: {
        id: "e20313fa-a6a3-4585-8b1f-9151452976a1",
        contenido: "No se ha asignado ninguna nota a esta solicitud. Esta es la nota por defecto para solicitudes sin notas específicas.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('Nota básica creada/actualizada:', notaBasica);

    // Notas genéricas para todos los tipos de solicitudes
    const notasGenericas = [
      {
        contenido: "Su solicitud ha sido recibida correctamente. Estamos procesando su documentación. Le notificaremos cuando haya actualizaciones.",
      },
      {
        contenido: "Su solicitud requiere información adicional. Por favor, complete todos los campos obligatorios correctamente.",
      },
      {
        contenido: "Los documentos adjuntos a su solicitud no son claros o están incompletos. Por favor, suba nuevamente los documentos con mejor calidad y asegúrese de que estén completos.",
      },
      {
        contenido: "Su solicitud ha sido aprobada. Puede proceder a recoger su documento en nuestras oficinas.",
      },
      {
        contenido: "Lamentamos informarle que su solicitud ha sido rechazada debido a información inconsistente. Por favor, verifique los datos proporcionados y envíe una nueva solicitud.",
      },
      {
        contenido: "Su solicitud está pendiente de revisión. Nuestro equipo la está analizando y le notificaremos cuando haya actualizaciones.",
      },
      {
        contenido: "Su solicitud está en proceso. Estamos trabajando en ella y le notificaremos cuando haya actualizaciones.",
      },
      {
        contenido: "Su solicitud ha sido finalizada. Gracias por confiar en nuestros servicios.",
      },
      {
        contenido: "Se requiere la presencia de testigos para completar su solicitud. Por favor, proporcione los datos completos de los testigos.",
      },
      {
        contenido: "Su solicitud requiere documentación adicional. Por favor, adjunte todos los documentos necesarios.",
      },
      {
        contenido: "Su solicitud está pendiente de pago. Por favor, complete el proceso de pago para continuar.",
      },
      {
        contenido: "Su solicitud ha sido enviada a un abogado para revisión. Le notificaremos cuando haya una respuesta.",
      },
      {
        contenido: "Su solicitud requiere una firma digital. Por favor, complete el proceso de firma para continuar.",
      },
      {
        contenido: "Su solicitud está pendiente de verificación de identidad. Por favor, proporcione los documentos de identidad solicitados.",
      },
      {
        contenido: "Su solicitud ha sido programada para una audiencia. Le enviaremos los detalles por correo electrónico.",
      }
    ];

    for (const nota of notasGenericas) {
      const notaCreada = await prisma.nota.create({
        data: {
          contenido: nota.contenido,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('Nota genérica creada:', notaCreada);
    }

    console.log('Todas las notas predefinidas han sido creadas correctamente.');
  } catch (error) {
    console.error('Error al crear las notas predefinidas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 