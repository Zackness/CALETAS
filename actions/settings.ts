"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";

export const settings = async (
    values: z.infer<typeof SettingsSchema>
) => {
    const user = await currentUser();

    if (!user || !user.id) {
        return { error: "No tienes autorizacion"}
    }

    const dbUser = await getUserById(user.id);

    if (!dbUser) {
        return { error: "No tienes autorizacion"}
    }

    if (user.isOAuth) {
        values.email = undefined;
        values.password = undefined;
        values.newPassword = undefined;
        values.isTwoFactorEnabled = undefined;
    }

    if (values.email && values.email !== user.email) {
        const existingUser = await getUserByEmail(values.email);

        if (existingUser && existingUser.id !== user.id) {
            return { error: "El correo electronico se encuentra en uso" }
        }

        const verificationToken = await generateVerificationToken(
            values.email
        );
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        return { succes: "Hemos enviado un correo para verificar tu nuevo Email" };
    }

    if (values.password && values.newPassword && dbUser.password) {
        const passwordsMatch = await bcrypt.compare(
            values.password,
            dbUser.password,
        );

        if (!passwordsMatch) {
            return { error: "Tu contraseña actual es incorrecta" }
        }

        const hashedPassword = await bcrypt.hash(
            values.newPassword,
            10,
        );
        values.password = hashedPassword;
        values.newPassword = undefined;
    }

    await db.user.update({
        where: { id: dbUser.id },
        data: {
            ...values
        }
    });

    return {succes: "Ajustes actualizados"}
}