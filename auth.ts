import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { getUserById } from "./data/user"
import { db } from "./lib/db"
import authConfig from "./auth.config"
import { UserRole } from "@prisma/client"
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation"
import { getAccountByUserId } from "./data/account"

export const { auth, handlers, signIn, signOut } 
= NextAuth({
    pages: {
        signIn: "/login",
        error: "/error",
    },
    events: {
        async linkAccount({ user }) {
            await db.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() }
            })
        }
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user.id) {
                // Si no hay ID, no permitir el inicio de sesión.
                return false;
            }
            // Allow OAuth without email verification
            if (account?.provider !== "credentials") return true;

            const existingUser = await getUserById(user.id);

            // Prevent sign in without email verification
            if (!existingUser?.emailVerified) return false;

            // 2FA is here
            if (existingUser.isTwoFactorEnabled) {
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

                if (!twoFactorConfirmation) return false;

                // Delete two factor confirmation for next sign in
                await db.twoFactorConfirmation.delete({
                    where: { id: twoFactorConfirmation.id }
                });
            }

            return true;
        },
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
    
            if (token.role && session.user) {
                session.user.role = token.role as UserRole;
            }
    
            if (session.user) {
                const user = session.user as any;
                user.name = token.name || "";
                user.name2 = token.name2;
                user.apellido = token.apellido;
                user.apellido2 = token.apellido2;
                user.email = token.email || "";
                user.isOAuth = token.isOAuth as boolean;

                user.telefono = token.telefono;
        
                user.ciudadDeResidencia = token.ciudadDeResidencia;
            }
    
            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token;
    
            const existingUser = await getUserById(token.sub);
    
            if (!existingUser) return token;
    
            const existingAccount = await getAccountByUserId(existingUser.id);
    
            token.isOAuth = !!existingAccount;
            token.name = existingUser.name || "";
            token.apellido = existingUser.apellido;
            token.email = existingUser.email || "";
            token.role = existingUser.role;
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

            token.telefono = existingUser.telefono;
    
            token.ciudadDeResidencia = existingUser.ciudadDeResidencia;
            return token;
        },
    },
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
        maxAge: 2 * 60 * 60,
    },
    trustHost: true,
    ...authConfig,
});