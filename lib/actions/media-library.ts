"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bunnyDeleteByPath,
  bunnyListAllImages,
  bunnyUploadBytes,
} from "@/lib/bunny";
import { ADMIN_PATH } from "@/routes";

export type MediaAssetDto = {
  id: string;
  path: string;
  url: string;
  folder: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  title: string | null;
  altText: string | null;
  description: string | null;
  createdAt: string;
  usageCount: number;
};

async function requireStaffForMedia() {
  return requireAdminUserId("Solo administradores o editores pueden gestionar la galería.");
}

function serializeAsset(
  row: {
    id: string;
    path: string;
    url: string;
    folder: string;
    filename: string;
    mimeType: string | null;
    sizeBytes: number | null;
    title: string | null;
    altText: string | null;
    description: string | null;
    createdAt: Date;
  },
  usageCount: number
): MediaAssetDto {
  return {
    id: row.id,
    path: row.path,
    url: row.url,
    folder: row.folder,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    title: row.title,
    altText: row.altText,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    usageCount,
  };
}

async function countUrlUsage(url: string): Promise<number> {
  const posts = await db.blogPost.findMany({
    where: {
      OR: [{ coverImage: url }, { content: { contains: url } }],
    },
    select: { id: true },
  });
  return posts.length;
}

export async function registerMediaAsset(data: {
  path: string;
  url: string;
  folder: string;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedById?: string | null;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
}) {
  return db.mediaAsset.upsert({
    where: { path: data.path },
    create: {
      path: data.path,
      url: data.url,
      folder: data.folder,
      filename: data.filename,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      uploadedById: data.uploadedById ?? null,
      title: data.title ?? null,
      altText: data.altText ?? null,
      description: data.description ?? null,
    },
    update: {
      url: data.url,
      folder: data.folder,
      filename: data.filename,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes ?? null,
    },
  });
}

/** Importa imágenes existentes en Bunny que aún no están en la base de datos. */
export async function syncMediaFromBunny(): Promise<{ imported: number }> {
  await requireStaffForMedia();
  const remote = await bunnyListAllImages();
  let imported = 0;

  for (const file of remote) {
    const existing = await db.mediaAsset.findUnique({ where: { path: file.path } });
    if (existing) continue;
    await db.mediaAsset.create({
      data: {
        path: file.path,
        url: file.url,
        folder: file.folder,
        filename: file.filename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
    });
    imported += 1;
  }

  return { imported };
}

export async function listMediaAssets(opts?: { sync?: boolean }): Promise<MediaAssetDto[]> {
  await requireStaffForMedia();
  if (opts?.sync !== false) {
    await syncMediaFromBunny();
  }

  const rows = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  const posts = await db.blogPost.findMany({
    select: { coverImage: true, content: true },
  });
  const usageByUrl = new Map<string, number>();
  for (const row of rows) {
    let n = 0;
    for (const p of posts) {
      if (p.coverImage === row.url || p.content.includes(row.url)) n += 1;
    }
    usageByUrl.set(row.url, n);
  }

  return rows.map((row) => serializeAsset(row, usageByUrl.get(row.url) ?? 0));
}

export async function uploadMediaAsset(formData: FormData, folder = "media") {
  const userId = await requireStaffForMedia();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No se recibió ningún archivo.");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");

  const maxMb = 8;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`La imagen no puede superar ${maxMb} MB.`);
  }

  const bytes = await file.arrayBuffer();
  const result = await bunnyUploadBytes({
    filename: file.name,
    bytes: new Uint8Array(bytes),
    contentType: file.type,
    folder,
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  const asset = await registerMediaAsset({
    path: result.path,
    url: result.url,
    folder: folder.replace(/^\/+|\/+$/g, "") || "media",
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedById: userId,
    altText: baseName,
    title: baseName,
  });

  revalidatePath(`${ADMIN_PATH}/blog`);

  return serializeAsset(asset, 0);
}

export async function updateMediaAssetMeta(
  id: string,
  data: {
    title?: string | null;
    altText?: string | null;
    description?: string | null;
  }
) {
  await requireStaffForMedia();
  const row = await db.mediaAsset.update({
    where: { id },
    data: {
      title: data.title ?? null,
      altText: data.altText ?? null,
      description: data.description ?? null,
    },
  });
  return serializeAsset(row, await countUrlUsage(row.url));
}

export async function deleteMediaAsset(id: string, opts?: { force?: boolean }) {
  await requireStaffForMedia();
  const row = await db.mediaAsset.findUnique({ where: { id } });
  if (!row) throw new Error("Imagen no encontrada.");

  const usage = await countUrlUsage(row.url);
  if (usage > 0 && !opts?.force) {
    throw new Error(
      `La imagen se usa en ${usage} artículo(s) del blog. Quítala del contenido antes de eliminarla, o confirma la eliminación forzada.`
    );
  }

  await bunnyDeleteByPath(row.path);
  await db.mediaAsset.delete({ where: { id } });

  revalidatePath(`${ADMIN_PATH}/blog`);
  return { deleted: true, usage };
}
