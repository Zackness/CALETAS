"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { ESTADO_RESIDENCIA_SIN_ESPECIFICAR } from "@/lib/venezuela-estados";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser, auth } from "@/lib/auth";
import { headers } from "next/headers";
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
        ciudadDeResidencia?: string;
        estadoDeResidencia?: string | null;
        universidadId?: string | null;
        carreraId?: string | null;
        confirmarResetProgresoAcademico?: boolean;
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

        const linkedAccounts = await db.authAccount.findMany({
            where: { userId: user.id },
            select: { providerId: true },
        });

        const isOAuth = linkedAccounts.some((a) => a.providerId !== "credential");
        if (isOAuth) {
            values.email = undefined;
            values.password = undefined;
            values.newPassword = undefined;
        }



        // Actualizar email si es necesario
        if (typedValues.email && typedValues.email !== user.email) {
            const existingUser = await getUserByEmail(typedValues.email);

            if (existingUser && existingUser.id !== user.id) {
                console.error("El correo electrónico ya está en uso");
                return { error: "El correo electronico se encuentra en uso" }
            }

            await auth.api.changeEmail({
                body: {
                    newEmail: typedValues.email,
                    callbackURL: "/ajustes",
                },
                headers: await headers(),
            });

            return { succes: "Hemos enviado un correo para verificar tu nuevo Email" };
        }

        // Actualizar contraseña si es necesario
        if (typedValues.password && typedValues.newPassword) {
            const passwordsMatch = await bcrypt.compare(
                typedValues.password,
                dbUser.password || ""
            );

            if (!passwordsMatch) {
                return { error: "Contraseña incorrecta" };
            }

            const hashedPassword = await bcrypt.hash(typedValues.newPassword, 10);
            typedValues.password = hashedPassword;
            typedValues.newPassword = undefined;
        }

        const willUpdateUniversidad = typedValues.universidadId !== undefined;
        const willUpdateCarrera = typedValues.carreraId !== undefined;
        const nextUniversidadId = willUpdateUniversidad ? typedValues.universidadId : dbUser.universidadId;
        const nextCarreraId = willUpdateCarrera ? typedValues.carreraId : dbUser.carreraId;

        const changingUniversidadOrCarrera =
          (willUpdateUniversidad && (typedValues.universidadId ?? null) !== (dbUser.universidadId ?? null)) ||
          (willUpdateCarrera && (typedValues.carreraId ?? null) !== (dbUser.carreraId ?? null));

        if (changingUniversidadOrCarrera && !typedValues.confirmarResetProgresoAcademico) {
          return {
            error:
              "Cambiar tu universidad o carrera borrará tu progreso académico (materias y metas). Confirma para continuar.",
          };
        }

        // Si hay universidad null, carrera debe ser null (no tiene sentido carrera sin universidad)
        if (nextUniversidadId === null && nextCarreraId !== null) {
          return { error: "No puedes seleccionar una carrera sin universidad." };
        }

        // Validar que la carrera pertenece a la universidad seleccionada
        if (nextUniversidadId && nextCarreraId) {
          const carrera = await db.carrera.findUnique({
            where: { id: nextCarreraId },
            select: { universidadId: true },
          });
          if (!carrera) return { error: "La carrera seleccionada no existe." };
          if (carrera.universidadId !== nextUniversidadId) {
            return { error: "La carrera seleccionada no pertenece a la universidad elegida." };
          }
        }

        await db.$transaction(async (tx) => {
          if (changingUniversidadOrCarrera) {
            await tx.materiaEstudiante.deleteMany({ where: { userId: user.id } });
            await tx.metaAcademica.deleteMany({ where: { usuarioId: user.id } });
          }

          await tx.user.update({
            where: { id: user.id },
            data: {
              email: typedValues.email || undefined,
              password: typedValues.password || undefined,
              telefono: typedValues.telefono || undefined,
              ciudadDeResidencia:
                typedValues.ciudadDeResidencia === undefined
                  ? undefined
                  : typedValues.ciudadDeResidencia?.trim() || null,
              estadoDeResidencia:
                typedValues.estadoDeResidencia === undefined
                  ? undefined
                  : typedValues.estadoDeResidencia === ESTADO_RESIDENCIA_SIN_ESPECIFICAR ||
                      !String(typedValues.estadoDeResidencia).trim()
                    ? null
                    : String(typedValues.estadoDeResidencia).trim(),

              universidadId: willUpdateUniversidad ? (typedValues.universidadId ?? null) : undefined,
              carreraId: willUpdateCarrera ? (typedValues.carreraId ?? null) : undefined,

              // Si cambió el contexto académico, limpiar campos derivados
              ...(changingUniversidadOrCarrera
                ? {
                    semestreActual: null,
                    semestreActualManual: false,
                    materiasActuales: null,
                  }
                : {}),
            },
          });
        });

        return { succes: "Configuración actualizada!" };
    } catch (error) {
        console.error("Error al actualizar configuración:", error);
        return { error: "Algo ha salido mal!" };
    }
}