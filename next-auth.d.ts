import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    name: string;
    name2: any;
    apellido: any;
    apellido2: any;
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
        name?: string;
        name2?: any;
        apellido?: any;
        apellido2?: any;
    }
}