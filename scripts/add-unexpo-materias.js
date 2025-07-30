const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Agregando materias de ejemplo a las carreras de UNEXPO...');
    
    // Obtener las carreras de UNEXPO
    const carreras = await prisma.carrera.findMany({
      where: {
        universidad: {
          siglas: "UNEXPO"
        }
      },
      select: {
        id: true,
        nombre: true,
        codigo: true
      }
    });
    
    console.log(`📚 Encontradas ${carreras.length} carreras de UNEXPO`);
    
    // Materias por carrera
    const materiasPorCarrera = {
      "Ing. Rural": [
        { codigo: "IR-MAT-101", nombre: "Matemáticas I", semestre: "S1", creditos: 4, horasTeoria: 3, horasPractica: 2 },
        { codigo: "IR-QUI-101", nombre: "Química General", semestre: "S1", creditos: 4, horasTeoria: 3, horasPractica: 2 },
        { codigo: "IR-BIO-101", nombre: "Biología General", semestre: "S1", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "IR-AGR-101", nombre: "Agronomía Básica", semestre: "S2", creditos: 4, horasTeoria: 3, horasPractica: 2 },
        { codigo: "IR-SUE-101", nombre: "Suelos", semestre: "S2", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "IR-HID-101", nombre: "Hidráulica", semestre: "S3", creditos: 4, horasTeoria: 3, horasPractica: 2 },
        { codigo: "IR-CON-101", nombre: "Construcciones Rurales", semestre: "S3", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "IR-MAQ-101", nombre: "Maquinaria Agrícola", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "IR-PRO-101", nombre: "Proyectos Rurales", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "IR-GES-101", nombre: "Gestión Rural", semestre: "S5", creditos: 3, horasTeoria: 2, horasPractica: 2 }
      ],
      "TSU. Electricidad": [
        { codigo: "TSU-ELE-MAT-101", nombre: "Matemáticas I", semestre: "S1", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-ELE-FIS-101", nombre: "Física I", semestre: "S1", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-ELE-ELC-101", nombre: "Electricidad Básica", semestre: "S1", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-ELE-MAT-102", nombre: "Matemáticas II", semestre: "S2", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-ELE-CIR-101", nombre: "Circuitos Eléctricos", semestre: "S2", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-ELE-INS-101", nombre: "Instalaciones Eléctricas", semestre: "S3", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-ELE-MOT-101", nombre: "Motores Eléctricos", semestre: "S3", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-ELE-CON-101", nombre: "Control Eléctrico", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-ELE-AUT-101", nombre: "Automatización Eléctrica", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-ELE-MAN-101", nombre: "Mantenimiento Eléctrico", semestre: "S5", creditos: 3, horasTeoria: 2, horasPractica: 2 }
      ],
      "TSU. Mecánica": [
        { codigo: "TSU-MEC-MAT-101", nombre: "Matemáticas I", semestre: "S1", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-MEC-FIS-101", nombre: "Física I", semestre: "S1", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-MEC-MEC-101", nombre: "Mecánica Básica", semestre: "S1", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-MEC-MAT-102", nombre: "Matemáticas II", semestre: "S2", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-MEC-TER-101", nombre: "Termodinámica", semestre: "S2", creditos: 3, horasTeoria: 2, horasPractica: 2 },
        { codigo: "TSU-MEC-RES-101", nombre: "Resistencia de Materiales", semestre: "S3", creditos: 4, horasTeoria: 3, horasPractica: 2 },
        { codigo: "TSU-MEC-MAQ-101", nombre: "Máquinas y Herramientas", semestre: "S3", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-MEC-MAN-101", nombre: "Mantenimiento Mecánico", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-MEC-PRO-101", nombre: "Procesos de Fabricación", semestre: "S4", creditos: 4, horasTeoria: 2, horasPractica: 4 },
        { codigo: "TSU-MEC-CON-101", nombre: "Control de Calidad", semestre: "S5", creditos: 3, horasTeoria: 2, horasPractica: 2 }
      ]
    };
    
    // Agregar materias a cada carrera
    for (const carrera of carreras) {
      console.log(`\n📖 Agregando materias a: ${carrera.nombre}`);
      
      const materias = materiasPorCarrera[carrera.nombre] || [];
      
      for (const materia of materias) {
        const createdMateria = await prisma.materia.create({
          data: {
            ...materia,
            carreraId: carrera.id,
            descripcion: `Materia de ${materia.nombre} para la carrera de ${carrera.nombre}`
          }
        });
        console.log(`  ✅ ${createdMateria.codigo} - ${createdMateria.nombre} (S${materia.semestre})`);
      }
    }
    
    console.log('\n🎉 ¡Materias agregadas exitosamente a todas las carreras de UNEXPO!');
    
  } catch (error) {
    console.error('❌ Error agregando materias:', error);
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