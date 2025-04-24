import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    name?: string | null;
    name2?: string | null;
    apellido?: string | null;
    apellido2?: string | null;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: UserRole;
        isTwoFactorEnabled?: boolean;
        isOAuth?: boolean;
        name?: string | null;
        name2?: string | null;
        apellido?: string | null;
        apellido2?: string | null;
    }
}