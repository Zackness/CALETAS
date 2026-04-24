import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromBunny } from "@/lib/bunny";
import { purgeExpiredHistorias } from "@/lib/historias-cleanup";

/** DELETE: el autor puede borrar su historia antes de que caduque (Bunny + BD). */
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await purgeExpiredHistorias(40);

    const row = await db.historia.findUnique({
      where: { id },
      select: { id: true, autorId: true, mediaUrl: true },
    });

    if (!row) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    if (row.autorId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await deleteFromBunny(row.mediaUrl);
    await db.historia.delete({ where: { id: row.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[historias DELETE]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
