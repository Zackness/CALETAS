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
  return { ok: true as const };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      description?: string;
      content?: string;
      imageUrl?: string;
      isPublished?: boolean;
      categoryName?: string | null;
      titleMeta?: string;
    };

    const current = await db.blogPost.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!current) return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });

    const nextTitle = body.title?.trim() || current.title;
    const resolvedSlug = body.slug !== undefined ? toSlug(body.slug || nextTitle) : undefined;
    if (resolvedSlug !== undefined) {
      const conflict = await db.blogPost.findFirst({
        where: { slug: resolvedSlug, NOT: { id } },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 400 });
      }
    }

    let categoryId: string | null | undefined = undefined;
    if (body.categoryName !== undefined) {
      const categoryName = body.categoryName?.trim();
      if (!categoryName) {
        categoryId = null;
      } else {
        const category = await db.blogCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
          select: { id: true },
        });
        categoryId = category.id;
      }
    }

    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(resolvedSlug !== undefined && { slug: resolvedSlug || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.content !== undefined && { content: body.content?.trim() || null }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
        ...(body.titleMeta !== undefined && { titleMeta: body.titleMeta?.trim() || null }),
        ...(body.isPublished !== undefined && { isPublished: Boolean(body.isPublished) }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const existing = await db.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });

    await db.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
