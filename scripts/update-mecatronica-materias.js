const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Pensum real de Ing. Mecatrónica UNEXPO
const pensumMecatronica = [
  // SEMESTRE I
  {
    codigo: "AAU1111",
    nombre: "Autodesarrollo",
    descripcion: "Desarrollo personal y autoconocimiento",
    creditos: 1,
    semestre: "S1",
    horasTeoria: 0,
    horasPractica: 2,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "ABI1212",
    nombre: "Dibujo I",
    descripcion: "Fundamentos del dibujo técnico",
    creditos: 2,
    semestre: "S1",
    horasTeoria: 1,
    horasPractica: 3,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "ABI1313",
    nombre: "Inglés I",
    descripcion: "Inglés técnico nivel básico",
    creditos: 3,
    semestre: "S1",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "ABI1413",
    nombre: "Lenguaje y Redacción",
    descripcion: "Comunicación escrita y oral",
    creditos: 3,
    semestre: "S1",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "ABB1515",
    nombre: "Matemática I",
    descripcion: "Cálculo diferencial e integral",
    creditos: 5,
    semestre: "S1",
    horasTeoria: 4,
    horasPractica: 2,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "APP1611",
    nombre: "Práctica Profesional",
    descripcion: "Introducción a la práctica profesional",
    creditos: 1,
    semestre: "S1",
    horasTeoria: 0,
    horasPractica: 3,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IQU1713",
    nombre: "Química General",
    descripcion: "Fundamentos de química general",
    creditos: 3,
    semestre: "S1",
    horasTeoria: 3,
    horasPractica: 1,
    prerrequisitos: [],
    coRequisitos: []
  },

  // SEMESTRE II
  {
    codigo: "ABI2122",
    nombre: "Dibujo II",
    descripcion: "Dibujo técnico avanzado",
    creditos: 2,
    semestre: "S2",
    horasTeoria: 1,
    horasPractica: 3,
    prerrequisitos: ["ABI1212"],
    coRequisitos: []
  },
  {
    codigo: "ABB2214",
    nombre: "Física I",
    descripcion: "Mecánica clásica y termodinámica",
    creditos: 4,
    semestre: "S2",
    horasTeoria: 4,
    horasPractica: 1,
    prerrequisitos: ["ABB1515"],
    coRequisitos: []
  },
  {
    codigo: "ABI2323",
    nombre: "Inglés II",
    descripcion: "Inglés técnico nivel intermedio",
    creditos: 3,
    semestre: "S2",
    horasTeoria: 2,
    horasPractica: 2,
    prerrequisitos: ["ABI1313"],
    coRequisitos: []
  },
  {
    codigo: "ABB2425",
    nombre: "Matemática II",
    descripcion: "Cálculo vectorial y ecuaciones diferenciales",
    creditos: 5,
    semestre: "S2",
    horasTeoria: 4,
    horasPractica: 2,
    prerrequisitos: ["ABB1515"],
    coRequisitos: []
  },
  {
    codigo: "ABI2513",
    nombre: "Solución de Problemas",
    descripcion: "Metodología para resolución de problemas",
    creditos: 3,
    semestre: "S2",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABI1413"],
    coRequisitos: []
  },
  {
    codigo: "ABI2612",
    nombre: "Técnicas de Lectura",
    descripcion: "Comprensión lectora y análisis de textos",
    creditos: 2,
    semestre: "S2",
    horasTeoria: 1,
    horasPractica: 2,
    prerrequisitos: ["ABI1413"],
    coRequisitos: []
  },

  // SEMESTRE III
  {
    codigo: "ABB3113",
    nombre: "Álgebra Lineal",
    descripcion: "Vectores, matrices y transformaciones lineales",
    creditos: 3,
    semestre: "S3",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABB2425"],
    coRequisitos: []
  },
  {
    codigo: "ABI3212",
    nombre: "Computación I",
    descripcion: "Programación básica y algoritmos",
    creditos: 2,
    semestre: "S3",
    horasTeoria: 1,
    horasPractica: 2,
    prerrequisitos: ["ABI2513"],
    coRequisitos: []
  },
  {
    codigo: "ABI3313",
    nombre: "Creatividad",
    descripcion: "Desarrollo del pensamiento creativo",
    creditos: 3,
    semestre: "S3",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABI2513"],
    coRequisitos: []
  },
  {
    codigo: "IME3412",
    nombre: "Estática",
    descripcion: "Equilibrio de cuerpos rígidos",
    creditos: 2,
    semestre: "S3",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["ABB2214"],
    coRequisitos: []
  },
  {
    codigo: "ABB3524",
    nombre: "Física II",
    descripcion: "Electricidad y magnetismo",
    creditos: 4,
    semestre: "S3",
    horasTeoria: 4,
    horasPractica: 1,
    prerrequisitos: ["ABB2214"],
    coRequisitos: []
  },
  {
    codigo: "ABB3611",
    nombre: "Laboratorio de Física",
    descripcion: "Prácticas de laboratorio de física",
    creditos: 1,
    semestre: "S3",
    horasTeoria: 0,
    horasPractica: 0,
    prerrequisitos: ["ABB3524"],
    coRequisitos: []
  },
  {
    codigo: "ABB3734",
    nombre: "Matemática III",
    descripcion: "Cálculo multivariable y series",
    creditos: 4,
    semestre: "S3",
    horasTeoria: 3,
    horasPractica: 3,
    prerrequisitos: ["ABB2425"],
    coRequisitos: []
  },

  // SEMESTRE IV
  {
    codigo: "IEI4114",
    nombre: "Circuitos Eléctricos I",
    descripcion: "Análisis de circuitos eléctricos",
    creditos: 4,
    semestre: "S4",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABB3524"],
    coRequisitos: []
  },
  {
    codigo: "ABI4222",
    nombre: "Computación II",
    descripcion: "Programación orientada a objetos",
    creditos: 2,
    semestre: "S4",
    horasTeoria: 1,
    horasPractica: 2,
    prerrequisitos: ["ABI3212"],
    coRequisitos: []
  },
  {
    codigo: "IME4314",
    nombre: "Dinámica",
    descripcion: "Movimiento de cuerpos rígidos",
    creditos: 4,
    semestre: "S4",
    horasTeoria: 4,
    horasPractica: 0,
    prerrequisitos: ["IME3412"],
    coRequisitos: []
  },
  {
    codigo: "IMT4413",
    nombre: "Ingeniería de Materiales",
    descripcion: "Propiedades y selección de materiales",
    creditos: 3,
    semestre: "S4",
    horasTeoria: 2,
    horasPractica: 2,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IMC4512",
    nombre: "Laboratorio de Instrumentación y Mediciones",
    descripcion: "Prácticas de instrumentación",
    creditos: 2,
    semestre: "S4",
    horasTeoria: 1,
    horasPractica: 4,
    prerrequisitos: ["ABB3611"],
    coRequisitos: []
  },
  {
    codigo: "ABB4644",
    nombre: "Matemáticas IV",
    descripcion: "Ecuaciones diferenciales y transformadas",
    creditos: 4,
    semestre: "S4",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABB3734"],
    coRequisitos: []
  },

  // SEMESTRE V
  {
    codigo: "IEI5125",
    nombre: "Circuitos Eléctricos II",
    descripcion: "Análisis avanzado de circuitos",
    creditos: 5,
    semestre: "S5",
    horasTeoria: 4,
    horasPractica: 0,
    prerrequisitos: ["IEI4114"],
    coRequisitos: []
  },
  {
    codigo: "IEL5214",
    nombre: "Electrónica I",
    descripcion: "Dispositivos electrónicos básicos",
    creditos: 4,
    semestre: "S5",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEI4114"],
    coRequisitos: []
  },
  {
    codigo: "IME5313",
    nombre: "Mecánica de Materiales",
    descripcion: "Resistencia de materiales",
    creditos: 3,
    semestre: "S5",
    horasTeoria: 3,
    horasPractica: 1,
    prerrequisitos: ["IMT4413"],
    coRequisitos: []
  },
  {
    codigo: "IME5413",
    nombre: "Mecanismos",
    descripcion: "Análisis y diseño de mecanismos",
    creditos: 3,
    semestre: "S5",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IME4314"],
    coRequisitos: []
  },
  {
    codigo: "IIN5513",
    nombre: "Probabilidad y Estadística",
    descripcion: "Estadística aplicada a la ingeniería",
    creditos: 3,
    semestre: "S5",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["ABB4644"],
    coRequisitos: []
  },
  {
    codigo: "IME5613",
    nombre: "Tecnología de Manufactura",
    descripcion: "Procesos de manufactura",
    creditos: 3,
    semestre: "S5",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IMT4413"],
    coRequisitos: []
  },

  // SEMESTRE VI
  {
    codigo: "IMC6113",
    nombre: "Control I",
    descripcion: "Sistemas de control automático",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEL5214"],
    coRequisitos: []
  },
  {
    codigo: "IME6213",
    nombre: "Diseño de Elementos de Máquinas",
    descripcion: "Diseño mecánico de componentes",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 1,
    prerrequisitos: ["IME6613"],
    coRequisitos: []
  },
  {
    codigo: "IEL6313",
    nombre: "Diseño de Sistemas Lógicos",
    descripcion: "Lógica digital y sistemas combinacionales",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "AFG6413",
    nombre: "Ecología y Ambiente",
    descripcion: "Impacto ambiental en la ingeniería",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IEL6523",
    nombre: "Electrónica II",
    descripcion: "Electrónica analógica avanzada",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL5214"],
    coRequisitos: []
  },
  {
    codigo: "IME6613",
    nombre: "Mecánica de los Fluidos",
    descripcion: "Hidráulica y neumática",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IME6713",
    nombre: "Transferencia de Energía",
    descripcion: "Transferencia de calor y masa",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },

  // SEMESTRE VII
  {
    codigo: "IEI7114",
    nombre: "Actuadores Eléctricos",
    descripcion: "Motores y actuadores eléctricos",
    creditos: 4,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEL6523"],
    coRequisitos: []
  },
  {
    codigo: "IMC7223",
    nombre: "Control II",
    descripcion: "Control digital y sistemas avanzados",
    creditos: 3,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IMC6113"],
    coRequisitos: []
  },
  {
    codigo: "IIN7313",
    nombre: "Economía",
    descripcion: "Economía aplicada a la ingeniería",
    creditos: 3,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEL6313"],
    coRequisitos: []
  },
  {
    codigo: "IEL7411",
    nombre: "Laboratorio de Diseño de Sistemas Lógicos",
    descripcion: "Prácticas de sistemas digitales",
    creditos: 1,
    semestre: "S7",
    horasTeoria: 0,
    horasPractica: 2,
    prerrequisitos: ["IEL6523"],
    coRequisitos: []
  },
  {
    codigo: "IEL7513",
    nombre: "Laboratorio de Electrónica Industrial",
    descripcion: "Prácticas de electrónica industrial",
    creditos: 3,
    semestre: "S7",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL6313"],
    coRequisitos: []
  },
  {
    codigo: "IMC7614",
    nombre: "Metodologías de Diseño Mecatrónico",
    descripcion: "Metodologías para diseño mecatrónico",
    creditos: 4,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },

  // SEMESTRE VIII
  {
    codigo: "IMC8113",
    nombre: "Automatización Industrial I",
    descripcion: "Sistemas de automatización industrial",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IMC7614"],
    coRequisitos: []
  },
  {
    codigo: "IMC8211",
    nombre: "Laboratorio de Control Automático",
    descripcion: "Prácticas de control automático",
    creditos: 1,
    semestre: "S8",
    horasTeoria: 0,
    horasPractica: 0,
    prerrequisitos: ["IMC7223"],
    coRequisitos: []
  },
  {
    codigo: "IEL8313",
    nombre: "Microcontroladores",
    descripcion: "Programación de microcontroladores",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL7513"],
    coRequisitos: []
  },
  {
    codigo: "IMC8413",
    nombre: "Neumática y Óleohidráulica",
    descripcion: "Sistemas neumáticos e hidráulicos",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEI7114"],
    coRequisitos: []
  },
  {
    codigo: "IMC8513",
    nombre: "Proyectos de Ingeniería Mecatrónica I",
    descripcion: "Proyecto integrador I",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IMC7614"],
    coRequisitos: []
  },
  {
    codigo: "IEI8613",
    nombre: "Redes Industriales",
    descripcion: "Comunicaciones industriales",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL7411"],
    coRequisitos: []
  },

  // SEMESTRE IX
  {
    codigo: "IMC9123",
    nombre: "Automatización Industrial II",
    descripcion: "Automatización avanzada y robótica",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IMC8513"],
    coRequisitos: []
  },
  {
    codigo: "AFG9211",
    nombre: "Desarrollo de Emprendedores",
    descripcion: "Emprendimiento e innovación",
    creditos: 1,
    semestre: "S9",
    horasTeoria: 0,
    horasPractica: 3,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IMC9313",
    nombre: "Electiva Profesional",
    descripcion: "Materia electiva de la carrera",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IMC9524"],
    coRequisitos: []
  },
  {
    codigo: "IMC9413",
    nombre: "Electiva Profesional",
    descripcion: "Materia electiva de la carrera",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["AFG9211"],
    coRequisitos: []
  },
  {
    codigo: "IMC9524",
    nombre: "Proyectos de Ingeniería Mecatrónica II",
    descripcion: "Proyecto integrador II",
    creditos: 4,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "IMC9613",
    nombre: "Tópicos Especiales de Mecatrónica",
    descripcion: "Temas avanzados de mecatrónica",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    codigo: "AFG9713",
    nombre: "Valores en el Ejercicio Profesional",
    descripcion: "Ética y valores profesionales",
    creditos: 3,
    semestre: "S9",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },

  // SEMESTRE X (Entrenamiento Industrial)
  {
    codigo: "APP1016",
    nombre: "Entrenamiento Industrial",
    descripcion: "Práctica profesional en empresa",
    creditos: 16,
    semestre: "S10",
    horasTeoria: 0,
    horasPractica: 0,
    prerrequisitos: ["TODAS_LAS_MATERIAS"],
    coRequisitos: []
  }
];

async function main() {
  try {
    console.log('🔄 Actualizando materias de Ing. Mecatrónica con pensum real...');
    
    // Obtener la carrera de Ing. Mecatrónica
    const carrera = await prisma.carrera.findFirst({
      where: {
        nombre: "Ingeniería Mecatrónica",
        universidad: {
          siglas: "UNEXPO"
        }
      }
    });
    
    if (!carrera) {
      throw new Error('No se encontró la carrera Ingeniería Mecatrónica en UNEXPO');
    }
    
    console.log(`📚 Carrera encontrada: ${carrera.nombre} (ID: ${carrera.id})`);
    
    // Eliminar materias existentes
    console.log('🗑️ Eliminando materias existentes...');
    const deletedMaterias = await prisma.materia.deleteMany({
      where: {
        carreraId: carrera.id
      }
    });
    console.log(`✅ Eliminadas ${deletedMaterias.count} materias existentes`);
    
    // Crear las nuevas materias
    console.log('📖 Creando materias del pensum real...');
    
    const materiasCreadas = [];
    
    for (const materia of pensumMecatronica) {
      const nuevaMateria = await prisma.materia.create({
        data: {
          codigo: materia.codigo,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          creditos: materia.creditos,
          semestre: materia.semestre,
          horasTeoria: materia.horasTeoria,
          horasPractica: materia.horasPractica,
          carreraId: carrera.id
        }
      });
      
      materiasCreadas.push({
        ...nuevaMateria,
        prerrequisitos: materia.prerrequisitos
      });
      
      console.log(`  ✅ ${materia.codigo} - ${materia.nombre} (${materia.semestre})`);
    }
    
    // Crear los prerrequisitos
    console.log('🔗 Creando prerrequisitos...');
    
    for (const materia of materiasCreadas) {
      if (materia.prerrequisitos.length > 0) {
        for (const codigoPrerrequisito of materia.prerrequisitos) {
          if (codigoPrerrequisito === "TODAS_LAS_MATERIAS") {
            // Para el entrenamiento industrial, crear prerrequisitos con todas las materias
            for (const otraMateria of materiasCreadas) {
              if (otraMateria.id !== materia.id) {
                await prisma.materiaPrerrequisito.create({
                  data: {
                    materiaId: materia.id,
                    prerrequisitoId: otraMateria.id,
                    tipoPrerrequisito: "OBLIGATORIO"
                  }
                });
              }
            }
          } else {
            // Buscar la materia prerrequisito por código
            const prerrequisito = materiasCreadas.find(m => m.codigo === codigoPrerrequisito);
            if (prerrequisito) {
              await prisma.materiaPrerrequisito.create({
                data: {
                  materiaId: materia.id,
                  prerrequisitoId: prerrequisito.id,
                  tipoPrerrequisito: "OBLIGATORIO"
                }
              });
            }
          }
        }
      }
    }
    
    console.log(`🎉 ¡Materias actualizadas exitosamente! Se crearon ${pensumMecatronica.length} materias.`);
    
  } catch (error) {
    console.error('❌ Error actualizando materias:', error);
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