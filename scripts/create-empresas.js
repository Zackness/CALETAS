const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Empresas
  const empresas = [
    {
      id: "empresa-1",
      nombre: "Guaro Vision (clientes)",
      direccion: "Av. Libertador, Caracas",
      telefono: "0212-555-1234",
      RIF: "J-123456789",
      persona_de_contacto: "Juan Pérez",
      email: "contacto@seguroscaracas.com",
      tipo: "SEGURO"
    },
    {
      id: "empresa-2",
      nombre: "Guaro Vision (empleados)",
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

  main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}