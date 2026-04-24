import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToBunny } from "@/lib/bunny";
import { HistoriaMediaType } from "@prisma/client";
import {
  historiaExpiresAt,
  MAX_HISTORIAS_ACTIVAS_POR_USUARIO,
  purgeExpiredHistorias,
} from "@/lib/historias-cleanup";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 28 * 1024 * 1024;

function mediaTypeFromMime(mime: string): HistoriaMediaType | null {
  if (IMAGE_TYPES.has(mime)) return HistoriaMediaType.IMAGE;
  if (VIDEO_TYPES.has(mime)) return HistoriaMediaType.VIDEO;
  return null;
}

/** GET: historias activas de quien sigues + las tuyas (agrupadas por autor). */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await purgeExpiredHistorias(120);

    const followingRows = await db.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const allowedAutorIds = [
      session.user.id,
      ...followingRows.map((f) => f.followingId),
    ];

    const now = new Date();
    const rows = await db.historia.findMany({
      where: {
        expiresAt: { gt: now },
        autorId: { in: allowedAutorIds },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        mediaUrl: true,
        mediaType: true,
        expiresAt: true,
        createdAt: true,
        autor: { select: { id: true, username: true, name: true, image: true } },
      },
    });

    const byAutor = new Map<
      string,
      {
        autor: { id: string; username: string | null; name: string; image: string | null };
        items: Array<{
          id: string;
          mediaUrl: string;
          mediaType: HistoriaMediaType;
          expiresAt: string;
          createdAt: string;
        }>;
      }
    >();

    for (const r of rows) {
      const aid = r.autor.id;
      if (!byAutor.has(aid)) {
        byAutor.set(aid, { autor: r.autor, items: [] });
      }
      byAutor.get(aid)!.items.push({
        id: r.id,
        mediaUrl: r.mediaUrl,
        mediaType: r.mediaType,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      });
    }

    for (const b of byAutor.values()) {
      b.items.sort((a, c) => new Date(a.createdAt).getTime() - new Date(c.createdAt).getTime());
    }

    const viewerId = session.user.id;
    const buckets = Array.from(byAutor.values()).sort((a, b) => {
      const ownA = a.autor.id === viewerId;
      const ownB = b.autor.id === viewerId;
      if (ownA !== ownB) return ownA ? -1 : 1;
      const ta = Math.max(...a.items.map((i) => new Date(i.createdAt).getTime()), 0);
      const tb = Math.max(...b.items.map((i) => new Date(i.createdAt).getTime()), 0);
      return tb - ta;
    });

    const viewerRow = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    });

    return NextResponse.json({
      buckets,
      viewerId,
      viewer: {
        id: viewerId,
        name: viewerRow?.name ?? "",
        image: viewerRow?.image ?? null,
      },
    });
  } catch (e) {
    console.error("[historias GET]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/** POST: sube imagen o video a Bunny y crea la historia (24 h). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await purgeExpiredHistorias(80);

    const activeCount = await db.historia.count({
      where: { autorId: session.user.id, expiresAt: { gt: new Date() } },
    });
    if (activeCount >= MAX_HISTORIAS_ACTIVAS_POR_USUARIO) {
      return NextResponse.json(
        {
          error: `Has alcanzado el máximo de ${MAX_HISTORIAS_ACTIVAS_POR_USUARIO} historias activas. Espera a que caduquen o borra alguna.`,
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    const mediaType = mediaTypeFromMime(mime);
    if (!mediaType) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa imagen (JPEG, PNG, WebP, GIF) o video (MP4, WebM)." },
        { status: 400 },
      );
    }

    const max = mediaType === HistoriaMediaType.VIDEO ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > max) {
      return NextResponse.json(
        { error: mediaType === HistoriaMediaType.VIDEO ? "Video demasiado grande (máx. 28 MB)" : "Imagen demasiado grande (máx. 12 MB)" },
        { status: 400 },
      );
    }

    const mediaUrl = await uploadToBunny(file, {
      prefix: "historia",
      subfolder: session.user.id,
    });

    const expiresAt = historiaExpiresAt();

    const historia = await db.historia.create({
      data: {
        autorId: session.user.id,
        mediaUrl,
        mediaType,
        expiresAt,
      },
      select: {
        id: true,
        mediaUrl: true,
        mediaType: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      historia: {
        ...historia,
        expiresAt: historia.expiresAt.toISOString(),
        createdAt: historia.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[historias POST]", e);
    const msg = e instanceof Error ? e.message : "Error interno";
    if (msg.includes("Bunny")) {
      return NextResponse.json({ error: "No se pudo subir el archivo al almacenamiento" }, { status: 502 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
