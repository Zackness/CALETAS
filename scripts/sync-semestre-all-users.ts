/**
 * Recalcula el semestre académico (`semestreActual`) según UC aprobadas y pensum (+ ajuste por materias en curso).
 *
 * Por defecto solo actualiza usuarios con semestre en modo automático (`semestreActualManual === false`).
 *
 * Variables de entorno:
 * - SYNC_SEMESTRE_RESET_MANUAL=1  → desactiva el modo manual en todos y recalcula a todos (incluye quien fijó S a mano).
 *
 * Uso:
 *   npx tsx scripts/sync-semestre-all-users.ts
 *   SYNC_SEMESTRE_RESET_MANUAL=1 npx tsx scripts/sync-semestre-all-users.ts
 */

import "dotenv/config";
import { syncSemestreActualTodosLosUsuarios } from "@/lib/semestre-estudiante";

async function main() {
  const resetManual = process.env.SYNC_SEMESTRE_RESET_MANUAL === "1";
  console.log(
    resetManual
      ? "Modo: RESET manual + sincronizar todos los usuarios."
      : "Modo: solo usuarios con semestre automático (se omiten los que tienen semestre manual).",
  );

  const result = await syncSemestreActualTodosLosUsuarios({ resetManual });
  console.log("Resultado:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
