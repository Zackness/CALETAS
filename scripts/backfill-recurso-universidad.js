/**
 * Asigna universidadId a recursos existentes según la carrera de la materia.
 * Ejecutar tras `npx prisma db push` si agregaste el campo.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const recursos = await prisma.recurso.findMany({
    where: { universidadId: null, materiaId: { not: null } },
    select: { id: true, materiaId: true },
  });
  let updated = 0;
  for (const r of recursos) {
    const m = await prisma.materia.findUnique({
      where: { id: r.materiaId },
      select: { carrera: { select: { universidadId: true } } },
    });
    const uid = m?.carrera?.universidadId;
    if (uid) {
      await prisma.recurso.update({
        where: { id: r.id },
        data: { universidadId: uid },
      });
      updated++;
    }
  }
  console.log(`Recursos actualizados con universidadId: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
