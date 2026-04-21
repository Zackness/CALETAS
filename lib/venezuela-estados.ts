/** Valor interno del Select cuando el usuario no elige estado (Radix no admite ""). */
export const ESTADO_RESIDENCIA_SIN_ESPECIFICAR = "__none__" as const;

/** Estados de Venezuela (misma lista que onboarding). */
export const VENEZUELA_ESTADOS = [
  "Amazonas",
  "Apure",
  "Aragua",
  "Barinas",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Lara",
  "La Guaira",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Trujillo",
  "Yaracuy",
  "Zulia",
] as const;

export type EstadoVenezuela = (typeof VENEZUELA_ESTADOS)[number];

export function isEstadoVenezuela(value: string | null | undefined): value is EstadoVenezuela {
  if (!value) return false;
  return (VENEZUELA_ESTADOS as readonly string[]).includes(value);
}
