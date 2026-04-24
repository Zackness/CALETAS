export async function copyToClipboardWithFallback(text: string) {
  // 1) Clipboard API (preferida)
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // seguimos con fallback
  }

  // 2) Fallback clásico: textarea + execCommand
  if (typeof document === "undefined") {
    throw new Error("Clipboard no disponible");
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";

  document.body.appendChild(el);
  el.focus();
  el.select();

  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("No se pudo copiar");
  } finally {
    document.body.removeChild(el);
  }
}

export async function shareOrCopyUrl(params: { title?: string; text?: string; url: string }) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      return { shared: true as const };
    }
  } catch {
    // si falla share, hacemos fallback a copiar
  }

  await copyToClipboardWithFallback(params.url);
  return { shared: false as const };
}

