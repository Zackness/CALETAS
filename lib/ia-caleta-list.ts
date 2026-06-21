import { db } from "@/lib/db";
import { buildRecursosListVisibilityWhere } from "@/lib/caletas-visibility";
import { canAccessFullCaletasPlan, getActiveSubscriptionForUser } from "@/lib/subscription";
import type { CaletaChatListItem } from "@/lib/ia-caleta-types";
import type { Prisma } from "@prisma/client";

export type { CaletaChatListItem } from "@/lib/ia-caleta-types";

export async function listCaletasForIaChat(
  userId: string,
  options?: { query?: string; limit?: number; soloMias?: boolean },
): Promise<CaletaChatListItem[]> {
  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { universidadId: true },
  });
  const sub = await getActiveSubscriptionForUser(userId);
  const hasFull = canAccessFullCaletasPlan(sub);
  const visibilityWhere = buildRecursosListVisibilityWhere(userId, viewer?.universidadId, hasFull);

  const q = options?.query?.trim() ?? "";
  const limit = options?.limit ?? (q ? 80 : 200);

  const searchWhere: Prisma.RecursoWhereInput | null = q
    ? {
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
          { materia: { is: { nombre: { contains: q, mode: "insensitive" } } } },
          { materia: { is: { codigo: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : null;

  const mineWhere: Prisma.RecursoWhereInput | null = options?.soloMias ? { autorId: userId } : null;

  const visibility = visibilityWhere as Prisma.RecursoWhereInput;
  const whereParts: Prisma.RecursoWhereInput[] = [];
  if (Object.keys(visibilityWhere).length > 0) whereParts.push(visibility);
  if (searchWhere) whereParts.push(searchWhere);
  if (mineWhere) whereParts.push(mineWhere);

  const where: Prisma.RecursoWhereInput =
    whereParts.length === 0 ? {} : whereParts.length === 1 ? whereParts[0]! : { AND: whereParts };

  const recursos = await db.recurso.findMany({
    where,
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      tipo: true,
      archivoUrl: true,
      autorId: true,
      materia: { select: { codigo: true, nombre: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return recursos.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    tipo: r.tipo,
    descripcion: r.descripcion,
    tieneArchivo: !!r.archivoUrl,
    materia: r.materia,
    esPropio: r.autorId === userId,
  }));
}
