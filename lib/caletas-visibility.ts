import { canAccessFullCaletasPlan } from "@/lib/subscription";

type RecursoScope = {
  autorId: string;
  universidadId: string | null;
  materia: { carrera: { universidadId: string } } | null;
};

type SubscriptionLike = { subscriptionType?: { price?: number } | null } | null;

export function effectiveUniversidadIdRecurso(r: RecursoScope): string | null {
  if (r.universidadId) return r.universidadId;
  return r.materia?.carrera?.universidadId ?? null;
}

export function canViewerAccessRecurso(
  viewerUserId: string,
  viewerUniversidadId: string | null | undefined,
  subscription: SubscriptionLike,
  recurso: RecursoScope,
): boolean {
  if (recurso.autorId === viewerUserId) return true;
  if (canAccessFullCaletasPlan(subscription)) return true;

  const eff = effectiveUniversidadIdRecurso(recurso);
  if (eff === null) return true;

  if (!viewerUniversidadId) return false;
  return viewerUniversidadId === eff;
}
