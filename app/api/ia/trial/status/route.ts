import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { getAiTrialStatusForUser } from "@/lib/ai-trial";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);
    const isTrial = !sub;

    const status = await getAiTrialStatusForUser(session.user.id);
    return NextResponse.json({ isTrial, status });
  } catch (e) {
    console.error("Error in /api/ia/trial/status:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

