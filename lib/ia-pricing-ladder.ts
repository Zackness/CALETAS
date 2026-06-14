/**
 * Política de precios recomendada (estudiantes VE/LATAM vs público).
 * Los costes variables reales siguen la lista del proveedor vía Vercel AI Gateway.
 * @see https://vercel.com/docs/ai-gateway/pricing
 * @see https://vercel.com/ai-gateway/models
 */
export const IA_GATEWAY_PRICING_DOC = "https://vercel.com/docs/ai-gateway/pricing";
export const IA_GATEWAY_MODELS_DOC = "https://vercel.com/ai-gateway/models";

/** Margen fijo sobre precio de lista del upstream (igual que `IA_PLATFORM_MARGIN` en código de cobro). */
export const RECOMMENDED_PLATFORM_MARGIN = 1.1;

/** Descuento estudiantil respecto al precio de referencia general (40%). */
export const RECOMMENDED_STUDENT_DISCOUNT_FROM_GENERAL_PERCENT = 40;

const STUDENT_SHARE_OF_GENERAL = 1 - RECOMMENDED_STUDENT_DISCOUNT_FROM_GENERAL_PERCENT / 100;

/** referencia_general ≈ estudiante ÷ 0,6 (misma lógica que `generalReferencePriceFromStudentCents`). */
export const RECOMMENDED_GENERAL_REFERENCE_VS_STUDENT_MULTIPLIER = 1 / STUDENT_SHARE_OF_GENERAL;

/** @deprecated Usar RECOMMENDED_GENERAL_REFERENCE_VS_STUDENT_MULTIPLIER (antes ×1,4 sobre estudiante). */
export const RECOMMENDED_PUBLIC_VS_STUDENT_FACTOR = RECOMMENDED_GENERAL_REFERENCE_VS_STUDENT_MULTIPLIER;

/** Recargas sugeridas en USD para estudiantes (presupuestos bajos: prueba, semana, mes). */
export const RECOMMENDED_STUDENT_TOP_UPS_USD = [1, 3, 5, 10] as const;

/** Recargas sugeridas en precio de referencia general (estudiante ÷ 0,6). */
export const RECOMMENDED_PUBLIC_TOP_UPS_USD = RECOMMENDED_STUDENT_TOP_UPS_USD.map((u) =>
  Math.round((u / STUDENT_SHARE_OF_GENERAL) * 100) / 100,
) as readonly number[];

export const IA_PRICING_RATIONALE_ES = [
  "Los sueldos y becas estudiantiles en Venezuela y gran parte de Latinoamérica son bajos frente al dólar: conviene mantener recargas pequeñas ($1–$10) y modelos baratos por defecto (p. ej. gpt-4o-mini).",
  "El coste real por uso = tokens × precio de lista del modelo en el AI Gateway + margen de plataforma (aprox. 10% sobre lista, configurable).",
  "En pantalla, la tarifa estudiantil se muestra como ~40% menor que el precio de referencia general (referencia ≈ tarifa estudiantil ÷ 0,6, redondeada en centavos).",
  "Revisa periódicamente la página de modelos de Vercel: los USD/1M tokens cambian; actualiza el catálogo en BD o script de seed cuando cambien listas relevantes.",
].join(" ");
