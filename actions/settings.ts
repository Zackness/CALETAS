"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import bcrypt from "bcrypt";

export const settings = async (
    values: z.infer<typeof SettingsSchema>
) => {
    console.log("Iniciando actualización de configuración con valores:", values);
    
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            console.error("No se encontró usuario autenticado");
            return { error: "No tienes autorizacion"}
        }

        const dbUser = await getUserById(user.id);

        if (!dbUser) {
            console.error("No se encontró usuario en la base de datos");
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
                console.error("El correo electrónico ya está en uso");
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
                console.error("La contraseña actual es incorrecta");
                return { error: "Tu contraseña actual es incorrecta" }
            }

            const hashedPassword = await bcrypt.hash(
                values.newPassword,
                10,
            );
            values.password = hashedPassword;
            values.newPassword = undefined;
        }

        console.log("Actualizando usuario en la base de datos:", {
            userId: dbUser.id,
            values: values
        });

        await db.user.update({
            where: { id: dbUser.id },
            data: {
                ...values
            }
        });

        console.log("Usuario actualizado correctamente");
        return {succes: "Ajustes actualizados"}
    } catch (error) {
        console.error("Error al actualizar la configuración:", error);
        return { error: "Error al actualizar la configuración" }
    }
}