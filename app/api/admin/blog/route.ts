import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const, userId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
      take: 300,
    });

    const categories = await db.blogCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({ posts, categories });
  } catch (error) {
    console.error("Error listing admin blog posts:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      description?: string;
      content?: string;
      imageUrl?: string;
      isPublished?: boolean;
      categoryName?: string;
      titleMeta?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
    }

    const resolvedSlug = toSlug(body.slug?.trim() || body.title);
    if (!resolvedSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const existing = await db.blogPost.findUnique({ where: { slug: resolvedSlug }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un artículo con ese slug" }, { status: 400 });
    }

    let categoryId: string | null = null;
    const categoryName = body.categoryName?.trim();
    if (categoryName) {
      const category = await db.blogCategory.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
        select: { id: true },
      });
      categoryId = category.id;
    }

    const post = await db.blogPost.create({
      data: {
        title: body.title.trim(),
        slug: resolvedSlug,
        description: body.description?.trim() || null,
        content: body.content?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        titleMeta: body.titleMeta?.trim() || null,
        isPublished: Boolean(body.isPublished),
        authorId: admin.userId,
        categoryId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
