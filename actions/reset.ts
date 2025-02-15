"use server";

import * as z from "zod";
import { ResetSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
    const validateFields = ResetSchema.safeParse(values);

    if (!validateFields.success) {
        return { error: "Email invalido!"}
    }

    const { email } = validateFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        return { error: "El correo electronico no esta asociado a ninguna cuenta"};
    }

    const passwordResetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(
        passwordResetToken.email,
        passwordResetToken.token,
    );

    return { succes: "La solicitud ha sido enviada correctamente"};
}