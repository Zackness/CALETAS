import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logAiUsage } from "@/lib/ai-usage";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import {
  assertSubscriptionIaTokenGate,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { resolveModelForIaCall } from "@/lib/ia-user-model";
import {
  createOpenAIForStudentIa,
  hasStudentIaLlmCredentials,
  STUDENT_IA_GATEWAY_KEY_HELP,
} from "@/lib/vercel-ia-gateway";

const TASK_AI_SYSTEM = `Eres el asistente de escritura de CALETAS para tareas y notas personales.
- Escribe en español claro y útil para el estudiante.
- Genera solo el fragmento solicitado (listas, párrafos, ideas), no reescribas todo el documento.
- Texto plano o listas con guiones; evita H1.
- Responde únicamente con el texto a insertar, sin comentarios meta.`;

export async function POST(request: NextRequest) {
  return withIaGatewayRatesForRequest(async () => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }

      if (!hasStudentIaLlmCredentials()) {
        return NextResponse.json({ error: STUDENT_IA_GATEWAY_KEY_HELP }, { status: 500 });
      }

      const sub = await getActiveSubscriptionForUser(session.user.id);
      if (!sub) {
        return NextResponse.json(
          {
            error: "La escritura con IA en notas requiere una suscripción activa de CALETAS.",
            code: "SUBSCRIPTION_REQUIRED",
          },
          { status: 402 }
        );
      }

      const body = (await request.json().catch(() => null)) as {
        instructions?: string;
        taskTitle?: string;
        contentBefore?: string;
        contentAfter?: string;
      } | null;

      const instructions = body?.instructions?.trim() ?? "";
      if (!instructions) {
        return NextResponse.json({ error: "Describe qué debe escribir la IA." }, { status: 400 });
      }

      const model = await resolveModelForIaCall({
        userId: session.user.id,
        role: "heavy",
        nonSubMode: null,
      });

      const gate = await assertSubscriptionIaTokenGate({
        userId: session.user.id,
        userSubId: sub.id,
        plan: sub.subscriptionType,
        endpoint: "tareas/ai",
        modelId: model,
      });
      if (!gate.ok) {
        return NextResponse.json(
          { error: gate.error, code: gate.code, endpoint: "tareas/ai" },
          { status: 402 }
        );
      }

      const before = (body?.contentBefore ?? "").trim().slice(-2000);
      const after = (body?.contentAfter ?? "").trim().slice(0, 2000);

      const userPrompt = [
        "Modo: FRAGMENTO para una nota o tarea (no reescribas todo el documento).",
        body?.taskTitle?.trim() ? `Título: ${body.taskTitle.trim()}` : "",
        "",
        "Texto ANTES del cursor:",
        before || "(vacío)",
        "",
        "Texto DESPUÉS del cursor:",
        after || "(vacío)",
        "",
        "Instrucciones:",
        instructions,
      ]
        .filter(Boolean)
        .join("\n");

      const openai = createOpenAIForStudentIa(model);
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: TASK_AI_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.55,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return NextResponse.json({ error: "No se pudo generar el texto" }, { status: 500 });
      }

      logAiUsage({ userId: session.user.id, endpoint: "tareas/ai", usage: response.usage ?? null });

      await settleSubscribedIaAfterCall({
        userSubId: sub.id,
        userId: session.user.id,
        model,
        endpoint: "tareas/ai",
        reason: "tareas/ai",
        usage: response.usage ?? null,
        gate,
      });

      return NextResponse.json({ content });
    } catch (error) {
      console.error("[tareas/ai/fragment]", error);
      return NextResponse.json({ error: "No se pudo generar el texto" }, { status: 500 });
    }
  });
}
