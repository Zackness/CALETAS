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

export const NewPasswordSchema = z.object ({
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres"
    }),
});

export const ResetSchema = z.object ({
    email: z.string().email({
        message: "Por favor, coloca un correo electronico"
    }),
});

export const LoginSchema = z.object ({
    email: z.string().email({
        message: "Por favor, coloca un correo electronico"
    }),
    password: z.string().min(1, {
        message: "Por favor, ingresa una contraseña valida"
    }),
    code: z.optional(z.string()),
});

export const RegisterSchema = z.object ({
    email: z.string().email({
        message: "Por favor, coloca un correo electronico"
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres"
    }),
    name: z.string().min(1, {
        message: "Es necesario un nombre de usuario"
    }),
    cedula: z.string().min(1, {
        message: "Debe identificarse con un numero de cedula"
    }),
    telefono: z.string().min(1, {
        message: "Debe agregar un numero de telefono"
    }),
    empresa: z.string().min(1, {
        message: "Debe seleccionar una empresa"
    }),
    codigo: z.string().min(1, {
        message: "Debe agregar el codigo de su empresa"
    }),
});


