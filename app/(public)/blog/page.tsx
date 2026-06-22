import { getPublishedBlogPosts } from "@/lib/actions/blog";
import { blogCategoryFromSlug, getBlogCategoryMeta } from "@/lib/blog/categories";
import { BlogArchiveSection } from "@/components/blog/blog-archive-section";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Blog | Caletas",
  description: "Consejos, estrategias y recursos para mejorar tu vida estudiantil.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; page?: string }>;
}) {
  const { categoria, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const activeCategory = blogCategoryFromSlug(categoria);
  const activeMeta = activeCategory ? getBlogCategoryMeta(activeCategory) : null;

  const { items, totalPages, page: currentPage, total } = await getPublishedBlogPosts({
    categorySlug: categoria,
    page,
  });

  return (
    <PublicPageShell>
      <PublicPageHero
        title={activeMeta ? activeMeta.label.toUpperCase() : "BLOG DE CALETAS"}
        description={
          activeMeta?.description ??
          "Consejos, estrategias y recursos para mejorar tu vida estudiantil."
        }
      >
        <div className="inline-flex items-center gap-2 chalk-badge">
          <BookOpen className="h-4 w-4" />
          {total} artículo{total === 1 ? "" : "s"}
        </div>
      </PublicPageHero>

      <div className="chalk-container min-w-0 pb-14 sm:pb-16 md:pb-20 chalk-public-blog">
        <BlogArchiveSection
          items={items}
          total={total}
          totalPages={totalPages}
          currentPage={currentPage}
          categoria={categoria}
        />
      </div>
    </PublicPageShell>
  );
}
