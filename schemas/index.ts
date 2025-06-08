import { newPassword } from "@/actions/new-password";
import { UserRole, EstadoDeResidencia } from "@prisma/client";
import * as z from "zod";

export const SettingsSchema = z.object ({
    // Campos de solo lectura (mostrados pero no editables)
    name: z.string().optional(),
    name2: z.string().optional(),
    apellido: z.string().optional(),
    apellido2: z.string().optional(),
    cedula: z.string().optional(),
    estadoCivil: z.string().optional(),
    
    // Campos editables
    telefono: z.optional(z.string().min(11, {
        message: "Por favor, ingresa un numero de telefono valido"
    })),
    email: z.optional(z.string().email({
        message: "Por favor, ingresa un correo electrónico válido"
    })),
    password: z.optional(z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres"
    })),
    newPassword: z.optional(z.string().min(6, {
        message: "La nueva contraseña debe tener al menos 6 caracteres"
    })),
    isTwoFactorEnabled: z.optional(z.boolean()),
    
    // Nuevos campos para residencia
    EstadoDeResidencia: z.optional(z.nativeEnum(EstadoDeResidencia)),
    ciudadDeResidencia: z.optional(z.string()),
    
    // Campo para subir nueva CI
    ciPhoto: z.optional(z.string()),
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
    });

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
      message: "Es necesario un primer nombre"
  })
  .max(50, {
      message: "El nombre no puede tener más de 50 caracteres"
  })
  .regex(/[a-zA-Z]/, {
      message: "El nombre del usuario solo puede contener letras"
  })
  .transform(name => name.trim()),
  
  EstadoDeResidencia: z.optional(z.string()),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones para registrarte",
  }),
}); 