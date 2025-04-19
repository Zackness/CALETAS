import { newPassword } from "@/actions/new-password";
import { UserRole } from "@prisma/client";
import * as z from "zod";

export const SettingsSchema = z.object ({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([ UserRole.ADMIN, UserRole.CLIENT ]),
    email: z.optional(z.string().email({
        message: "Por favor, ingresa un correo electrónico válido"
    })),
    password: z.optional(z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres"
    })),
    newPassword: z.optional(z.string().min(6, {
        message: "La nueva contraseña debe tener al menos 6 caracteres"
    })),
})
    .refine((data) => {
        if (data.password && !data.newPassword) {
            return false;
        }

        return true;
    }, {
        message: "La nueva contraseña es requerida",
        path: ["newPassword"]
    })

    .refine((data) => {
        if (data.newPassword && !data.password) {
            return false;
        }

        return true;
    }, {
        message: "La contraseña es requerida",
        path: ["password"]
    })

export const NewPasswordSchema = z.object({
    password: z.string()
        .min(6, {
            message: "La contraseña debe tener al menos 6 caracteres"
        })
        .max(100, {
            message: "La contraseña no puede tener más de 100 caracteres"
        })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
        }),
});

export const ResetSchema = z.object({
    email: z.string()
        .email({
            message: "Por favor, coloca un correo electronico"
        })
        .transform(email => email.toLowerCase().trim()),
});

export const LoginSchema = z.object({
    email: z.string()
        .email({
            message: "Por favor, coloca un correo electronico"
        })
        .transform(email => email.toLowerCase().trim()),
    password: z.string()
        .min(1, {
            message: "Por favor, ingresa una contraseña valida"
        })
        .max(100, {
            message: "La contraseña no puede tener más de 100 caracteres"
        }),
    code: z.optional(z.string()
        .max(6, {
            message: "El código no puede tener más de 6 caracteres"
        })
        .regex(/^[0-9]+$/, {
            message: "El código solo puede contener números"
        })
    ),
});

export const RegisterSchema = z.object({
    email: z.string()
        .email({
            message: "Por favor, coloca un correo electronico"
        })
        .transform(email => email.toLowerCase().trim()),
    password: z.string()
        .min(6, {
            message: "La contraseña debe tener al menos 6 caracteres"
        })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
        }),
    name: z.string()
        .min(1, {
            message: "Es necesario un nombre de usuario"
        })
        .max(50, {
            message: "El nombre de usuario no puede tener más de 50 caracteres"
        })
        .regex(/^[a-zA-Z0-9_-]+$/, {
            message: "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"
        })
        .transform(name => name.trim()),
});


