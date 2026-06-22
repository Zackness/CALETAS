"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import { BLOG_CATEGORIES, getBlogCategoryLabel } from "@/lib/blog/categories";
import { slugifyBlogTitle } from "@/lib/blog/utils";
import { updateBlogPost, deleteBlogPost } from "@/lib/actions/blog";
import type { BlogCategory, BlogPostStatus } from "@prisma/client";
import { ADMIN_PATH } from "@/routes";
import { Pencil, Zap, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AdminBlogListItem = {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  category: BlogCategory;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  authorName: string;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
};

const inputClass =
  "h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/35";

function BlogQuickEditRow({
  post,
  onClose,
  onSaved,
}: {
  post: AdminBlogListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState<BlogPostStatus>(post.status);
  const [category, setCategory] = useState<BlogCategory>(post.category);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post.metaDescription ?? "");

  function save() {
    startTransition(async () => {
      try {
        await updateBlogPost(post.id, {
          title,
          slug: slugifyBlogTitle(slug || title),
          category,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          publish: status === "PUBLISHED" && post.status !== "PUBLISHED",
          unpublish: status === "DRAFT" && post.status === "PUBLISHED",
        });
        toast.success("Artículo actualizado");
        onSaved();
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[#40C9A9]/25 bg-[#40C9A9]/5 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--foreground)]">Edición rápida</p>
        {post.status === "PUBLISHED" ? (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-[#40C9A9] hover:underline"
          >
            Ver en el blog <ExternalLink className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
            className={inputClass}
          >
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Slug</label>
          <div className="flex items-center gap-1">
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">/blog/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(slugifyBlogTitle(e.target.value))}
              className={cn(inputClass, "min-w-0 flex-1")}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Pilar</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BlogCategory)}
            className={inputClass}
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Meta título</label>
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Meta descripción
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className={cn(inputClass, "min-h-[72px] resize-y py-2")}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "Guardando…" : "Actualizar"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href={`${ADMIN_PATH}/blog/${post.id}/editar`}>Abrir editor completo</Link>
        </Button>
      </div>
    </div>
  );
}

export function BlogPostsList({
  posts,
  initialQ,
  initialStatus,
  initialCategory,
}: {
  posts: AdminBlogListItem[];
  initialQ: string;
  initialStatus: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function onDelete(post: AdminBlogListItem) {
    const msg =
      post.status === "PUBLISHED"
        ? `¿Eliminar "${post.title}"? Dejará de mostrarse en /blog. Esta acción no se puede deshacer.`
        : `¿Eliminar el borrador "${post.title}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(msg)) return;

    startDeleteTransition(async () => {
      try {
        await deleteBlogPost(post.id);
        if (quickEditId === post.id) setQuickEditId(null);
        toast.success("Artículo eliminado");
        refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <>
      <form method="GET" className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={initialQ}
            placeholder="Buscar título, slug o extracto…"
            className={cn(inputClass, "sm:flex-1")}
          />
          <select name="status" defaultValue={initialStatus} className={cn(inputClass, "sm:w-40")}>
            <option value="ALL">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
          <select name="category" defaultValue={initialCategory} className={cn(inputClass, "sm:w-52")}>
            <option value="ALL">Todos los pilares</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" size="sm">
            Filtrar
          </Button>
          {(initialQ || initialStatus !== "ALL" || initialCategory !== "ALL") && (
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={`${ADMIN_PATH}/blog`}>Limpiar filtros</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Pilar</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {posts.map((p) => (
                <Fragment key={p.id}>
                  <tr className={cn("hover:bg-[var(--muted)]/20", quickEditId === p.id && "bg-[var(--muted)]/15")}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{p.title}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {getBlogCategoryLabel(p.category)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === "PUBLISHED"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[var(--muted-foreground)]"
                        }
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {new Date(p.updatedAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button asChild variant="ghost" size="sm" title="Editar">
                          <Link href={`${ADMIN_PATH}/blog/${p.id}/editar`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Edición rápida"
                          className={quickEditId === p.id ? "bg-[#40C9A9]/15 text-[#40C9A9]" : ""}
                          onClick={() => setQuickEditId((id) => (id === p.id ? null : p.id))}
                        >
                          <Zap className="h-4 w-4" />
                          <span className="sr-only">Edición rápida</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Eliminar"
                          disabled={deletePending}
                          className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                          onClick={() => onDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {quickEditId === p.id ? (
                    <tr className="bg-[var(--muted)]/10">
                      <td colSpan={5} className="px-4 py-4">
                        <BlogQuickEditRow
                          post={p}
                          onClose={() => setQuickEditId(null)}
                          onSaved={refresh}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <p className="px-4 py-12 text-center text-[var(--muted-foreground)]">
            No hay artículos con estos filtros.
          </p>
        )}
      </div>
    </>
  );
}
