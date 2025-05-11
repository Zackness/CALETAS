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

        // Si se subió una nueva CI, analizarla y actualizar los datos
        if (values.ciPhoto) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/onboarding/analyze`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ciPhoto: values.ciPhoto }),
                });

                if (!response.ok) {
                    throw new Error('Error al analizar la CI');
                }

                const ciData = await response.json();
                
                if (!ciData) {
                    return { error: "No se pudo analizar la cédula de identidad" };
                }

                // Actualizar los datos del usuario con la información de la CI
                await db.user.update({
                    where: { id: user.id },
                    data: {
                        name: ciData.nombre,
                        name2: ciData.nombre2 || null,
                        apellido: ciData.apellido,
                        apellido2: ciData.apellido2 || null,
                        cedula: ciData.cedula,
                        estadoCivil: ciData.estadoCivil,
                        fechaNacimiento: ciData.fechaNacimiento,
                        isCiVerified: true,
                    }
                });

                return { succes: "Datos actualizados correctamente" };
            } catch (error) {
                console.error("Error al analizar la CI:", error);
                return { error: "Error al analizar la cédula de identidad" };
            }
        }

        // Actualizar email si es necesario
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

        // Actualizar contraseña si es necesario
        if (values.password && values.newPassword) {
            const passwordsMatch = await bcrypt.compare(
                values.password,
                dbUser.password!
            );

            if (!passwordsMatch) {
                return { error: "Contraseña incorrecta" };
            }

            const hashedPassword = await bcrypt.hash(values.newPassword, 10);
            values.password = hashedPassword;
            values.newPassword = undefined;
        }

        // Actualizar los datos del usuario
        await db.user.update({
            where: { id: user.id },
            data: {
                email: values.email,
                password: values.password,
                isTwoFactorEnabled: values.isTwoFactorEnabled,
                telefono: values.telefono,
                EstadoDeResidencia: values.EstadoDeResidencia,
                ciudadDeResidencia: values.ciudadDeResidencia,
            }
        });

        return { succes: "Configuración actualizada!" };
    } catch (error) {
        console.error("Error al actualizar configuración:", error);
        return { error: "Algo ha salido mal!" };
    }
}