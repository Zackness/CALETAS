import { EstadoMateria } from "@prisma/client";

import { db } from "@/lib/db";

export type MateriaEstudianteSemRow = {
  estado: EstadoMateria | string;
  materia: { semestre: string; creditos: number };
};

export type PensumMateriaLite = { semestre: string; creditos: number };

export function semestreStringToNumber(sem: string): number {
  const m = String(sem).match(/^S(\d+)$/i);
  if (!m) return 1;
  return Math.min(10, Math.max(1, parseInt(m[1], 10)));
}

export function numberToSemestreString(n: number): string {
  const v = Math.min(10, Math.max(1, Math.round(n)));
  return `S${v}`;
}

/**
 * Semestre según unidades de crédito (UC) aprobadas:
 * compara la suma de UC aprobadas con el acumulado del pensum por semestre (S1→S10).
 * Sin pensum: media heurística de UC por semestre (20).
 */
export function semestrePorCreditosAprobados(
  approvedCredits: number,
  pensumMaterias: PensumMateriaLite[],
): number {
  if (approvedCredits <= 0) return 1;
  if (!pensumMaterias.length) {
    const mediaPorSemestre = 20;
    return Math.min(10, Math.max(1, Math.ceil(approvedCredits / mediaPorSemestre)));
  }
  const bySem = new Map<number, number>();
  for (const m of pensumMaterias) {
    const n = semestreStringToNumber(m.semestre);
    bySem.set(n, (bySem.get(n) || 0) + m.creditos);
  }
  let totalPensum = 0;
  for (let s = 1; s <= 10; s++) {
    totalPensum += bySem.get(s) || 0;
  }
  if (totalPensum > 0 && approvedCredits >= totalPensum) return 10;

  let cum = 0;
  for (let s = 1; s <= 10; s++) {
    cum += bySem.get(s) || 0;
    if (cum >= approvedCredits) return s;
  }
  return 10;
}

export type SemestreSugeridoDetalle = {
  /** UC aprobadas sumadas del historial. */
  creditosAprobados: number;
  /** Semestre inferido solo por UC vs pensum (o heurística sin pensum). */
  porCreditosPensum: number;
  /** Ajuste: no cursarías materias de un semestre superior al tuyo. */
  maxEnCurso: number;
};

/**
 * Semestre sugerido: principalmente por UC aprobadas vs pensum;
 * se sube si hay materias EN_CURSO de un semestre superior (no reduce el nivel por créditos).
 */
export function computeSemestreSugeridoMeta(
  rows: MateriaEstudianteSemRow[],
  pensumMaterias: PensumMateriaLite[],
): {
  clave: string;
  numero: number;
  detalle: SemestreSugeridoDetalle;
} {
  let maxEnCurso = 0;
  let approvedCredits = 0;

  for (const r of rows) {
    const n = semestreStringToNumber(r.materia.semestre);
    if (r.estado === EstadoMateria.EN_CURSO || r.estado === "EN_CURSO") {
      maxEnCurso = Math.max(maxEnCurso, n);
    }
    if (r.estado === EstadoMateria.APROBADA || r.estado === "APROBADA") {
      approvedCredits += r.materia.creditos;
    }
  }

  const porCreditosPensum = semestrePorCreditosAprobados(approvedCredits, pensumMaterias);
  const numero = Math.min(10, Math.max(1, Math.max(porCreditosPensum, maxEnCurso)));

  return {
    clave: numberToSemestreString(numero),
    numero,
    detalle: { creditosAprobados: approvedCredits, porCreditosPensum, maxEnCurso },
  };
}

/** Si el usuario no forzó semestre manual, persiste el semestre sugerido. */
export async function syncSemestreActualIfAutomatic(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { semestreActualManual: true },
  });
  if (!user || user.semestreActualManual) return;

  const rows = await db.materiaEstudiante.findMany({
    where: { userId },
    include: {
      materia: { select: { semestre: true, creditos: true } },
    },
  });

  const carreraId = (
    await db.user.findUnique({
      where: { id: userId },
      select: { carreraId: true },
    })
  )?.carreraId;

  let pensum: PensumMateriaLite[] = [];
  if (carreraId) {
    pensum = await db.materia.findMany({
      where: { carreraId },
      select: { semestre: true, creditos: true },
    });
  }

  const meta = computeSemestreSugeridoMeta(rows, pensum);
  await db.user.update({
    where: { id: userId },
    data: { semestreActual: meta.clave },
  });
}

export type SyncSemestreTodosResult = {
  total: number;
  synced: number;
  skippedManual: number;
  resetManual: boolean;
};

/**
 * Recalcula `semestreActual` para muchos usuarios.
 * @param resetManual si es true, quita el modo manual a todos y aplica solo UC + en curso.
 */
export async function syncSemestreActualTodosLosUsuarios(opts?: {
  resetManual?: boolean;
}): Promise<SyncSemestreTodosResult> {
  const resetManual = !!opts?.resetManual;
  const users = await db.user.findMany({
    select: { id: true, semestreActualManual: true },
  });
  let synced = 0;
  let skippedManual = 0;

  for (const u of users) {
    if (resetManual) {
      await db.user.update({
        where: { id: u.id },
        data: { semestreActualManual: false },
      });
      await syncSemestreActualIfAutomatic(u.id);
      synced++;
      continue;
    }
    if (u.semestreActualManual) {
      skippedManual++;
      continue;
    }
    await syncSemestreActualIfAutomatic(u.id);
    synced++;
  }

  return {
    total: users.length,
    synced,
    skippedManual,
    resetManual,
  };
}
