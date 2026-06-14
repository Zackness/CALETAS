const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertByName({
  name,
  description,
  price,
  period,
  billingKind,
  minWalletTopUpCents,
  includedIaTokensPerPeriod,
  iaTokenOverflowPolicy,
}) {
  const bk = billingKind ?? "stripe_recurring";
  const minTop = typeof minWalletTopUpCents === "number" ? minWalletTopUpCents : 0;
  const overflow = iaTokenOverflowPolicy ?? "wallet";
  const existing = await prisma.subscriptionType.findFirst({
    where: { name },
    select: { id: true },
  });

  const tokenData =
    includedIaTokensPerPeriod === undefined
      ? {}
      : { includedIaTokensPerPeriod };

  if (existing?.id) {
    await prisma.subscriptionType.update({
      where: { id: existing.id },
      data: {
        description,
        price,
        period,
        billingKind: bk,
        minWalletTopUpCents: minTop,
        iaTokenOverflowPolicy: overflow,
        ...tokenData,
      },
    });
    return { id: existing.id, created: false };
  }

  const created = await prisma.subscriptionType.create({
    data: {
      name,
      description,
      price,
      period,
      billingKind: bk,
      minWalletTopUpCents: minTop,
      iaTokenOverflowPolicy: overflow,
      ...tokenData,
    },
    select: { id: true },
  });

  return { id: created.id, created: true };
}

async function main() {
  console.log("🔧 Asegurando planes de suscripción...");

  // NOTA: `price` está en centavos (unit_amount de Stripe).
  const basics = await upsertByName({
    name: "CALETA BASICS",
    description:
      "Plan por consumo unificado con la billetera IA (misma cuenta de saldo que chat, resúmenes, fichas, cuestionario y cronograma). Sin cuota diaria en Stripe: recarga mínima 1 USD y paga según tokens reales (Vercel AI Gateway) + margen de plataforma.",
    price: 100,
    period: "consumption",
    billingKind: "wallet_consumption",
    minWalletTopUpCents: 100,
    includedIaTokensPerPeriod: null,
    iaTokenOverflowPolicy: "wallet",
  });

  const pro = await upsertByName({
    name: "CALETA PRO",
    description:
      "Acceso completo: Chat IA y Caletas cross-universidad. Tarifa estudiantil ~$7/mes (Stripe). Incluye cupo mensual de tokens de IA (prompt+completion); al agotarse sigue por billetera si tienes saldo. Consumo adicional según modelo.",
    price: 700,
    period: "month",
    billingKind: "stripe_recurring",
    minWalletTopUpCents: 0,
    includedIaTokensPerPeriod: 600_000,
    iaTokenOverflowPolicy: "wallet",
  });

  const iaTools = await upsertByName({
    name: "CALETA IA TOOLS",
    description:
      "Herramientas IA sin Chat IA. Tarifa estudiantil ~$4/mes (Stripe). Incluye cupo mensual de tokens de IA; al agotarse sigue por billetera si tienes saldo.",
    price: 399,
    period: "month",
    billingKind: "stripe_recurring",
    minWalletTopUpCents: 0,
    includedIaTokensPerPeriod: 280_000,
    iaTokenOverflowPolicy: "wallet",
  });

  console.log("✅ Listo.");
  console.log(`- CALETA BASICS: ${basics.id} (${basics.created ? "creado" : "actualizado"})`);
  console.log(`- CALETA IA TOOLS: ${iaTools.id} (${iaTools.created ? "creado" : "actualizado"})`);
  console.log(`- CALETA PRO:    ${pro.id} (${pro.created ? "creado" : "actualizado"})`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

