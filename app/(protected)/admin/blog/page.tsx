import { Link } from "@/components/link";
import { getAdminBlogPosts } from "@/lib/actions/blog";
import { BlogPostsList } from "./_components/blog-posts-list";
import { ADMIN_PATH } from "@/routes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { BlogCategory, BlogPostStatus } from "@prisma/client";
import { BLOG_CATEGORY_IDS } from "@/lib/blog/categories";

export const metadata = { title: "Blog | Admin" };

const VALID_STATUS = new Set(["ALL", "DRAFT", "PUBLISHED"]);
const VALID_CATEGORIES = new Set(["ALL", ...BLOG_CATEGORY_IDS]);

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = VALID_STATUS.has(params.status ?? "") ? params.status! : "ALL";
  const category = VALID_CATEGORIES.has(params.category ?? "") ? params.category! : "ALL";

  const posts = await getAdminBlogPosts({
    q: q || null,
    status: status as BlogPostStatus | "ALL",
    category: category as BlogCategory | "ALL",
  });

  const items = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    category: p.category,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    updatedAt: p.updatedAt.toISOString(),
    authorName: p.author.name,
  }));

  return (
    <div className="admin-blog-surface space-y-12 sm:space-y-14 text-white">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Contenido
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Blog
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
            Crea, edita y publica artículos por pilar de marca. Los publicados aparecen en /blog.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-xl">
          <Link href={`${ADMIN_PATH}/blog/nuevo`}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo artículo
          </Link>
        </Button>
      </section>

      <section>
        <BlogPostsList
          posts={items}
          initialQ={q}
          initialStatus={status}
          initialCategory={category}
        />
      </section>
    </div>
  );
}
