import { NextResponse } from "next/server";

import { logAiUsage } from "@/lib/ai-usage";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import {
  assertSubscriptionIaTokenGate,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { resolveUserOrDefaultModel } from "@/lib/ia-user-model";
import {
  createOpenAIForStudentIa,
  hasStudentIaLlmCredentials,
  STUDENT_IA_GATEWAY_KEY_HELP,
} from "@/lib/vercel-ia-gateway";
import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";
import { canUseIAChat, getActiveSubscriptionForUser } from "@/lib/subscription";
import {
  buildPic18TutorSystemPrompt,
  normalizePic18TutorMessages,
} from "@/lib/aprende-pic18-tutor";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** POST — Tutor IA de AprendePIC18 (solo JWT + suscripción activa con chat). */
export async function POST(request: Request) {
  return withIaGatewayRatesForRequest(async () => {
    try {
      if (!hasStudentIaLlmCredentials()) {
        return NextResponse.json(
          { error: STUDENT_IA_GATEWAY_KEY_HELP },
          { status: 500, headers: CORS },
        );
      }

      const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
      if (!jwtUser?.id) {
        return NextResponse.json({ error: "No autorizado", code: "login_required" }, { status: 401, headers: CORS });
      }

      const sub = await getActiveSubscriptionForUser(jwtUser.id);
      if (!sub) {
        return NextResponse.json(
          {
            error: "Necesitas un plan activo en CALETAS para usar el Tutor IA.",
            code: "no_subscription",
          },
          { status: 402, headers: CORS },
        );
      }

      if (!canUseIAChat(sub)) {
        return NextResponse.json(
          {
            error:
              "Tu plan actual no incluye Chat IA. Actualiza a CALETA PRO (o un plan con chat) en caleta.top/suscripcion.",
            code: "plan_no_chat",
            planName: sub.subscriptionType?.name ?? null,
          },
          { status: 403, headers: CORS },
        );
      }

      const body = (await request.json()) as {
        messages?: unknown;
        pageContext?: string;
      };

      const messages = normalizePic18TutorMessages(body.messages);
      const pageContext =
        typeof body.pageContext === "string" ? body.pageContext.slice(0, 8000) : "";

      if (!messages.length || messages[messages.length - 1]?.role !== "user") {
        return NextResponse.json(
          { error: "Envía al menos un mensaje de usuario" },
          { status: 400, headers: CORS },
        );
      }

      const lastUserContent = messages.filter((m) => m.role === "user").pop()?.content;
      const model = await resolveUserOrDefaultModel(jwtUser.id, "chat", {
        chatLastUserText: lastUserContent,
      });

      const gate = await assertSubscriptionIaTokenGate({
        userId: jwtUser.id,
        userSubId: sub.id,
        plan: sub.subscriptionType,
        endpoint: "aprende-pic18/tutor/chat",
        modelId: model,
      });

      if (!gate.ok) {
        return NextResponse.json(
          { error: gate.error, code: gate.code, endpoint: "aprende-pic18/tutor/chat" },
          { status: 402, headers: CORS },
        );
      }

      const system = buildPic18TutorSystemPrompt(pageContext);
      const openai = createOpenAIForStudentIa(model);
      const resp = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.35,
        max_tokens: 1200,
      });

      const answer = resp.choices[0]?.message?.content?.trim();
      if (!answer) {
        return NextResponse.json({ error: "No se pudo generar respuesta" }, { status: 500, headers: CORS });
      }

      logAiUsage({
        userId: jwtUser.id,
        endpoint: "aprende-pic18/tutor/chat",
        usage: resp.usage ?? null,
      });

      await settleSubscribedIaAfterCall({
        userSubId: sub.id,
        userId: jwtUser.id,
        model,
        endpoint: "aprende-pic18/tutor/chat",
        reason: "aprende-pic18/tutor/chat",
        gate,
        usage: resp.usage ?? null,
      });

      return NextResponse.json(
        {
          message: answer,
          planName: sub.subscriptionType?.name ?? null,
        },
        { headers: CORS },
      );
    } catch (error) {
      console.error("[aprende-pic18/tutor/chat]", error);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: CORS });
    }
  });
}
