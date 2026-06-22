const RICH_BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "BLOCKQUOTE",
  "PRE",
  "TD",
  "TH",
]);

/** Bloque HTML donde está el cursor (párrafo, encabezado, etc.). */
function getCaretBlockElement(root: HTMLElement): HTMLElement {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return root;
  let node: Node | null = sel.getRangeAt(0).endContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== root) {
    if (node instanceof HTMLElement && RICH_BLOCK_TAGS.has(node.tagName)) return node;
    node = node.parentElement;
  }
  return root;
}

/** Texto desde el inicio de `scope` hasta el cursor. */
function getTextBeforeCaretInScope(scope: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return "";
  const end = sel.getRangeAt(0);
  if (!scope.contains(end.endContainer)) return "";

  const pre = document.createRange();
  pre.selectNodeContents(scope);
  pre.setEnd(end.endContainer, end.endOffset);
  return pre.toString().replace(/\u00a0/g, " ");
}

/** Texto visible antes del cursor en todo el editor. */
export function getTextBeforeCaret(root: HTMLElement): string {
  return getTextBeforeCaretInScope(root);
}

function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  return nodes;
}

function findLastTextInNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const found = findLastTextInNode(node.childNodes[i]);
    if (found) return found;
  }
  return null;
}

/** Resuelve la posición del cursor a un nodo de texto + offset. */
function resolveCaretTextPosition(root: HTMLElement, end: Range): { node: Text; offset: number } | null {
  const nodes = collectTextNodes(root);
  if (nodes.length === 0) return null;

  if (end.endContainer.nodeType === Node.TEXT_NODE) {
    return { node: end.endContainer as Text, offset: end.endOffset };
  }

  if (end.endContainer.nodeType === Node.ELEMENT_NODE) {
    const el = end.endContainer as Element;
    if (end.endOffset > 0) {
      const child = el.childNodes[end.endOffset - 1];
      if (child) {
        const text = findLastTextInNode(child);
        if (text) return { node: text, offset: (text.textContent ?? "").length };
      }
    }
    if (end.endOffset === 0) return { node: nodes[0], offset: 0 };
  }

  const last = nodes[nodes.length - 1];
  return { node: last, offset: (last.textContent ?? "").length };
}

/** Rango DOM entre offsets de texto plano dentro de un mismo scope (bloque). */
function rangeForPlainTextOffsets(
  scope: HTMLElement,
  startOffset: number,
  endOffset: number
): Range | null {
  const nodes = collectTextNodes(scope);
  if (nodes.length === 0 || endOffset < startOffset) return null;

  let pos = 0;
  let startNode: Text | null = null;
  let startOff = 0;
  let endNode: Text | null = null;
  let endOff = 0;

  for (const node of nodes) {
    const len = (node.textContent ?? "").length;
    if (startNode === null && pos + len > startOffset) {
      startNode = node;
      startOff = startOffset - pos;
    }
    if (pos + len >= endOffset) {
      endNode = node;
      endOff = endOffset - pos;
      break;
    }
    pos += len;
  }

  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, Math.max(0, startOff));
  range.setEnd(endNode, Math.min(endOff, endNode.textContent?.length ?? 0));
  return range;
}

/** Crea un Range que abarca los últimos `charCount` caracteres antes del cursor. */
function rangeSpanningCharsBeforeCaret(
  root: HTMLElement,
  end: Range,
  charCount: number
): Range | null {
  if (charCount <= 0) return null;

  const beforeLen = getTextBeforeCaretInScope(root).length;
  const plainStart = Math.max(0, beforeLen - charCount);
  const byOffset = rangeForPlainTextOffsets(root, plainStart, beforeLen);
  if (byOffset) return byOffset;

  const nodes = collectTextNodes(root);
  if (nodes.length === 0) return null;

  const caret = resolveCaretTextPosition(root, end);
  if (!caret) return null;

  const endNode = caret.node;
  let endOffset = caret.offset;
  let remaining = charCount;
  let startNode = endNode;
  let startOff = endOffset;

  let idx = nodes.indexOf(endNode);
  if (idx < 0) idx = nodes.length - 1;

  while (remaining > 0 && idx >= 0) {
    const node = nodes[idx];
    const available = idx === nodes.indexOf(endNode) ? endOffset : (node.textContent ?? "").length;
    const take = Math.min(remaining, available);
    startNode = node;
    startOff = available - take;
    remaining -= take;
    idx -= 1;
    if (remaining > 0) endOffset = 0;
  }

  const range = document.createRange();
  range.setStart(startNode, Math.max(0, startOff));
  range.setEnd(caret.node, Math.min(caret.offset, caret.node.textContent?.length ?? 0));
  return range;
}

/** Asegura un nodo de texto donde colocar el cursor (p. ej. `<p><br></p>` vacío). */
export function ensureRichEditorTextAnchor(root: HTMLElement) {
  if (collectTextNodes(root).length > 0) return;

  const block = root.querySelector("p, div, h1, h2, h3, li") ?? root;
  const br = block.querySelector("br");
  const text = document.createTextNode("");
  if (br) block.replaceChild(text, br);
  else block.appendChild(text);

  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(text, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Detecta `/comando` activo y devuelve el rango DOM exacto a reemplazar. */
export function detectSlashTriggerInEditable(
  root: HTMLElement
): { query: string; range: Range } | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const end = sel.getRangeAt(0);
  if (!root.contains(end.endContainer)) return null;

  // Solo el bloque actual: Range.toString() no pone \\n entre <p>, y el / en línea nueva
  // quedaría pegado al texto anterior sin cumplir (?:^|[\\n\\s])\\/ en todo el documento.
  const block = getCaretBlockElement(root);
  const before = getTextBeforeCaretInScope(block);
  const match = before.match(/(?:^|[\n\s])\/([^\n]*)$/);
  if (!match) return null;

  const query = match[1] ?? "";
  const hit = {
    query,
    start: before.length - query.length - 1,
    end: before.length,
  };

  const deleteRange = rangeForPlainTextOffsets(block, hit.start, hit.end);
  if (!deleteRange) {
    const slashChars = hit.end - hit.start;
    const fallback = rangeSpanningCharsBeforeCaret(block, end, slashChars);
    if (!fallback) return null;
    return { query: hit.query, range: fallback };
  }

  return { query: hit.query, range: deleteRange };
}

/** Reemplaza el rango del slash por texto plano (contentEditable). */
export function replaceRangeWithPlainText(root: HTMLElement, range: Range, text: string) {
  root.focus();
  const sel = window.getSelection();
  const r = range.cloneRange();
  sel?.removeAllRanges();
  sel?.addRange(r);
  r.deleteContents();
  const node = document.createTextNode(text);
  r.insertNode(node);
  r.setStartAfter(node);
  r.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(r);
}

/** Reemplaza el rango del slash por HTML. */
export function replaceRangeWithHtml(root: HTMLElement, range: Range, html: string) {
  root.focus();
  const sel = window.getSelection();
  const r = range.cloneRange();
  sel?.removeAllRanges();
  sel?.addRange(r);
  r.deleteContents();
  const frag = r.createContextualFragment(html);
  r.insertNode(frag);
  r.collapse(false);
  sel?.removeAllRanges();
  sel?.addRange(r);
}

export function getRichTextCaretOffset(root: HTMLElement): number {
  return getTextBeforeCaret(root).length;
}

export function getRichTextLength(root: HTMLElement): string {
  return root.innerText.replace(/\r\n/g, "\n");
}
