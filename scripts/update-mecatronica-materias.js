const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Pensum real de Ing. Mecatrónica UNEXPO con IDs fijos
const pensumMecatronica = [
  // SEMESTRE I
  {
    id: "mecatronica-aau1111",
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
    id: "mecatronica-abi1212",
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
    id: "mecatronica-abi1313",
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
    id: "mecatronica-abi1413",
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
    id: "mecatronica-abb1515",
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
    id: "mecatronica-app1611",
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
    id: "mecatronica-iqu1713",
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
    id: "mecatronica-abi2122",
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
    id: "mecatronica-abb2214",
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
    id: "mecatronica-abi2323",
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
    id: "mecatronica-abb2425",
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
    id: "mecatronica-abi2513",
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
    id: "mecatronica-abi2612",
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
    id: "mecatronica-abb3113",
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
    id: "mecatronica-abi3212",
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
    id: "mecatronica-abi3313",
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
    id: "mecatronica-ime3412",
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
    id: "mecatronica-abb3524",
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
    id: "mecatronica-abb3611",
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
    id: "mecatronica-abb3734",
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
    id: "mecatronica-iei4114",
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
    id: "mecatronica-abi4222",
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
    id: "mecatronica-ime4314",
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
    id: "mecatronica-imt4413",
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
    id: "mecatronica-imc4512",
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
    id: "mecatronica-abb4644",
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
    id: "mecatronica-iei5125",
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
    id: "mecatronica-iel5214",
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
    id: "mecatronica-ime5313",
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
    id: "mecatronica-ime5413",
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
    id: "mecatronica-iin5513",
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
    id: "mecatronica-ime5613",
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
    id: "mecatronica-imc6113",
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
    id: "mecatronica-ime6213",
    codigo: "IME6213",
    nombre: "Diseño de Elementos de Máquinas",
    descripcion: "Diseño mecánico de componentes",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 1,
    prerrequisitos: ["IME5313"],
    coRequisitos: []
  },
  {
    id: "mecatronica-iel6313",
    codigo: "IEL6313",
    nombre: "Diseño de Sistemas Lógicos",
    descripcion: "Lógica digital y sistemas combinacionales",
    creditos: 3,
    semestre: "S6",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEL5214"],
    coRequisitos: []
  },
  {
    id: "mecatronica-afg6413",
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
    id: "mecatronica-iel6523",
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
    id: "mecatronica-ime6613",
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
    id: "mecatronica-ime6713",
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
    id: "mecatronica-iei7114",
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
    id: "mecatronica-imc7223",
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
    id: "mecatronica-iin7313",
    codigo: "IIN7313",
    nombre: "Economía",
    descripcion: "Economía aplicada a la ingeniería",
    creditos: 3,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: [],
    coRequisitos: []
  },
  {
    id: "mecatronica-iel7411",
    codigo: "IEL7411",
    nombre: "Laboratorio de Diseño de Sistemas Lógicos",
    descripcion: "Prácticas de sistemas digitales",
    creditos: 1,
    semestre: "S7",
    horasTeoria: 0,
    horasPractica: 2,
    prerrequisitos: ["IEL6313"],
    coRequisitos: []
  },
  {
    id: "mecatronica-iel7513",
    codigo: "IEL7513",
    nombre: "Laboratorio de Electrónica Industrial",
    descripcion: "Prácticas de electrónica industrial",
    creditos: 3,
    semestre: "S7",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL6523"],
    coRequisitos: []
  },
  {
    id: "mecatronica-imc7614",
    codigo: "IMC7614",
    nombre: "Metodologías de Diseño Mecatrónico",
    descripcion: "Metodologías para diseño mecatrónico",
    creditos: 4,
    semestre: "S7",
    horasTeoria: 3,
    horasPractica: 0,
    prerrequisitos: ["IEL6313"],
    coRequisitos: []
  },

  // SEMESTRE VIII
  {
    id: "mecatronica-imc8113",
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
    id: "mecatronica-imc8211",
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
    id: "mecatronica-iel8313",
    codigo: "IEL8313",
    nombre: "Microcontroladores",
    descripcion: "Programación de microcontroladores",
    creditos: 3,
    semestre: "S8",
    horasTeoria: 2,
    horasPractica: 0,
    prerrequisitos: ["IEL7411"],
    coRequisitos: []
  },
  {
    id: "mecatronica-imc8413",
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
    id: "mecatronica-imc8513",
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
    id: "mecatronica-iei8613",
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
    id: "mecatronica-imc9123",
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
    id: "mecatronica-afg9211",
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
    id: "mecatronica-imc9313",
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
    id: "mecatronica-imc9413",
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
    id: "mecatronica-imc9524",
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
    id: "mecatronica-imc9613",
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
    id: "mecatronica-afg9713",
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
    id: "mecatronica-app1016",
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
    
    // Eliminar prerrequisitos existentes para evitar duplicados
    console.log('🗑️ Eliminando prerrequisitos existentes...');
    await prisma.materiaPrerrequisito.deleteMany({
      where: {
        materia: {
          carreraId: carrera.id
        }
      }
    });
    
    // Crear o actualizar las materias
    console.log('📖 Creando/actualizando materias del pensum real...');
    
    const materiasCreadas = [];
    
    for (const materia of pensumMecatronica) {
      // Buscar si la materia ya existe por código
      const materiaExistente = await prisma.materia.findFirst({
        where: {
          codigo: materia.codigo,
          carreraId: carrera.id
        }
      });
      
      let materiaActualizada;
      
      if (materiaExistente) {
        // Actualizar la materia existente
        materiaActualizada = await prisma.materia.update({
          where: { id: materiaExistente.id },
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
        console.log(`  🔄 Actualizada: ${materia.codigo} - ${materia.nombre} (${materia.semestre})`);
      } else {
        // Crear nueva materia con ID fijo
        materiaActualizada = await prisma.materia.create({
          data: {
            id: materia.id,
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
        console.log(`  ✅ Creada: ${materia.codigo} - ${materia.nombre} (${materia.semestre})`);
      }
      
      materiasCreadas.push({
        ...materiaActualizada,
        prerrequisitos: materia.prerrequisitos
      });
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
    
    console.log(`🎉 ¡Materias actualizadas exitosamente! Se procesaron ${pensumMecatronica.length} materias.`);
    console.log('💾 El historial académico de los usuarios se ha preservado.');
    
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