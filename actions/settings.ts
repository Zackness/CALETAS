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
    // Cast values to proper types
    const typedValues = values as {
        email?: string;
        password?: string;
        newPassword?: string;
        isTwoFactorEnabled?: boolean;
        telefono?: string;
        EstadoDeResidencia?: any;
        ciudadDeResidencia?: string;
    };
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



        // Actualizar email si es necesario
        if (typedValues.email && typedValues.email !== user.email) {
            const existingUser = await getUserByEmail(typedValues.email);

            if (existingUser && existingUser.id !== user.id) {
                console.error("El correo electrónico ya está en uso");
                return { error: "El correo electronico se encuentra en uso" }
            }

            const verificationToken = await generateVerificationToken(
                typedValues.email
            );
            await sendVerificationEmail(
                verificationToken.email,
                verificationToken.token,
            );

            return { succes: "Hemos enviado un correo para verificar tu nuevo Email" };
        }

        // Actualizar contraseña si es necesario
        if (typedValues.password && typedValues.newPassword) {
            const passwordsMatch = await bcrypt.compare(
                typedValues.password,
                dbUser.password!
            );

            if (!passwordsMatch) {
                return { error: "Contraseña incorrecta" };
            }

            const hashedPassword = await bcrypt.hash(typedValues.newPassword, 10);
            typedValues.password = hashedPassword;
            typedValues.newPassword = undefined;
        }

        // Actualizar los datos del usuario
        await db.user.update({
            where: { id: user.id },
            data: {
                email: typedValues.email || undefined,
                password: typedValues.password || undefined,
                isTwoFactorEnabled: typedValues.isTwoFactorEnabled || undefined,
                telefono: typedValues.telefono || undefined,
                ciudadDeResidencia: typedValues.ciudadDeResidencia || undefined,
            }
        });

        return { succes: "Configuración actualizada!" };
    } catch (error) {
        console.error("Error al actualizar configuración:", error);
        return { error: "Algo ha salido mal!" };
    }
}