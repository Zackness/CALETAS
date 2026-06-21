import "server-only";

import { createCanvas } from "@napi-rs/canvas";

const MAX_RENDER_WIDTH = 1200;
const DEFAULT_SCALE = 1.35;

export async function renderPdfPagesToJpeg(
  buffer: Buffer,
  pageNumbers: number[],
  options?: { maxWidth?: number; jpegQuality?: number },
): Promise<{ pageNum: number; buffer: Buffer }[]> {
  if (!pageNumbers.length) return [];

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const maxWidth = options?.maxWidth ?? MAX_RENDER_WIDTH;
  const quality = options?.jpegQuality ?? 82;
  const uniquePages = [...new Set(pageNumbers)]
    .filter((n) => n >= 1 && n <= doc.numPages)
    .sort((a, b) => a - b);

  const out: { pageNum: number; buffer: Buffer }[] = [];

  for (const pageNum of uniquePages) {
    const page = await doc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(DEFAULT_SCALE, maxWidth / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    out.push({ pageNum, buffer: canvas.toBuffer("image/jpeg", quality) });
  }

  return out;
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  return doc.numPages;
}
