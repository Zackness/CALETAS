/**
 * Reenvía notificación in-app + correo a todos los usuarios para el curso PIC.
 * Uso: npx tsx scripts/announce-curso-pic.ts
 */
import { PrismaClient } from "@prisma/client";
import { announceNewCurso } from "../lib/notifications/announce-curso";

const db = new PrismaClient();

async function main() {
  const curso =
    (await db.curso.findFirst({
      where: { slug: "aprende-pic18" },
      select: { id: true, titulo: true, descripcion: true },
    })) ??
    (await db.curso.findFirst({
      where: {
        OR: [
          { externalUrl: { contains: "pic18", mode: "insensitive" } },
          { titulo: { contains: "PIC", mode: "insensitive" } },
          { titulo: { contains: "pic18", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, titulo: true, descripcion: true },
    }));

  if (!curso) {
    console.error("No se encontró el curso PIC en la base de datos.");
    process.exit(1);
  }

  console.log(`Anunciando curso: ${curso.titulo} (${curso.id})`);
  const result = await announceNewCurso(curso);
  console.log("Resultado:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
