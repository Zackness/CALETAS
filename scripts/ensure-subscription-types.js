const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertByName({ name, description, price, period }) {
  const existing = await prisma.subscriptionType.findFirst({
    where: { name },
    select: { id: true },
  });

  if (existing?.id) {
    await prisma.subscriptionType.update({
      where: { id: existing.id },
      data: { description, price, period },
    });
    return { id: existing.id, created: false };
  }

  const created = await prisma.subscriptionType.create({
    data: { name, description, price, period },
    select: { id: true },
  });

  return { id: created.id, created: true };
}

async function main() {
  console.log("🔧 Asegurando planes de suscripción...");

  // NOTA: `price` está en centavos (unit_amount de Stripe).
  const basics = await upsertByName({
    name: "CALETA BASICS",
    description: "Acceso a herramientas IA. Cobro diario ($1/día).",
    price: 100,
    period: "day",
  });

  const pro = await upsertByName({
    name: "CALETA PRO",
    description: "Acceso completo a herramientas IA. Cobro mensual ($7/mes).",
    price: 700,
    period: "month",
  });

  console.log("✅ Listo.");
  console.log(`- CALETA BASICS: ${basics.id} (${basics.created ? "creado" : "actualizado"})`);
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

