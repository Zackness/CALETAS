/**
 * Completa la información de los cursos Aprende en la base de datos.
 * Uso: node scripts/seed-aprende-cursos.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PIC18_CONTENIDO = `## Qué aprenderás
- Arquitectura interna del PIC18F4550 y mapa de memoria
- Ensamblador, registros, configuración y primeros programas en MPLAB X
- GPIO, timers, PWM, ADC, UART e interrupciones con prácticas de laboratorio UNEXPO
- Quizzes interactivos, guías paso a paso y tutor IA conectado a tu cuenta CALETAS

## Estructura del curso
- 44 lecciones organizadas en ruta de estudio con teoría, guías prácticas y laboratorios
- 8 prácticas guiadas (LED, teclado-LCD, frecuencímetro, motor paso a paso, ADC, serial, etc.)
- Exámenes parciales interactivos y checklist de laboratorio
- Progreso real sincronizado: lecciones, quizzes, prácticas y guías de habilidades

## Para quién es
- Estudiantes de Computación II / Sistemas Empotrados con PIC18F4550
- Quienes vienen de Arduino y quieren dominar ensamblador y periféricos a bajo nivel
- Estudiantes CALETAS que quieren retomar exactamente donde lo dejaron

## Requisitos
- Cuenta activa en CALETAS (misma sesión para sincronizar avance)
- MPLAB X y Proteus recomendados para las prácticas
- Conocimientos básicos de lógica y programación`;

const CPP_POO_CONTENIDO = `## Qué aprenderás
- C++ moderno orientado a objetos: clases, herencia, polimorfismo y encapsulamiento
- Trabajos académicos, laboratorios guiados y proyecto final integrador
- Patrones de diseño aplicados a sistemas con Arduino e interfaz gráfica
- Sincronización de avance con tu perfil CALETAS al iniciar sesión

## Estructura del curso
- Ruta web interactiva con teoría, retos y entregables por unidad
- Laboratorios progresivos alineados al pensum de Computación II (UNEXPO)
- Proyecto final con POO, sensores/actuadores y capa de presentación
- Quizzes y checklist de práctica con seguimiento en CALETAS

## Para quién es
- Estudiantes que cursan Computación II con enfoque en C++ y POO
- Quienes necesitan reforzar clases, punteros, STL y diseño orientado a objetos
- Usuarios CALETAS que quieren continuar el curso desde su última lección

## Requisitos
- Cuenta CALETAS para guardar y recuperar progreso
- Compilador C++ (g++, MinGW o equivalente) según indique cada laboratorio
- Conocimientos previos de programación estructurada`;

const CURSOS = [
  {
    slug: "aprende-pic18",
    titulo: "Aprende PIC18",
    tipo: "web",
    descripcion:
      "Curso interactivo de PIC18F4550: 44 lecciones, quizzes, guías de puertos/ALU/interrupciones, 8 laboratorios UNEXPO y tutor IA. Tu avance se sincroniza con CALETAS.",
    contenido: PIC18_CONTENIDO,
    externalUrl: "https://pic18.caleta.top",
    tema: "Microcontroladores",
    orden: 1,
  },
  {
    slug: "aprende-cpp-poo",
    titulo: "AprendeC++ POO",
    tipo: "web",
    descripcion:
      "Curso web de Computación II (UNEXPO): C++, POO, trabajos, laboratorios guiados y proyecto final con Arduino e interfaz gráfica. Progreso conectado a CALETAS.",
    contenido: CPP_POO_CONTENIDO,
    externalUrl: "https://cpp.caleta.top",
    tema: "Programación",
    orden: 2,
  },
];

async function main() {
  const autor =
    (await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!autor) {
    throw new Error("No hay usuarios en la base de datos para asignar como autor del curso.");
  }

  for (const curso of CURSOS) {
    const row = await prisma.curso.upsert({
      where: { slug: curso.slug },
      create: { ...curso, autorId: autor.id },
      update: {
        titulo: curso.titulo,
        tipo: curso.tipo,
        descripcion: curso.descripcion,
        contenido: curso.contenido,
        externalUrl: curso.externalUrl,
        tema: curso.tema,
        orden: curso.orden,
      },
    });
    console.log(`✓ ${row.titulo} (${row.id})`);
  }

  const legacy = await prisma.curso.findMany({
    select: { id: true, titulo: true, slug: true, externalUrl: true },
  });

  for (const curso of legacy) {
    const title = curso.titulo.toLowerCase();
    const isPic18Dup =
      curso.slug !== "aprende-pic18" &&
      (title.includes("pic18") || curso.externalUrl?.includes("pic18.caleta.top"));
    const isCppDup =
      curso.slug !== "aprende-cpp-poo" &&
      (title.includes("aprendec++") ||
        title.includes("c++ poo") ||
        curso.externalUrl?.includes("cpp.caleta.top"));
    if (isPic18Dup || isCppDup) {
      await prisma.curso.delete({ where: { id: curso.id } });
      console.log(`✗ Duplicado eliminado: ${curso.titulo} (${curso.id})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
