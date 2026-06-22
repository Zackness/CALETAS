"use server";

import { bunnyUploadBytes } from "@/lib/bunny";
import { requireAdminUserId } from "@/lib/auth";
import { registerMediaAsset } from "@/lib/actions/media-library";

async function requireStaffForUpload() {
  return requireAdminUserId("Solo administradores o editores pueden subir archivos.");
}

async function uploadImage(formData: FormData, folder: string) {
  const userId = await requireStaffForUpload();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No se recibió ningún archivo.");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");

  const maxMb = 8;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`La imagen no puede superar ${maxMb} MB.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  const result = await bunnyUploadBytes({
    filename: file.name,
    bytes: buffer,
    contentType: file.type,
    folder,
  });

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "") || "uploads";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";

  await registerMediaAsset({
    path: result.path,
    url: result.url,
    folder: cleanFolder,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedById: userId,
    altText: baseName,
    title: baseName,
  });

  return result.url;
}

export async function uploadHeaderImage(formData: FormData) {
  return uploadImage(formData, "almuerzos");
}

/** Imágenes de portada o cuerpo de artículos del blog. */
export async function uploadBlogImage(formData: FormData) {
  return uploadImage(formData, "blog");
}
