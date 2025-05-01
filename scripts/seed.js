const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Empresas
  const empresas = [
    {
      id: "empresa-1",
      nombre: "Seguros Caracas",
      direccion: "Av. Libertador, Caracas",
      telefono: "0212-555-1234",
      RIF: "J-123456789",
      persona_de_contacto: "Juan Pérez",
      email: "contacto@seguroscaracas.com",
      tipo: "SEGURO"
    },
    {
      id: "empresa-2",
      nombre: "Telecom Venezuela",
      direccion: "Av. Bolívar, Caracas",
      telefono: "0212-555-5678",
      RIF: "J-987654321",
      persona_de_contacto: "María González",
      email: "contacto@telecomvenezuela.com",
      tipo: "TELECOMUNICACIONES"
    },
    {
      id: "empresa-3",
      nombre: "Banco Nacional",
      direccion: "Av. Francisco de Miranda, Caracas",
      telefono: "0212-555-9012",
      RIF: "J-456789123",
      persona_de_contacto: "Carlos Rodríguez",
      email: "contacto@bancanacional.com",
      tipo: "BANCO"
    }
  ];

  // Crear empresas
  for (const empresa of empresas) {
    const createdEmpresa = await prisma.empresa.create({
      data: empresa
    });
    console.log(`Created empresa: ${createdEmpresa.nombre}`);
  }

  // Servicios con IDs específicos
  const servicios = [
    {
      id: "auto-service-id",
      nombre: 'Protección Automovil',
      descripcion: 'Servicios legales relacionados con vehículos',
      documentos: [
        { 
          id: "4f3503c9-264b-476c-b751-9718c72a1ab6",
          nombre: 'Compra-venta de vehículo' 
        }
      ]
    },
    {
      id: "viajero-service-id",
      nombre: 'Protección Viajero',
      descripcion: 'Servicios legales para viajeros',
      documentos: [
        { 
          id: "viajero-doc-id",
          nombre: 'Poder para viajero' 
        }
      ]
    },
    {
      id: "personal-service-id",
      nombre: 'Protección Personal',
      descripcion: 'Servicios legales de protección personal',
      documentos: [
        { 
          id: "personal-doc-id",
          nombre: 'Poder personal' 
        }
      ]
    },
    {
      id: "migrante-service-id",
      nombre: 'Protección Migratoria',
      descripcion: 'Servicios legales migratorios',
      documentos: [
        { 
          id: "migrante-doc-id",
          nombre: 'Poder desde el exterior' 
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