import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    nickname?: string | null; // Define nickname como opcional y permite null
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}