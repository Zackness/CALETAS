import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";
import { listCaletasForIaChat } from "@/lib/ia-caleta-list";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || undefined;
    const soloMias = searchParams.get("soloMias") === "true";

    const recursos = await listCaletasForIaChat(session.user.id, { query, soloMias });
    return withCors(NextResponse.json({ recursos, query: query ?? "", soloMias }), request);
  } catch (e) {
    console.error("[ia/chat/caletas]", e);
    return withCors(NextResponse.json({ error: "Error al listar caletas" }, { status: 500 }), request);
  }
}
