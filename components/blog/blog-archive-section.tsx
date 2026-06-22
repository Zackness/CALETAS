import { Link } from "@/components/link";
import { BLOG_CATEGORIES, blogCategoryFromSlug, getBlogCategoryMeta } from "@/lib/blog/categories";
import { BlogCard } from "@/components/blog/blog-card";
import type { BlogPostPublic } from "@/lib/actions/blog";
import { stvn } from "@/lib/public-ui";

export function BlogArchiveSection({
  items,
  total,
  totalPages,
  currentPage,
  categoria,
  basePath = "/blog",
  postHrefPrefix,
}: {
  items: BlogPostPublic[];
  total: number;
  totalPages: number;
  currentPage: number;
  categoria?: string;
  basePath?: string;
  /** Prefijo de enlaces a artículo (ej. /escritorio/blog). */
  postHrefPrefix?: string;
}) {
  const articlePrefix = postHrefPrefix ?? basePath;
  const activeCategory = blogCategoryFromSlug(categoria);
  const activeMeta = activeCategory ? getBlogCategoryMeta(activeCategory) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={basePath}
          className={!activeCategory ? "chalk-badge text-sm font-medium" : "rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/65 transition-colors hover:border-white/25 hover:text-white"}
        >
          Todos
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={activeCategory === c.id ? basePath : `${basePath}?categoria=${c.slug}`}
            className={
              activeCategory === c.id
                ? "chalk-badge text-sm font-medium"
                : "rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/65 transition-colors hover:border-white/25 hover:text-white"
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

      {activeMeta ? (
        <p className="mt-6 text-sm text-white/65">{activeMeta.description}</p>
      ) : null}

      <p className="mt-4 text-sm text-white/55">
        {total} artículo{total === 1 ? "" : "s"}
        {activeMeta ? ` en ${activeMeta.label}` : ""}
      </p>

      {items.length === 0 ? (
        <p className={`${stvn.card} mt-8 p-8 text-center text-white/65`}>
          Aún no hay artículos publicados en esta categoría.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <BlogCard key={post.id} post={post} hrefPrefix={articlePrefix} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación">
          {currentPage > 1 && (
            <Link
              href={`${basePath}?${new URLSearchParams({
                ...(categoria ? { categoria } : {}),
                page: String(currentPage - 1),
              }).toString()}`}
              className="chalk-hero-btn chalk-hero-btn-secondary px-4 py-2 text-sm"
            >
              ← Anterior
            </Link>
          )}
          <span className="px-3 text-sm text-white/55">
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`${basePath}?${new URLSearchParams({
                ...(categoria ? { categoria } : {}),
                page: String(currentPage + 1),
              }).toString()}`}
              className="chalk-hero-btn chalk-hero-btn-secondary px-4 py-2 text-sm"
            >
              Siguiente →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
