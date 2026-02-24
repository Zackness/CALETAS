const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const hasFlag = (flag) => process.argv.includes(flag);

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function main() {
  const apply = hasFlag("--apply");

  const legacyMatchers = [
    // URL que estaba hardcodeada en `lib/cpanel-storage.ts` / `components/file-manager.tsx`
    "startupven.com/caletas/home/nrektwbx/public_html/caletas",
    // fallback: por si se guardó parte del path sin dominio
    "/home/nrektwbx/public_html/caletas",
  ];

  const whereLegacy = {
    archivoUrl: { not: null },
    OR: legacyMatchers.map((m) => ({
      archivoUrl: { contains: m },
    })),
  };

  const candidates = await prisma.recurso.findMany({
    where: whereLegacy,
    select: {
      id: true,
      titulo: true,
      archivoUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("🧹 Limpieza de recursos legacy (cPanel -> Bunny)");
  console.log(`🔎 Matchers: ${legacyMatchers.join(" | ")}`);
  console.log(`📦 Candidatos encontrados: ${candidates.length}`);

  if (candidates.length) {
    console.log("🧾 Muestra (hasta 10):");
    for (const r of candidates.slice(0, 10)) {
      console.log(`- ${r.id} | ${r.titulo} | ${r.archivoUrl}`);
    }
  }

  if (!apply) {
    console.log(
      "\nℹ️  Modo DRY-RUN. Para eliminar de verdad, ejecuta:\n   node scripts/delete-legacy-recursos-cpanel.js --apply\n",
    );
    return;
  }

  if (!candidates.length) {
    console.log("✅ No hay nada que eliminar.");
    return;
  }

  const ids = candidates.map((c) => c.id);
  const batches = chunk(ids, 500);

  let deletedFavoritos = 0;
  let deletedCalificaciones = 0;
  let deletedComentarios = 0;
  let deletedVistas = 0;
  let deletedDescargas = 0;
  let deletedRecursos = 0;

  console.log(`\n⚠️  Eliminando en ${batches.length} lote(s)...`);

  for (let i = 0; i < batches.length; i++) {
    const batchIds = batches[i];
    const [
      favoritosRes,
      calificacionesRes,
      comentariosRes,
      vistasRes,
      descargasRes,
      recursosRes,
    ] = await prisma.$transaction([
      prisma.favorito.deleteMany({ where: { recursoId: { in: batchIds } } }),
      prisma.calificacionRecurso.deleteMany({
        where: { recursoId: { in: batchIds } },
      }),
      prisma.comentarioRecurso.deleteMany({
        where: { recursoId: { in: batchIds } },
      }),
      prisma.vistaRecurso.deleteMany({ where: { recursoId: { in: batchIds } } }),
      prisma.descargaRecurso.deleteMany({
        where: { recursoId: { in: batchIds } },
      }),
      prisma.recurso.deleteMany({ where: { id: { in: batchIds } } }),
    ]);

    deletedFavoritos += favoritosRes.count;
    deletedCalificaciones += calificacionesRes.count;
    deletedComentarios += comentariosRes.count;
    deletedVistas += vistasRes.count;
    deletedDescargas += descargasRes.count;
    deletedRecursos += recursosRes.count;

    console.log(
      `✅ Lote ${i + 1}/${batches.length}: recursos=${recursosRes.count}, favoritos=${favoritosRes.count}`,
    );
  }

  console.log("\n🎉 Limpieza completada.");
  console.log("📊 Resumen:");
  console.log(`- Favoritos eliminados: ${deletedFavoritos}`);
  console.log(`- Calificaciones eliminadas: ${deletedCalificaciones}`);
  console.log(`- Comentarios eliminados: ${deletedComentarios}`);
  console.log(`- Vistas eliminadas: ${deletedVistas}`);
  console.log(`- Descargas eliminadas: ${deletedDescargas}`);
  console.log(`- Recursos eliminados: ${deletedRecursos}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

