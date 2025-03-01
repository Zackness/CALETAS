"use server";

import bcrypt from "bcrypt";
import * as z from "zod";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail, getUserByName } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Algo ha salido mal!" };
    }

    const { email, password, name, cedula, telefono, empresa, codigo } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingMail = await getUserByEmail(email);

    const existingUser = await getUserByName(name);

    if (existingMail) {
        return { error: "Este correo ya esta asociado a un usuario"}
    }

    if (existingUser) {
        return { error: "Este nombre de usuario ya fue asignado"}
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            cedula,
            telefono,
            empresa,
            codigoEmpresa: codigo,
        },
    });

    const verificationToken = await generateVerificationToken(email);

    await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
    );

    return { succes: "El correo de verificación se envió correctamente"}
};

