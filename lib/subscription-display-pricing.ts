/**
 * Precios mostrados en UI. El `price` en BD / Stripe = tarifa estudiantil.
 * La tarifa de referencia general se muestra como si el estudiante pagara un 40% menos
 * que esa referencia: estudiante = referencia × (1 − 0,4) → referencia = estudiante / 0,6.
 */
export const STUDENT_DISCOUNT_FROM_GENERAL = 0.4;

/** referencia_general ≈ estudiante ÷ (1 − descuento) */
export const GENERAL_REFERENCE_MULTIPLIER_VS_STUDENT = 1 / (1 - STUDENT_DISCOUNT_FROM_GENERAL);

/** @deprecated Usar GENERAL_REFERENCE_MULTIPLIER_VS_STUDENT; antes era ×1,4 (enunciado distinto). */
export const STUDENT_TO_PUBLIC_PRICE_FACTOR = GENERAL_REFERENCE_MULTIPLIER_VS_STUDENT;

export function generalReferencePriceFromStudentCents(studentCents: number): number {
  return Math.round(studentCents / (1 - STUDENT_DISCOUNT_FROM_GENERAL));
}

/** Alias histórico: “público de referencia” = tarifa general de referencia. */
export function studentToPublicPriceCents(studentCents: number): number {
  return generalReferencePriceFromStudentCents(studentCents);
}
