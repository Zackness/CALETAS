/** Correos (minúsculas) cuyo código de referido otorga 30% de descuento en consumo de IA por billetera. */
export function getAdminReferrerEmailSet(): Set<string> {
  const raw = process.env.ADMIN_REFERRER_EMAILS || "opsuale@gmail.com";
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminReferrerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminReferrerEmailSet().has(email.trim().toLowerCase());
}
