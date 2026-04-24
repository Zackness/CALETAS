import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredHistorias } from "@/lib/historias-cleanup";

/**
 * Limpieza masiva de historias caducadas (Bunny + BD).
 * Protégelo con CRON_SECRET en Authorization: Bearer … o ?secret=
 * Programa en Vercel Cron / otro scheduler una llamada cada hora.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const q = request.nextUrl.searchParams.get("secret") ?? "";
  if (header !== expected && q !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let total = 0;
  for (let i = 0; i < 50; i++) {
    const n = await purgeExpiredHistorias(100);
    total += n;
    if (n === 0) break;
  }

  return NextResponse.json({ ok: true, purged: total });
}
