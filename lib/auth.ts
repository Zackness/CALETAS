import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
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
    provider: "mysql",
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
    nextCookies(),
  ],
});

export const getSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
};

export const currentUser = async () => {
  const session = await getSession();
  return session?.user ?? null;
};
