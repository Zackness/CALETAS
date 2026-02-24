const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "opsuale@gmail.com";

  console.log(`🔐 Configurando ADMIN para: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!user) {
    console.error(`❌ No existe un usuario con email ${email}`);
    process.exitCode = 1;
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const demoted = await tx.user.updateMany({
      where: {
        role: "ADMIN",
        email: { not: email },
      },
      data: { role: "CLIENT" },
    });

    const promoted = await tx.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true, name: true },
    });

    return { demoted, promoted };
  });

  console.log(`✅ Admin asignado: ${result.promoted.email} (${result.promoted.name || "sin nombre"})`);
  console.log(`↩️  Admins degradados a CLIENT: ${result.demoted.count}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

