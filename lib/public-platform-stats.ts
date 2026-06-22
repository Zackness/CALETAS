import { db } from "@/lib/db";

export type PublicPlatformStats = {
  estudiantesRegistrados: number;
  recursosPublicos: number;
  instituciones: number;
};

export async function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  const [estudiantesRegistrados, recursosPublicos, instituciones] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.recurso.count({ where: { esPublico: true } }),
    db.universidad.count(),
  ]);

  return { estudiantesRegistrados, recursosPublicos, instituciones };
}

export function formatPublicStat(value: number): string {
  return value.toLocaleString("es-VE");
}
