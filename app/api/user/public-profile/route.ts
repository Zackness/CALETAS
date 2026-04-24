import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const MAX_URL_LEN = 2048;
const MAX_BIO = 500;

function normalizeUsername(raw: unknown) {
  if (typeof raw !== "string") return null;
  const u = raw.trim();
  if (!u) return null;
  return u.toLowerCase();
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const body = (await request.json()) as {
      username?: string;
      image?: string | null;
      profileBio?: string | null;
    };

    const data: { username?: string; image?: string | null; profileBio?: string | null } = {};

    if ("username" in body) {
      const u = normalizeUsername(body.username);
      if (!u || !USERNAME_RE.test(u)) {
        return withCors(
          NextResponse.json({
            error: "Username inválido. Usa 3-24 caracteres: letras, números o _",
          }, { status: 400 }),
          request,
        );
      }
      data.username = u;
    }

    if ("image" in body) {
      const img = body.image;
      if (img == null || img === "") {
        data.image = null;
      } else if (typeof img === "string") {
        const t = img.trim();
        if (t.length > MAX_URL_LEN) {
          return withCors(NextResponse.json({ error: "URL de foto demasiado larga" }, { status: 400 }), request);
        }
        if (!/^https?:\/\//i.test(t)) {
          return withCors(NextResponse.json({ error: "La foto debe ser una URL http(s)" }, { status: 400 }), request);
        }
        data.image = t;
      } else {
        return withCors(NextResponse.json({ error: "Foto inválida" }, { status: 400 }), request);
      }
    }

    if ("profileBio" in body) {
      const b = body.profileBio;
      if (b == null || b === "") data.profileBio = null;
      else if (typeof b === "string") data.profileBio = b.trim().slice(0, MAX_BIO) || null;
      else return withCors(NextResponse.json({ error: "Bio inválida" }, { status: 400 }), request);
    }

    if (Object.keys(data).length === 0) {
      return withCors(NextResponse.json({ error: "Nada que actualizar" }, { status: 400 }), request);
    }

    // Si username está en uso, Prisma lanzará error por unique. Lo convertimos a mensaje amable.
    try {
      const updated = await db.user.update({
        where: { id: session.user.id },
        data,
        select: { id: true, username: true, image: true, profileBio: true },
      });
      return withCors(NextResponse.json({ ok: true, user: updated }), request);
    } catch (e: any) {
      if (typeof e?.code === "string" && e.code === "P2002") {
        return withCors(NextResponse.json({ error: "Ese username ya está ocupado" }, { status: 409 }), request);
      }
      throw e;
    }
  } catch (e) {
    console.error("[user/public-profile PATCH]", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}

