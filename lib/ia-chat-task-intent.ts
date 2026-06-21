export type ChatTaskIntent = "code" | "vision" | "reasoning" | "creative" | "general";

export type ChatTaskIntentHint = {
  hasCaletaAttachments?: boolean;
};

export function detectChatTaskIntent(
  text: string | undefined,
  hint?: ChatTaskIntentHint,
): ChatTaskIntent {
  const raw = text ?? "";
  const t = raw.toLowerCase();

  if (
    hint?.hasCaletaAttachments ||
    /imagen|foto|diagrama|figura|gr[aá]fic|visual|ocr|escanead|pdf adjunto|en la caleta|archivo adjunto|captura/i.test(
      t,
    )
  ) {
    return "vision";
  }

  if (
    /```|function\s|const\s|let\s|def\s|class\s|import\s|#include|console\.log|return\s|async\s|await\s/.test(
      raw,
    ) ||
    /c[oó]digo|programa(r|ci[oó]n)?|javascript|typescript|python|java\b|sql|html|css|react|next\.?js|debug|bug|api rest|endpoint|funci[oó]n en/i.test(
      t,
    )
  ) {
    return "code";
  }

  if (/genera(r)?\s+(una\s+)?imagen|crea(r)?\s+(una\s+)?imagen|dibuja|ilustraci[oó]n|logo|mockup/i.test(t)) {
    return "creative";
  }

  if (
    /demostra|demuestra|paso a paso|latex|\$\$|integral|derivada|ecuaci[oó]n|demostraci[oó]n|prueba\s+de|calcul|teorema|demostr/i.test(
      t,
    ) ||
    raw.trim().length >= 1400
  ) {
    return "reasoning";
  }

  if (/redact|ensayo|escribe un|historia|poema|creativ|resumen extens|explicaci[oó]n detallada/i.test(t)) {
    return "creative";
  }

  return "general";
}

export function chatTaskIntentLabel(intent: ChatTaskIntent): string {
  switch (intent) {
    case "code":
      return "código";
    case "vision":
      return "archivos e imágenes";
    case "reasoning":
      return "razonamiento";
    case "creative":
      return "redacción";
    default:
      return "consulta general";
  }
}
