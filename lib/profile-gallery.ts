/** Normaliza el campo JSON `profileGalleryUrls` del usuario a un array de strings. */
export function parseProfileGalleryUrls(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
  }
  return [];
}
