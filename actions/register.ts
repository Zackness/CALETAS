"use server";

import bcrypt from "bcrypt";
import * as z from "zod";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Algo ha salido mal!" };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingMail = await getUserByEmail(email);

    if (existingMail) {
        return { error: "Este correo ya esta asociado a un usuario"}
    }

    // Crear el usuario sin empresa (ahora es opcional)
    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            // No incluimos empresa, ya que es opcional
        },
    });

    const verificationToken = await generateVerificationToken(email);

    await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
    );

    return { succes: "El correo de verificación se envió correctamente. Por favor revise su cuenta de correo y haga click en Verificar"}
};

