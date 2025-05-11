const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {

  // Servicios con IDs específicos
  const servicios = [
    {
      id: "auto-service-id",
      nombre: 'Automovil',
      descripcion: 'Servicios legales relacionados con vehículos',
      documentos: [
        { 
          id: "4f3503c9-264b-476c-b751-9718c72a1ab6",
          nombre: 'Compra-venta de vehículo' 
        }
      ]
    },
    {
      id: "vivienda-service-id",
      nombre: "Vivienda",
      descripcion: "Servicios legales relacionados con viviendas",
      documentos: [
        {
          id: "vivienda-doc-id",
          nombre: 'Declaracion de no poseer vivienda'
        },
        {
          id: "vivienda-doc1-id",
          nombre: 'Compra-venta de vivienda'
        }
      ]
    },
    {
      id: "viajero-service-id",
      nombre: 'Viajero',
      descripcion: 'Servicios legales para viajeros',
      documentos: [
        { 
          id: "viajero-doc-id",
          nombre: 'Poder para viajero' 
        },
        {
          id: "viejero-doc1-id",
          nombre: 'Autorizaciones de viaje'
        }
      ]
    },
    {
      id: "herencia-service-id",
      nombre: "Herencia",
      descripcion: "Servicios legales relacionados con la herencia",
      documentos: [
        {
          id: "herencia-doc-id",
          nombre: 'Declaracion de sucesiones'
        }
      ]
    },
    {
      id: "personal-service-id",
      nombre: 'Personal',
      descripcion: 'Servicios legales de protección personal',
      documentos: [
        { 
          id: "personal-doc-id",
          nombre: 'Poder personal' 
        }
      ]
    },
    {
      id: "empresarial-service-id",
      nombre: "Empresarial",
      descripcion: "Sercicios relacionados con las empresas",
      documentos: [
        {
          id: "empresarial-doc-id",
          nombre: 'Contitucion de empresa PYME'
        },
        {
          id: "empresarial-doc1-id",
          nombre: 'Acta de asamblea de accionistas'
        }
      ]
    },
    {
      id: "migrante-service-id",
      nombre: 'Migrante',
      descripcion: 'Servicios legales migratorios',
      documentos: [
        { 
          id: "migrante-doc-id",
          nombre: 'Poder desde el exterior' 
        }
      ]
    },
    {
      id: "financiiera-service-id",
      nombre: "Financiera",
      descripcion: "Servicios legales relacionados con lo financieero",
      documentos: [
        {
          id: "financiera-doc-id",
          nombre: 'Certificacion de ingresos'
        },
        {
          id: "financiera-doc1-id",
          nombre: 'Balance personal'
        }
      ]
    }
  ];

  // Crear servicios y documentos
  for (const servicio of servicios) {
    const createdServicio = await prisma.servicio.create({
      data: {
        id: servicio.id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        documentos: {
          create: servicio.documentos
        }
      }
    });

    console.log(`Created servicio: ${createdServicio.nombre}`);
    for (const doc of servicio.documentos) {
      console.log(`  - Created documento: ${doc.nombre} (ID: ${doc.id})`);
    }
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 