import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

const MAX_BIO = 500;
const MAX_URL_LEN = 2048;
const MAX_GALLERY = 12;

function normalizeGalleryInput(raw: unknown): string[] | null {
  if (raw === undefined) return null;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    if (t.length > MAX_URL_LEN) continue;
    if (!/^https?:\/\//i.test(t)) continue;
    out.push(t);
    if (out.length >= MAX_GALLERY) break;
  }
  return out;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const body = (await request.json()) as {
      profileBio?: string | null;
      profileBannerUrl?: string | null;
      profileGalleryUrls?: unknown;
    };

    const data: {
      profileBio?: string | null;
      profileBannerUrl?: string | null;
      profileGalleryUrls?: object;
    } = {};

    if ("profileBio" in body) {
      const b = body.profileBio;
      if (b == null || b === "") data.profileBio = null;
      else if (typeof b === "string") {
        const t = b.trim();
        data.profileBio = t.slice(0, MAX_BIO) || null;
      } else {
        return withCors(NextResponse.json({ error: "Bio inválida" }, { status: 400 }), request);
      }
    }

    if ("profileBannerUrl" in body) {
      const u = body.profileBannerUrl;
      if (u == null || u === "") data.profileBannerUrl = null;
      else if (typeof u === "string") {
        const t = u.trim();
        if (t.length > MAX_URL_LEN) {
          return withCors(NextResponse.json({ error: "URL de banner demasiado larga" }, { status: 400 }), request);
        }
        if (!/^https?:\/\//i.test(t)) {
          return withCors(NextResponse.json({ error: "El banner debe ser una URL http(s)" }, { status: 400 }), request);
        }
        data.profileBannerUrl = t;
      } else {
        return withCors(NextResponse.json({ error: "Banner inválido" }, { status: 400 }), request);
      }
    }

    if ("profileGalleryUrls" in body) {
      const g = normalizeGalleryInput(body.profileGalleryUrls);
      if (g === null) {
        // omit
      } else {
        data.profileGalleryUrls = g;
      }
    }

    if (Object.keys(data).length === 0) {
      return withCors(NextResponse.json({ error: "Nada que actualizar" }, { status: 400 }), request);
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data,
      select: {
        profileBio: true,
        profileBannerUrl: true,
        profileGalleryUrls: true,
      },
    });

    return withCors(
      NextResponse.json({
        profileBio: updated.profileBio,
        profileBannerUrl: updated.profileBannerUrl,
        profileGalleryUrls: parseProfileGalleryUrls(updated.profileGalleryUrls),
      }),
      request,
    );
  } catch (e) {
    console.error("[user/social-profile PATCH]", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}
