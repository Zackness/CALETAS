import { db } from "@/lib/db";
import { deleteFromBunny } from "@/lib/bunny";

/** Duración visible de cada historia (coincide con la caducidad en BD). */
export const HISTORIA_TTL_MS = 24 * 60 * 60 * 1000;

/** Máximo de clips activos (no caducados) por usuario a la vez. */
export const MAX_HISTORIAS_ACTIVAS_POR_USUARIO = 15;

export function historiaExpiresAt(from: Date = new Date()) {
  return new Date(from.getTime() + HISTORIA_TTL_MS);
}

/**
 * Elimina historias caducadas: borra el archivo en Bunny y el registro en BD.
 * Procesa en lotes para no bloquear demasiado una sola petición.
 */
export async function purgeExpiredHistorias(batchSize = 80): Promise<number> {
  const now = new Date();
  const expired = await db.historia.findMany({
    where: { expiresAt: { lt: now } },
    take: batchSize,
    select: { id: true, mediaUrl: true },
  });

  for (const row of expired) {
    try {
      await deleteFromBunny(row.mediaUrl);
    } catch (e) {
      console.warn("[historias] Bunny delete failed", row.id, e);
    }
    await db.historia.delete({ where: { id: row.id } }).catch(() => {});
  }

  return expired.length;
}
