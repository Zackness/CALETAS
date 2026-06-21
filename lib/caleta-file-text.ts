import "server-only";

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json", "log"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const MAX_PDF_PAGES_TEXT = 40;
const MAX_PDF_PAGES_VISION = 8;
const MIN_PAGE_TEXT_FOR_OK = 50;
const MIN_TOTAL_TEXT_WITHOUT_VISION = 100;

function extensionFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    const parts = url.split(".");
    return parts.pop()?.toLowerCase() ?? "";
  }
}

function mimeFromExtension(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export async function fetchFileBuffer(fileUrl: string, maxBytes = 12 * 1024 * 1024): Promise<Buffer> {
  const res = await fetch(fileUrl, {
    headers: { Accept: "*/*" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el archivo (${res.status})`);
  }
  const len = Number(res.headers.get("content-length") || 0);
  if (len > maxBytes) {
    throw new Error("El archivo es demasiado grande para analizarlo en el chat");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) {
    throw new Error("El archivo es demasiado grande para analizarlo en el chat");
  }
  return buf;
}

type PdfPageText = { pageNum: number; text: string };

async function extractPdfPageTexts(buffer: Buffer, maxPages: number): Promise<PdfPageText[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const pages = Math.min(doc.numPages, maxPages);
  const out: PdfPageText[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ pageNum: i, text });
  }

  return out;
}

function mergePdfTextAndVision(pageTexts: PdfPageText[], visionText: string | null): string {
  const textLayer = pageTexts
    .filter((p) => p.text)
    .map((p) => `[Página ${p.pageNum}]\n${p.text}`)
    .join("\n\n");

  if (!visionText?.trim()) return textLayer;
  if (!textLayer) return visionText.trim();

  return [
    textLayer,
    "",
    "--- Contenido visual / OCR (páginas con imágenes o escaneo) ---",
    visionText.trim(),
  ].join("\n");
}

async function extractPdfContent(
  buffer: Buffer,
  options?: { userId?: string; fileLabel?: string },
): Promise<string> {
  const pageTexts = await extractPdfPageTexts(buffer, MAX_PDF_PAGES_TEXT);
  const fullText = pageTexts.map((p) => p.text).join("\n\n").trim();

  const sparsePages = pageTexts.filter((p) => p.text.length < MIN_PAGE_TEXT_FOR_OK).map((p) => p.pageNum);
  const needsFullVision =
    fullText.length < MIN_TOTAL_TEXT_WITHOUT_VISION || sparsePages.length === pageTexts.length;

  const visionPageNums = needsFullVision
    ? pageTexts.slice(0, MAX_PDF_PAGES_VISION).map((p) => p.pageNum)
    : sparsePages.slice(0, MAX_PDF_PAGES_VISION);

  if (!visionPageNums.length) {
    return fullText;
  }

  const { renderPdfPagesToJpeg } = await import("@/lib/pdf-page-render");
  const { extractAcademicContentFromImages } = await import("@/lib/ia-vision-extract");

  const rendered = await renderPdfPagesToJpeg(buffer, visionPageNums);
  if (!rendered.length) return fullText;

  const visionText = await extractAcademicContentFromImages(
    rendered.map((r) => ({
      buffer: r.buffer,
      mimeType: "image/jpeg",
      label: `Página ${r.pageNum}`,
    })),
    {
      userId: options?.userId,
      sourceLabel: options?.fileLabel
        ? `PDF «${options.fileLabel}» — páginas ${rendered.map((r) => r.pageNum).join(", ")}`
        : undefined,
    },
  );

  return mergePdfTextAndVision(pageTexts, visionText);
}

export type ExtractCaletaFileOptions = {
  userId?: string;
  fileLabel?: string;
};

export async function extractTextFromCaletaFile(
  fileUrl: string,
  options?: ExtractCaletaFileOptions,
): Promise<string | null> {
  const ext = extensionFromUrl(fileUrl);
  if (!ext) return null;

  try {
    const buffer = await fetchFileBuffer(fileUrl);

    if (TEXT_EXTENSIONS.has(ext)) {
      return buffer.toString("utf-8").replace(/\u0000/g, "").trim();
    }

    if (IMAGE_EXTENSIONS.has(ext)) {
      const { extractAcademicContentFromImages } = await import("@/lib/ia-vision-extract");
      const vision = await extractAcademicContentFromImages(
        [{ buffer, mimeType: mimeFromExtension(ext), label: options?.fileLabel ?? "Imagen" }],
        {
          userId: options?.userId,
          sourceLabel: options?.fileLabel ? `Imagen «${options.fileLabel}»` : "Imagen de caleta",
        },
      );
      return vision?.trim() || null;
    }

    if (ext === "pdf") {
      const text = await extractPdfContent(buffer, options);
      return text.trim() || null;
    }

    return null;
  } catch (e) {
    console.warn("[caleta-file-text] extract failed:", fileUrl, e);
    return null;
  }
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[… contenido truncado …]`;
}
