const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // ID de UNEXPO
    const unexpoId = "dbd99b3b-aaf9-4e03-bc0c-21b7824ec4be";
    
    console.log('🔄 Actualizando carreras de UNEXPO...');
    
    // 1. Eliminar todas las carreras actuales de UNEXPO
    console.log('🗑️ Eliminando carreras existentes de UNEXPO...');
    const deletedCarreras = await prisma.carrera.deleteMany({
      where: {
        universidadId: unexpoId
      }
    });
    console.log(`✅ Eliminadas ${deletedCarreras.count} carreras existentes`);
    
    // 2. Crear las nuevas carreras reales de UNEXPO
    const nuevasCarreras = [
      {
        nombre: "Ing. Mecatrónica",
        codigo: "IM-UNEXPO",
        descripcion: "Ingeniería Mecatrónica - Programa de formación en sistemas mecatrónicos, automatización y control industrial",
        duracion: 10,
        creditos: 180,
        universidadId: unexpoId
      },
      {
        nombre: "Ing. Rural",
        codigo: "IR-UNEXPO",
        descripcion: "Ingeniería Rural - Programa de formación en desarrollo rural, gestión de recursos naturales y proyectos agroindustriales",
        duracion: 10,
        creditos: 180,
        universidadId: unexpoId
      },
      {
        nombre: "TSU. Electricidad",
        codigo: "TSU-ELE-UNEXPO",
        descripcion: "Técnico Superior Universitario en Electricidad - Programa de formación técnica en sistemas eléctricos y automatización",
        duracion: 6,
        creditos: 120,
        universidadId: unexpoId
      },
      {
        nombre: "TSU. Mecánica",
        codigo: "TSU-MEC-UNEXPO",
        descripcion: "Técnico Superior Universitario en Mecánica - Programa de formación técnica en sistemas mecánicos y mantenimiento industrial",
        duracion: 6,
        creditos: 120,
        universidadId: unexpoId
      }
    ];
    
    console.log('➕ Creando nuevas carreras de UNEXPO...');
    
    for (const carrera of nuevasCarreras) {
      const createdCarrera = await prisma.carrera.create({
        data: carrera
      });
      console.log(`✅ Creada carrera: ${createdCarrera.nombre} (${createdCarrera.codigo})`);
    }
    
    console.log('🎉 ¡Carreras de UNEXPO actualizadas exitosamente!');
    console.log('\n📋 Resumen de carreras creadas:');
    console.log('- Ing. Mecatrónica (IM-UNEXPO)');
    console.log('- Ing. Rural (IR-UNEXPO)');
    console.log('- TSU. Electricidad (TSU-ELE-UNEXPO)');
    console.log('- TSU. Mecánica (TSU-MEC-UNEXPO)');
    
  } catch (error) {
    console.error('❌ Error actualizando carreras de UNEXPO:', error);
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