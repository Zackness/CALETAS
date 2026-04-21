import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { expo } from "@better-auth/expo";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { createAuthMiddleware } from "better-auth/api";
import { verifyPassword as scryptVerifyPassword } from "better-auth/crypto";

import { db } from "@/lib/db";
import {
  sendBetterAuthResetPasswordEmail,
  sendBetterAuthVerificationEmail,
  sendTwoFactorTokenEmail,
} from "@/lib/mail";

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // Expo / React Native
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:19000",
  "exp://192.168.*.*:*/**",
  "caletas://",
].filter(Boolean) as string[];

const socialProviders: Record<string, any> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  socialProviders.twitch = {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  appName: "Caletas",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    modelName: "User",
    fields: {
      // En tu esquema actual, el timestamp se mantiene en `emailVerified` (DateTime?).
      // Better Auth requiere un booleano; lo guardamos en `isEmailVerified`.
      emailVerified: "isEmailVerified",
    },
  },
  session: {
    modelName: "AuthSession",
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 días
    },
  },
  account: {
    modelName: "AuthAccount",
  },
  verification: {
    modelName: "AuthVerification",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendBetterAuthResetPasswordEmail(user.email, url);
    },
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        // Compat: Auth.js (bcrypt) + Better Auth (scrypt salt:key)
        if (/^\$2[aby]\$/.test(hash)) {
          return await bcrypt.compare(password, hash);
        }
        return await scryptVerifyPassword({ hash, password });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendBetterAuthVerificationEmail(user.email, url);
    },
  },
  ...(Object.keys(socialProviders).length ? { socialProviders } : {}),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Compat: usuarios existentes con hash en `User.password` (Auth.js).
      // Better Auth espera un AuthAccount(providerId="credential"). Si no existe, lo creamos al vuelo.
      if (!ctx.path?.endsWith("/sign-in/email")) return;

      const email = (ctx.body as any)?.email as string | undefined;
      if (!email) return;

      try {
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            password: true,
            emailVerified: true,
            isEmailVerified: true,
          },
        });
        if (!user?.id || !user.password) return;

        // Sync de verificación: si antes se verificó con timestamp, reflejarlo en booleano.
        if (user.emailVerified && !user.isEmailVerified) {
          await db.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true },
          });
        }

        const existingCredential = await db.authAccount.findFirst({
          where: { userId: user.id, providerId: "credential" },
          select: { id: true },
        });
        if (existingCredential) return;

        await db.authAccount.create({
          data: {
            id: crypto.randomUUID(),
            providerId: "credential",
            accountId: user.id,
            userId: user.id,
            password: user.password, // bcrypt hash legacy
          },
        });
      } catch (error) {
        // No bloqueamos el login si falla este paso de compatibilidad.
        // Better Auth podrá manejar el flujo normal y el usuario verá un error real si aplica.
        console.error("[auth-hook] pre sign-in email compat failed:", error);
        return;
      }
    }),
  },
  plugins: [
    expo(),
    twoFactor({
      schema: {
        user: {
          fields: {
            twoFactorEnabled: "isTwoFactorEnabled",
          },
        },
      },
      otpOptions: {
        async sendOTP({ user, otp }) {
          void sendTwoFactorTokenEmail(user.email, otp);
        },
      },
    }),
    passkey(),
    nextCookies(),
  ],
});

export const getSession = async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    // Si la DB no está accesible (por ejemplo Neon caído), no debemos tumbar SSR con 500.
    // En esos casos tratamos como "sin sesión" y dejamos que el layout redirija a /login.
    console.error("[auth] getSession failed:", error);
    return null;
  }
};

export const currentUser = async () => {
  const session = await getSession();
  return session?.user ?? null;
};
