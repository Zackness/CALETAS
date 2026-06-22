/**
 * Elimina cursos Aprende duplicados (legacy sin slug canónico).
 * Uso: node scripts/cleanup-duplicate-cursos.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CANONICAL = {
  pic18: "aprende-pic18",
  cppPoo: "aprende-cpp-poo",
};

function detectPlatform(curso) {
  const title = curso.titulo.toLowerCase();
  if (
    curso.slug === CANONICAL.pic18 ||
    curso.externalUrl?.includes("pic18.caleta.top") ||
    title.includes("pic18")
  ) {
    return "pic18";
  }
  if (
    curso.slug === CANONICAL.cppPoo ||
    curso.externalUrl?.includes("cpp.caleta.top") ||
    title.includes("aprendec++") ||
    title.includes("c++ poo")
  ) {
    return "cppPoo";
  }
  return null;
}

async function main() {
  const cursos = await prisma.curso.findMany({
    select: { id: true, titulo: true, slug: true, externalUrl: true },
  });

  const toDelete = cursos.filter((curso) => {
    const platform = detectPlatform(curso);
    if (platform === "pic18" && curso.slug !== CANONICAL.pic18) return true;
    if (platform === "cppPoo" && curso.slug !== CANONICAL.cppPoo) return true;
    return false;
  });

  if (toDelete.length === 0) {
    console.log("No hay cursos duplicados para eliminar.");
    return;
  }

  for (const curso of toDelete) {
    await prisma.curso.delete({ where: { id: curso.id } });
    console.log(`Eliminado duplicado: ${curso.titulo} (${curso.id}) slug=${curso.slug ?? "—"}`);
  }

  console.log(`Listo. ${toDelete.length} curso(s) duplicado(s) eliminado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
