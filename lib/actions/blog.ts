"use server";

import { requireAdminUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { BlogCategory, BlogPostStatus } from "@prisma/client";
import { blogCategoryFromSlug, getBlogCategoryLabel } from "@/lib/blog/categories";
import { BLOG_PAGE_SIZE, estimateReadingMinutes, slugifyBlogTitle } from "@/lib/blog/utils";

const BLOG_PATH = "/blog";
const ADMIN_BLOG_PATH = "/admin/blog";

async function requireBlogAdmin() {
  return requireAdminUserId("Solo administradores pueden gestionar el blog.");
}

function revalidateBlog() {
  revalidatePath(BLOG_PATH);
  revalidatePath(ADMIN_BLOG_PATH);
  revalidatePath("/sitemap.xml");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugifyBlogTitle(base);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await db.blogPost.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!exists) return candidate;
    n += 1;
  }
}

export type BlogPostPublic = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  coverImage: string | null;
  category: BlogCategory;
  categoryLabel: string;
  publishedAt: string;
  readingMinutes: number;
  authorName: string;
};

function mapPublicPost(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  coverImage: string | null;
  category: BlogCategory;
  publishedAt: Date | null;
  author: { name: string };
}): BlogPostPublic | null {
  if (!row.publishedAt) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    coverImage: row.coverImage,
    category: row.category,
    categoryLabel: getBlogCategoryLabel(row.category),
    publishedAt: row.publishedAt.toISOString(),
    readingMinutes: estimateReadingMinutes(row.content),
    authorName: row.author.name,
  };
}

export async function getPublishedBlogPosts(options?: {
  categorySlug?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? BLOG_PAGE_SIZE;
  const category = blogCategoryFromSlug(options?.categorySlug ?? null);

  const where = {
    status: "PUBLISHED" as BlogPostStatus,
    publishedAt: { not: null },
    ...(category ? { category } : {}),
  };

  const [total, rows] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const items = rows
    .map(mapPublicPost)
    .filter((p): p is BlogPostPublic => p !== null);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const row = await db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null } },
    include: { author: { select: { name: true } } },
  });
  if (!row) return null;
  return mapPublicPost(row);
}

export async function getRelatedBlogPosts(postId: string, category: BlogCategory, limit = 3) {
  const rows = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { not: null },
      NOT: { id: postId },
      category,
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { author: { select: { name: true } } },
  });

  let items = rows.map(mapPublicPost).filter((p): p is BlogPostPublic => p !== null);

  if (items.length < limit) {
    const more = await db.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        id: { notIn: [postId, ...rows.map((r) => r.id)] },
      },
      orderBy: { publishedAt: "desc" },
      take: limit - items.length,
      include: { author: { select: { name: true } } },
    });
    items = [
      ...items,
      ...more.map(mapPublicPost).filter((p): p is BlogPostPublic => p !== null),
    ];
  }

  return items.slice(0, limit);
}

export type AdminBlogListFilters = {
  q?: string | null;
  status?: BlogPostStatus | "ALL" | null;
  category?: BlogCategory | "ALL" | null;
};

export async function getAdminBlogPosts(
  filters?: AdminBlogListFilters | string | null
) {
  await requireBlogAdmin();

  const parsed: AdminBlogListFilters =
    typeof filters === "string" || filters === null || filters === undefined
      ? { q: filters ?? null }
      : filters;

  const search = parsed.q?.trim();
  const statusFilter =
    parsed.status && parsed.status !== "ALL" ? parsed.status : undefined;
  const categoryFilter =
    parsed.category && parsed.category !== "ALL" ? parsed.category : undefined;

  const and: {
    OR?: { title?: object; slug?: object; excerpt?: object }[];
    status?: BlogPostStatus;
    category?: BlogCategory;
  }[] = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
      ],
    });
  }
  if (statusFilter) and.push({ status: statusFilter });
  if (categoryFilter) and.push({ category: categoryFilter });

  return db.blogPost.findMany({
    where: and.length > 0 ? { AND: and } : undefined,
    orderBy: [{ updatedAt: "desc" }],
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function getAdminBlogPostById(id: string) {
  await requireBlogAdmin();
  return db.blogPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

function resolveExcerpt(metaDescription: string | null | undefined, fallback: string) {
  const meta = metaDescription?.trim();
  if (meta) return meta.slice(0, 500);
  const plain = fallback.replace(/\s+/g, " ").trim();
  return plain.slice(0, 280) || "Artículo del blog CALETAS.";
}

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  coverImage?: string | null;
  category: BlogCategory;
  publish?: boolean;
}) {
  const authorId = await requireBlogAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("El título es obligatorio.");

  const slug = await uniqueSlug(data.slug?.trim() || title);
  const content = data.content.trim();
  if (!content) throw new Error("El contenido es obligatorio.");

  const metaTitle = data.metaTitle?.trim() || null;
  const metaDescription = data.metaDescription?.trim() || null;
  const excerpt =
    data.excerpt?.trim() || resolveExcerpt(metaDescription, content);

  const publish = !!data.publish;

  const post = await db.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      coverImage: data.coverImage?.trim() || null,
      category: data.category,
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? new Date() : null,
      authorId,
    },
  });

  revalidateBlog();
  if (publish) {
    const { notifyBlogSubscribersForPost } = await import("@/lib/actions/blog-subscriptions");
    void notifyBlogSubscribersForPost(post.id);
    const { notifyStudentsForNewBlogPost } = await import("@/lib/notifications");
    void notifyStudentsForNewBlogPost(post.title, post.slug);
  }
  return post;
}

export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    coverImage?: string | null;
    category?: BlogCategory;
    publish?: boolean;
    unpublish?: boolean;
  }
) {
  await requireBlogAdmin();

  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) throw new Error("Artículo no encontrado.");

  const patch: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    coverImage?: string | null;
    category?: BlogCategory;
    status?: BlogPostStatus;
    publishedAt?: Date | null;
  } = {};

  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) throw new Error("El título es obligatorio.");
    patch.title = title;
  }
  if (data.slug !== undefined) {
    patch.slug = await uniqueSlug(data.slug.trim() || patch.title || existing.title, id);
  }
  if (data.metaTitle !== undefined) patch.metaTitle = data.metaTitle?.trim() || null;
  if (data.metaDescription !== undefined) {
    patch.metaDescription = data.metaDescription?.trim() || null;
  }
  if (data.content !== undefined) patch.content = data.content.trim();
  if (data.excerpt !== undefined) {
    patch.excerpt = data.excerpt.trim();
  } else if (data.metaDescription !== undefined || data.content !== undefined) {
    patch.excerpt = resolveExcerpt(
      patch.metaDescription ?? existing.metaDescription,
      patch.content ?? existing.content
    );
  }
  if (data.coverImage !== undefined) patch.coverImage = data.coverImage?.trim() || null;
  if (data.category !== undefined) patch.category = data.category;

  if (data.publish) {
    patch.status = "PUBLISHED";
    patch.publishedAt = existing.publishedAt ?? new Date();
  }
  if (data.unpublish) {
    patch.status = "DRAFT";
    patch.publishedAt = null;
  }

  const wasPublished = existing.status === "PUBLISHED";
  const post = await db.blogPost.update({ where: { id }, data: patch });
  revalidateBlog();
  if (!wasPublished && post.status === "PUBLISHED") {
    const { notifyBlogSubscribersForPost } = await import("@/lib/actions/blog-subscriptions");
    void notifyBlogSubscribersForPost(post.id);
    const { notifyStudentsForNewBlogPost } = await import("@/lib/notifications");
    void notifyStudentsForNewBlogPost(post.title, post.slug);
  }
  return post;
}

export async function deleteBlogPost(id: string) {
  await requireBlogAdmin();
  await db.blogPost.delete({ where: { id } });
  revalidateBlog();
}
