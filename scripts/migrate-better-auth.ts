import { db } from "../lib/db";
import crypto from "node:crypto";

async function main() {
  console.log("Iniciando migración a Better Auth...");

  // 1) Marcar verificación de email basada en el campo viejo (timestamp)
  const users = await db.user.findMany({
    select: {
      id: true,
      emailVerified: true,
      isEmailVerified: true,
      password: true,
      isTwoFactorEnabled: true,
    },
  });

  let updatedVerified = 0;
  for (const u of users) {
    const shouldBeVerified = !!u.emailVerified;
    if (shouldBeVerified && !u.isEmailVerified) {
      await db.user.update({
        where: { id: u.id },
        data: { isEmailVerified: true },
      });
      updatedVerified++;
    }
  }
  console.log(`Emails marcados como verificados: ${updatedVerified}`);

  // 2) Desactivar 2FA existente (para evitar lockout; Better Auth usa otra tabla)
  const disabled2fa = await db.user.updateMany({
    where: { isTwoFactorEnabled: true },
    data: { isTwoFactorEnabled: false },
  });
  console.log(`2FA desactivado en usuarios: ${disabled2fa.count}`);

  // 3) Migrar credenciales: User.password -> AuthAccount(providerId=credential)
  let createdCredentialAccounts = 0;
  for (const u of users) {
    if (!u.password) continue;

    const existing = await db.authAccount.findFirst({
      where: { userId: u.id, providerId: "credential" },
      select: { id: true },
    });
    if (existing) continue;

    await db.authAccount.create({
      data: {
        id: crypto.randomUUID(),
        providerId: "credential",
        accountId: u.id, // cualquier valor estable; Better Auth lo usa como identificador por proveedor
        userId: u.id,
        password: u.password, // bcrypt hash existente
      },
    });
    createdCredentialAccounts++;
  }
  console.log(`AuthAccount (credential) creadas: ${createdCredentialAccounts}`);

  // 4) Migrar cuentas OAuth desde tabla vieja Account -> AuthAccount
  const legacyAccounts = await db.account.findMany({
    select: {
      userId: true,
      provider: true,
      providerAccountId: true,
      access_token: true,
      refresh_token: true,
      id_token: true,
      scope: true,
      expires_at: true,
    },
  });

  let createdOAuthAccounts = 0;
  for (const a of legacyAccounts) {
    const exists = await db.authAccount.findFirst({
      where: {
        providerId: a.provider,
        accountId: a.providerAccountId,
      },
      select: { id: true },
    });
    if (exists) continue;

    await db.authAccount.create({
      data: {
        id: crypto.randomUUID(),
        providerId: a.provider,
        accountId: a.providerAccountId,
        userId: a.userId,
        accessToken: a.access_token ?? null,
        refreshToken: a.refresh_token ?? null,
        idToken: a.id_token ?? null,
        scope: a.scope ?? null,
        accessTokenExpiresAt: a.expires_at ? new Date(a.expires_at * 1000) : null,
      },
    });
    createdOAuthAccounts++;
  }
  console.log(`AuthAccount (oauth) creadas: ${createdOAuthAccounts}`);

  console.log("Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

