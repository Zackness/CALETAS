import { getRichTextCaretOffset } from "@/lib/blog/rich-text-range";

/** Detecta `/comando` activo antes del cursor en texto plano / markdown. */
export function findActiveSlash(
  text: string,
  caretIndex: number
): { start: number; end: number; query: string } | null {
  const before = text.slice(0, caretIndex);
  const match = before.match(/(?:^|[\n\s])\/([^\n]*)$/);
  if (!match) return null;
  const query = match[1] ?? "";
  const start = before.length - query.length - 1;
  return { start, end: caretIndex, query };
}

/** Offset del cursor en contentEditable (árbol de texto). */
export function getContentEditableTextOffset(root: HTMLElement): number {
  return getRichTextCaretOffset(root);
}

/** Coordenadas del caret en textarea (aprox.) para posicionar el menú. */
export function getTextareaCaretCoords(
  textarea: HTMLTextAreaElement,
  caretIndex: number
): { top: number; left: number } {
  const rect = textarea.getBoundingClientRect();
  const style = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const textBefore = textarea.value.slice(0, caretIndex);
  const lines = textBefore.split("\n");
  const lineIndex = lines.length - 1;
  const col = lines[lineIndex]?.length ?? 0;
  const charWidth = 7.2;
  const top =
    rect.top +
    paddingTop +
    lineIndex * lineHeight -
    textarea.scrollTop +
    lineHeight;
  const left = rect.left + paddingLeft + col * charWidth - textarea.scrollLeft;
  return { top, left };
}

export function getRangeCaretCoords(): { top: number; left: number } | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);

  const clientRects = range.getClientRects();
  const rect =
    clientRects.length > 0
      ? clientRects[clientRects.length - 1]!
      : range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) return null;
  return { top: rect.bottom + 4, left: rect.left };
}
