import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import {
  sendBetterAuthResetPasswordEmail,
  sendBetterAuthVerificationEmail,
  sendTwoFactorTokenEmail,
} from "@/lib/mail";

export const auth = betterAuth({
  appName: "Caletas",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
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
        return await bcrypt.compare(password, hash);
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendBetterAuthVerificationEmail(user.email, url);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    },
  },
  plugins: [
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
