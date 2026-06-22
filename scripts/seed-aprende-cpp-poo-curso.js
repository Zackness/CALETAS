/**
 * Publica el curso web AprendeC++ POO en la tabla Curso (upsert por slug).
 * Uso: node scripts/seed-aprende-cpp-poo-curso.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

  const data = {
    titulo: "AprendeC++ POO",
    slug: "aprende-cpp-poo",
    tipo: "web",
    descripcion:
      "Curso interactivo de Computacion II (UNEXPO): C++, POO, trabajos, laboratorios guiados y proyecto final con Arduino e interfaz grafica.",
    contenido:
      "Ruta de estudio con teoria, tutoriales paso a paso, laboratorios y examenes. El progreso se sincroniza con tu cuenta CALETAS.",
    externalUrl: "https://cpp.caleta.top",
    tema: "Programacion",
    orden: 2,
    autorId: autor.id,
  };

  const curso = await prisma.curso.upsert({
    where: { slug: "aprende-cpp-poo" },
    create: data,
    update: {
      titulo: data.titulo,
      tipo: data.tipo,
      descripcion: data.descripcion,
      contenido: data.contenido,
      externalUrl: data.externalUrl,
      tema: data.tema,
      orden: data.orden,
    },
  });

  console.log(`Curso listo: ${curso.titulo} (${curso.id}) → ${curso.externalUrl}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
