export function caletaTaskCardDescriptionPreview(description: string | null | undefined): string | null {
  if (!description) return null;
  const lines = description
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const text = lines.join(" ");
  if (text.length <= 160) return text;
  return `${text.slice(0, 157)}…`;
}
