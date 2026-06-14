/**
 * Catálogo de funciones IA + matriz plan ↔ acceso (para UI de suscripción).
 * Ejecutar tras `ensure-subscription-types.js` cuando la BD esté disponible:
 *   node scripts/seed-ia-catalog-and-rules.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const GATEWAY_PRICING = "https://vercel.com/docs/ai-gateway/pricing";
const GATEWAY_MODELS = "https://vercel.com/ai-gateway/models";

const CATALOG = [
  {
    featureKey: "ia_chat",
    displayNameEs: "Chat IA (tutor)",
    descriptionEs: "Mensajes con modelo configurable; coste según tokens entrada/salida.",
    vercelPricingUrl: `${GATEWAY_PRICING} · modelos: ${GATEWAY_MODELS}`,
    listInputUsdPer1M: 0.15,
    listOutputUsdPer1M: 0.6,
    referenceModelIds: "openai/gpt-4o-mini (referencia barata)",
    freeInTrial: true,
    meteredAfterTrial: true,
    sortOrder: 10,
  },
  {
    featureKey: "ia_resumir",
    displayNameEs: "Resumir / explicar contenido",
    descriptionEs: "Resúmenes estructurados desde texto o PDF (texto extraído).",
    vercelPricingUrl: GATEWAY_MODELS,
    listInputUsdPer1M: 2.5,
    listOutputUsdPer1M: 10,
    referenceModelIds: "openai/gpt-4o (referencia trabajo pesado)",
    freeInTrial: true,
    meteredAfterTrial: true,
    sortOrder: 20,
  },
  {
    featureKey: "ia_fichas",
    displayNameEs: "Fichas de estudio",
    descriptionEs: "Generación de fichas desde un recurso.",
    vercelPricingUrl: GATEWAY_MODELS,
    listInputUsdPer1M: 2.5,
    listOutputUsdPer1M: 10,
    referenceModelIds: "openai/gpt-4o",
    freeInTrial: true,
    meteredAfterTrial: true,
    sortOrder: 30,
  },
  {
    featureKey: "ia_cuestionario",
    displayNameEs: "Cuestionario tipo test",
    descriptionEs: "Preguntas de opción múltiple con explicaciones.",
    vercelPricingUrl: GATEWAY_MODELS,
    listInputUsdPer1M: 2.5,
    listOutputUsdPer1M: 10,
    referenceModelIds: "openai/gpt-4o",
    freeInTrial: true,
    meteredAfterTrial: true,
    sortOrder: 40,
  },
  {
    featureKey: "cronograma_ia",
    displayNameEs: "Cronograma IA (texto + audio)",
    descriptionEs: "Interpretar texto a eventos; transcripción con Whisper (precio por minuto en lista).",
    vercelPricingUrl: `${GATEWAY_PRICING} · audio: Whisper en lista de modelos`,
    listInputUsdPer1M: 0.15,
    listOutputUsdPer1M: 0.6,
    referenceModelIds: "openai/gpt-4o-mini + whisper-1",
    freeInTrial: true,
    meteredAfterTrial: true,
    sortOrder: 50,
  },
];

async function upsertCatalog() {
  const byKey = {};
  for (const row of CATALOG) {
    const rec = await prisma.iaFeatureCatalog.upsert({
      where: { featureKey: row.featureKey },
      create: { ...row },
      update: {
        displayNameEs: row.displayNameEs,
        descriptionEs: row.descriptionEs,
        vercelPricingUrl: row.vercelPricingUrl,
        listInputUsdPer1M: row.listInputUsdPer1M,
        listOutputUsdPer1M: row.listOutputUsdPer1M,
        referenceModelIds: row.referenceModelIds,
        freeInTrial: row.freeInTrial,
        meteredAfterTrial: row.meteredAfterTrial,
        sortOrder: row.sortOrder,
      },
    });
    byKey[row.featureKey] = rec.id;
  }
  return byKey;
}

async function upsertRule(subscriptionTypeId, catalogId, accessKind, notesEs) {
  await prisma.subscriptionTypeIaAccess.upsert({
    where: {
      subscriptionTypeId_iaFeatureCatalogId: {
        subscriptionTypeId,
        iaFeatureCatalogId: catalogId,
      },
    },
    create: { subscriptionTypeId, iaFeatureCatalogId: catalogId, accessKind, notesEs },
    update: { accessKind, notesEs },
  });
}

async function main() {
  const idsByFeature = await upsertCatalog();

  const basics = await prisma.subscriptionType.findFirst({ where: { name: "CALETA BASICS" } });
  const pro = await prisma.subscriptionType.findFirst({ where: { name: "CALETA PRO" } });
  const tools = await prisma.subscriptionType.findFirst({ where: { name: "CALETA IA TOOLS" } });

  if (!basics || !pro || !tools) {
    console.warn("Faltan tipos de suscripción. Ejecuta antes: node scripts/ensure-subscription-types.js");
  }

  const allKeys = Object.keys(idsByFeature);

  if (basics) {
    for (const k of allKeys) {
      await upsertRule(
        basics.id,
        idsByFeature[k],
        "consumption",
        "Misma billetera que el resto de la app; paga por tokens + margen. Recarga mínima $1 USD.",
      );
    }
  }

  if (pro) {
    for (const k of allKeys) {
      await upsertRule(pro.id, idsByFeature[k], "included", "Incluido en la cuota mensual del plan (sin cargo por mensaje/uso estándar en flujo actual).");
    }
  }

  if (tools) {
    for (const k of allKeys) {
      const blocked = k === "ia_chat";
      await upsertRule(
        tools.id,
        idsByFeature[k],
        blocked ? "blocked" : "included",
        blocked ? "Este plan no incluye Chat IA." : "Incluido en la cuota mensual del plan.",
      );
    }
  }

  console.log("✅ Catálogo IA y reglas por plan actualizados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
