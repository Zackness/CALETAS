import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import {
  computeSemestreSugeridoMeta,
  syncSemestreActualIfAutomatic,
} from "@/lib/semestre-estudiante";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

/** Resumen de semestre (actual, sugerido y desglose) para ajustes / historial. */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const userId = session.user.id;

    const [rows, user] = await Promise.all([
      db.materiaEstudiante.findMany({
        where: { userId },
        include: { materia: { select: { semestre: true, creditos: true } } },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: {
          semestreActual: true,
          semestreActualManual: true,
          carrera: {
            select: {
              materias: { select: { semestre: true, creditos: true } },
            },
          },
        },
      }),
    ]);

    const pensum = user?.carrera?.materias ?? [];
    const meta = computeSemestreSugeridoMeta(rows, pensum);

    return withCors(
      NextResponse.json({
        actual: user?.semestreActual ?? null,
        manual: user?.semestreActualManual ?? false,
        sugerido: meta.clave,
        detalle: meta.detalle,
      }),
      request,
    );
  } catch (e) {
    console.error("GET /academico/semestre:", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}

type PatchBody = { modo: "AUTO" } | { modo: "MANUAL"; semestre: string };

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const body = (await request.json()) as PatchBody;
    const userId = session.user.id;

    if (body.modo === "AUTO") {
      await db.user.update({
        where: { id: userId },
        data: { semestreActualManual: false },
      });
      await syncSemestreActualIfAutomatic(userId);
    } else if (body.modo === "MANUAL" && body.semestre) {
      const raw = String(body.semestre).trim();
      const m = raw.match(/^S(10|[1-9])$/i);
      if (!m) {
        return withCors(NextResponse.json({ error: "Semestre inválido (use S1…S10)" }, { status: 400 }), request);
      }
      const n = m[1].toLowerCase() === "10" ? 10 : parseInt(m[1], 10);
      const clave = `S${n}`;
      await db.user.update({
        where: { id: userId },
        data: { semestreActualManual: true, semestreActual: clave },
      });
    } else {
      return withCors(NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }), request);
    }

    const u = await db.user.findUnique({
      where: { id: userId },
      select: { semestreActual: true, semestreActualManual: true },
    });

    const rows = await db.materiaEstudiante.findMany({
      where: { userId },
      include: { materia: { select: { semestre: true, creditos: true } } },
    });
    const pensumRows =
      (
        await db.user.findUnique({
          where: { id: userId },
          select: { carrera: { select: { materias: { select: { semestre: true, creditos: true } } } } },
        })
      )?.carrera?.materias ?? [];
    const meta = computeSemestreSugeridoMeta(rows, pensumRows);

    return withCors(
      NextResponse.json({
        ok: true,
        actual: u?.semestreActual,
        manual: u?.semestreActualManual,
        sugerido: meta.clave,
        detalle: meta.detalle,
      }),
      request,
    );
  } catch (e) {
    console.error("PATCH /academico/semestre:", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}
