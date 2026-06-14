import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { canAccessFullCaletasPlan, getActiveSubscriptionForUser } from "@/lib/subscription";
import { logAiUsage } from "@/lib/ai-usage";
import { assertTrialReferralOrWalletForIa } from "@/lib/ai-trial";
import { debitWalletForIa } from "@/lib/ia-wallet";
import { withIaGatewayRatesForRequest } from "@/lib/ia-gateway-rates-request";
import { computeWalletChargeFromTokenUsage } from "@/lib/ia-usage-pricing";
import {
  assertSubscriptionIaTokenGate,
  settleSubscribedIaAfterCall,
} from "@/lib/ia-subscription-meter";
import { resolveUserOrDefaultModel } from "@/lib/ia-user-model";
import { createOpenAIForStudentIa, hasStudentIaLlmCredentials, STUDENT_IA_GATEWAY_KEY_HELP } from "@/lib/vercel-ia-gateway";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function POST(request: NextRequest) {
  return withIaGatewayRatesForRequest(async () => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    if (!hasStudentIaLlmCredentials()) {
      return withCors(
        NextResponse.json({ error: STUDENT_IA_GATEWAY_KEY_HELP }, { status: 500 }),
        request,
      );
    }
    const sub = await getActiveSubscriptionForUser(session.user.id);
    const hasSubscription = !!sub;
    let subscriptionIaGate: Awaited<ReturnType<typeof assertSubscriptionIaTokenGate>> | null = null;
    let nonSubIaAccess: Awaited<ReturnType<typeof assertTrialReferralOrWalletForIa>> | null = null;
    if (!hasSubscription) {
      nonSubIaAccess = await assertTrialReferralOrWalletForIa({ userId: session.user.id, endpoint: "ia/fichas" });
      if (!nonSubIaAccess.ok) {
        return withCors(
          NextResponse.json(
            {
              error: nonSubIaAccess.error,
              code: nonSubIaAccess.code ?? "FREE_LIMIT_REACHED",
              endpoint: "ia/fichas",
              limit: nonSubIaAccess.limit,
            },
            { status: 402 },
          ),
          request,
        );
      }
    }
    const body = await request.json();
    const { recursoId } = body;
    if (!recursoId) {
      return withCors(NextResponse.json({ error: "ID de recurso requerido" }, { status: 400 }), request);
    }

    const viewer = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true },
    });
    const hasFullCaletasPlan = canAccessFullCaletasPlan(sub);

    let visibilityWhere: any;
    if (hasFullCaletasPlan) {
      visibilityWhere = {};
    } else if (!viewer?.universidadId) {
      visibilityWhere = {
        OR: [{ universidadId: null }, { autorId: session.user.id }],
      };
    } else {
      visibilityWhere = {
        OR: [{ universidadId: null }, { universidadId: viewer.universidadId }, { autorId: session.user.id }],
      };
    }

    // Obtener el recurso SOLO si el usuario puede verlo
    const recurso = await db.recurso.findFirst({
      where: {
        id: recursoId,
        ...(visibilityWhere || {}),
      },
      include: {
        materia: {
          select: {
            nombre: true,
            codigo: true,
          }
        },
        autor: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!recurso) {
      return withCors(NextResponse.json({ error: "Recurso no encontrado o sin acceso" }, { status: 404 }), request);
    }
    
    const autorNombre =
      (recurso as any).esAnonimo && recurso.autorId !== session.user.id
        ? "Anónimo"
        : recurso.autor?.name || "N/A";

    const materiaContexto = recurso.materia
      ? `Materia: ${recurso.materia.nombre} (${recurso.materia.codigo})`
      : "Materia: caleta genérica (sin materia asociada)";

    // Preparar el contenido para la IA
    const contenidoParaIA = `
Título del recurso: ${recurso.titulo}
Descripción: ${recurso.descripcion}
Contenido: ${recurso.contenido}
${materiaContexto}
Tipo de recurso: ${recurso.tipo}
Tags: ${recurso.tags || 'N/A'}
Autor: ${autorNombre}

Genera 3 fichas de estudio basadas en este contenido. Cada ficha debe incluir:
1. Un concepto principal
2. Una definición clara y concisa
3. 3 ejemplos prácticos
4. 3 puntos clave para recordar

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin markdown, sin \`\`\`json, sin explicaciones adicionales.

Estructura JSON esperada:
{
  "fichas": [
    {
      "concepto": "Nombre del concepto",
      "definicion": "Definición clara y concisa",
      "ejemplos": ["Ejemplo 1", "Ejemplo 2", "Ejemplo 3"],
      "puntosClave": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
    }
  ]
}
`;

    const model = await resolveUserOrDefaultModel(session.user.id, "heavy");
    if (hasSubscription && sub) {
      const gate = await assertSubscriptionIaTokenGate({
        userId: session.user.id,
        userSubId: sub.id,
        plan: sub.subscriptionType,
        endpoint: "ia/fichas",
        modelId: model,
      });
      if (!gate.ok) {
        return withCors(
          NextResponse.json(
            { error: gate.error, code: gate.code, endpoint: "ia/fichas" },
            { status: 402 },
          ),
          request,
        );
      }
      subscriptionIaGate = gate;
    }

    const openai = createOpenAIForStudentIa();
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Eres un asistente educativo especializado en crear fichas de estudio efectivas. Genera fichas claras, concisas y útiles para estudiantes universitarios. Responde ÚNICAMENTE en formato JSON válido, sin markdown, sin ```json, sin explicaciones adicionales."
        },
        {
          role: "user",
          content: contenidoParaIA
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const respuestaIA = response.choices[0]?.message?.content;
    
    if (!respuestaIA) {
      return NextResponse.json({ error: "Error al generar las fichas" }, { status: 500 });
    }

    logAiUsage({ userId: session.user.id, endpoint: "ia/fichas", usage: response.usage ?? null });

    if (hasSubscription && sub && subscriptionIaGate) {
      await settleSubscribedIaAfterCall({
        userSubId: sub.id,
        userId: session.user.id,
        model,
        endpoint: "ia/fichas",
        reason: "ia/fichas",
        gate: subscriptionIaGate,
        usage: response.usage ?? null,
      });
    }

    // Parsear la respuesta JSON
    let fichasGeneradas;
    try {
      // Limpiar la respuesta de markdown si viene envuelta en ```json
      let cleanResponse = respuestaIA.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7);
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
      }
      cleanResponse = cleanResponse.trim();
      
      console.log("🔍 Respuesta limpia de la IA:", cleanResponse.substring(0, 200));
      
      fichasGeneradas = JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Respuesta original:", respuestaIA);
      return NextResponse.json({ error: "Error al procesar la respuesta de la IA" }, { status: 500 });
    }

    // Validar estructura de la respuesta
    if (!fichasGeneradas.fichas || !Array.isArray(fichasGeneradas.fichas)) {
      return NextResponse.json({ error: "Formato de respuesta inválido" }, { status: 500 });
    }

    // Agregar IDs y recursoId a las fichas
    const fichasConIds = fichasGeneradas.fichas.map((ficha: any, index: number) => ({
      id: (index + 1).toString(),
      ...ficha,
      recursoId: recursoId,
    }));

    if (
      !hasSubscription &&
      nonSubIaAccess?.ok &&
      nonSubIaAccess.mode === "wallet"
    ) {
      const chargeCents = computeWalletChargeFromTokenUsage({
        model,
        usage: response.usage,
        discountPercent: nonSubIaAccess.walletDiscountPercent ?? 0,
      });
      try {
        await debitWalletForIa({
          userId: session.user.id,
          chargeCents,
          reason: "ia/fichas",
          meta: { model, usage: response.usage },
        });
      } catch (e) {
        console.error("[ia/fichas] wallet debit", e);
      }
    }

    return withCors(NextResponse.json({
      fichas: fichasConIds,
      recurso: {
        titulo: recurso.titulo,
        materia: recurso.materia?.nombre ?? "Genérica",
      },
    }), request);
  } catch (error) {
    console.error("Error generating fichas:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
  });
} 