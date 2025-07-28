const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Materias electivas de Ing. Mecatrónica según el pensum
const electivasMecatronica = [
  {
    codigo: "IMC-ELEC-001",
    nombre: "Control Difuso",
    descripcion: "Sistemas de control basados en lógica difusa",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-002",
    nombre: "Control Numérico por Computadora",
    descripcion: "Sistemas CNC y programación de máquinas herramienta",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-003",
    nombre: "Control Secuencial",
    descripcion: "Control de procesos secuenciales y autómatas",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-004",
    nombre: "Diseño Geométrico",
    descripcion: "Diseño asistido por computadora y modelado 3D",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-005",
    nombre: "Ingeniería Concurrente",
    descripcion: "Metodologías de diseño concurrente",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-006",
    nombre: "Ingeniería Inversa",
    descripcion: "Técnicas de ingeniería inversa y prototipado",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-007",
    nombre: "Inteligencia Artificial",
    descripcion: "Aplicaciones de IA en sistemas mecatrónicos",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-008",
    nombre: "Interfases y Transductores",
    descripcion: "Sensores, actuadores y sistemas de interfaz",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-009",
    nombre: "Matemáticas Directas para Diseño Geométrico",
    descripcion: "Matemáticas aplicadas al diseño geométrico",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-010",
    nombre: "Métodos de Análisis Ingeniería",
    descripcion: "Metodologías de análisis en ingeniería",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-011",
    nombre: "Procesamiento Digital de Señales",
    descripcion: "Análisis y procesamiento de señales digitales",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-012",
    nombre: "Programación orientada a la Automatización",
    descripcion: "Lenguajes de programación para automatización",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  },
  {
    codigo: "IMC-ELEC-013",
    nombre: "Secuenciamiento y Programación de tareas en sistemas de manufactura",
    descripcion: "Programación y control de sistemas de manufactura",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0
  }
];

async function main() {
  try {
    console.log('🔄 Agregando materias electivas de Ing. Mecatrónica...');
    
    // Obtener la carrera de Ing. Mecatrónica
    const carrera = await prisma.carrera.findFirst({
      where: {
        nombre: "Ing. Mecatrónica",
        universidad: {
          siglas: "UNEXPO"
        }
      }
    });
    
    if (!carrera) {
      throw new Error('No se encontró la carrera Ing. Mecatrónica en UNEXPO');
    }
    
    console.log(`📚 Carrera encontrada: ${carrera.nombre} (ID: ${carrera.id})`);
    
    // Crear las materias electivas
    console.log('📖 Creando materias electivas...');
    
    for (const electiva of electivasMecatronica) {
      const nuevaElectiva = await prisma.materia.create({
        data: {
          codigo: electiva.codigo,
          nombre: electiva.nombre,
          descripcion: electiva.descripcion,
          creditos: electiva.creditos,
          semestre: electiva.semestre,
          horasTeoria: electiva.horasTeoria,
          horasPractica: electiva.horasPractica,
          carreraId: carrera.id
        }
      });
      
      console.log(`  ✅ ${electiva.codigo} - ${electiva.nombre}`);
    }
    
    console.log(`🎉 ¡Materias electivas agregadas exitosamente! Se crearon ${electivasMecatronica.length} electivas.`);
    console.log('💡 Nota: Estas electivas pueden ser seleccionadas en lugar de las electivas genéricas del semestre 9.');
    
  } catch (error) {
    console.error('❌ Error agregando electivas:', error);
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