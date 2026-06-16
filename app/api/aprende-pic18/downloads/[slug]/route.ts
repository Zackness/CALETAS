import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Archivos permitidos (slug → nombre en disco). */
const DOWNLOADS: Record<string, string> = {
  "practica-1-operaciones": "practica-1-operaciones.asm",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** GET — descarga .asm con JWT + suscripcion activa. */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const filename = DOWNLOADS[slug];
    if (!filename) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404, headers: CORS });
    }

    const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
    if (!jwtUser?.id) {
      return NextResponse.json(
        { error: "Inicia sesion en CALETAS", code: "login_required" },
        { status: 401, headers: CORS },
      );
    }

    const sub = await getActiveSubscriptionForUser(jwtUser.id);
    if (!sub) {
      return NextResponse.json(
        {
          error: "Necesitas una suscripcion activa en CALETAS para descargar el codigo.",
          code: "no_subscription",
        },
        { status: 403, headers: CORS },
      );
    }

    const filePath = path.join(process.cwd(), "content", "aprende-pic18", "downloads", filename);
    const content = await fs.readFile(filePath, "utf8");

    return new NextResponse(content, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[aprende-pic18/downloads/[slug]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: CORS });
  }
}
