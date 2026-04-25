/**
 * Ruta para abrir una caleta desde la app.
 * Con archivo en CDN/storage el visor es `/view-file/[filename]`; si no hay archivo, `/caletas/[id]` (página de detalle).
 */
export function recursoToExploreHref(recurso: { id: string; archivoUrl?: string | null }): string {
  const raw = recurso.archivoUrl?.trim();
  if (raw) {
    const parts = raw.split("/");
    const filename = parts[parts.length - 1];
    if (filename) return `/view-file/${encodeURIComponent(filename)}`;
  }
  return `/caletas/${recurso.id}`;
}
