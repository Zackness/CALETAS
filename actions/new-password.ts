"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

export const newPassword = async (
    values: z.infer<typeof NewPasswordSchema>,
    token?: string | null,
) => {
    if (!token) {
        return {error: "El token no existe!"}
    }

    const validateFields = NewPasswordSchema.safeParse(values);

    if (!validateFields.success) {
        return { error: "Contraseña invalida!"}
    }

    const { password } = validateFields.data;

    const existingToken = await getPasswordResetTokenByToken(token);

    if (!existingToken) {
        return { error: "Token invalido!"};
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        return {error: "El token ha expirado :("}
    }

    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
        return { error: "El correo electronico no esta asociado a ninguna cuenta"};
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
    });

    await db.passwordResetToken.delete({
        where: { id: existingToken.id }
    });

    return {succes: "Contraseña actualizada!"};
};