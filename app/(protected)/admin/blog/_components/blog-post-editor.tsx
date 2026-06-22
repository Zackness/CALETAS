"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogContentFormatToolbar, type BlogWritingMode } from "@/components/blog/blog-content-format-toolbar";
import { BlogPostBodyEditor } from "@/components/blog/blog-post-body-editor";
import type { SlashInsertContext } from "@/components/blog/blog-editor-slash";
import type { BlogPostBodyEditorApi } from "@/components/blog/blog-editor-api";
import { BlogFeaturedImagePanel } from "./blog-featured-image-panel";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { slugifyBlogTitle } from "@/lib/blog/utils";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog";
import type { MediaAssetDto } from "@/lib/actions/media-library";
import type { BlogCategory } from "@prisma/client";
import { MediaGalleryDialog } from "@/components/media/media-gallery-dialog";
import { BlogAiAssistantPanel } from "./blog-ai-assistant-panel";
import type { BlogAiArticleResult, BlogAiSeoResult } from "@/lib/actions/blog-ai";
import { ADMIN_PATH, BLOG_PATH } from "@/routes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type BlogEditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: BlogCategory;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

function SidebarField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

const inputSidebar =
  "h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/35";

export function BlogPostEditor({
  mode,
  post,
}: {
  mode: "create" | "edit";
  post?: BlogEditorPost;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Tras el primer guardado en /nuevo, reutilizamos el mismo registro (no crear otro). */
  const [articleId, setArticleId] = useState<string | undefined>(post?.id);
  const [postStatus, setPostStatus] = useState(post?.status ?? "NEW");

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post?.slug);
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [category, setCategory] = useState<BlogCategory>(
    post?.category ?? "CONSEJOS_ESTUDIO"
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");

  const [writingMode, setWritingMode] = useState<BlogWritingMode>("rich");
  const [editorSyncKey, setEditorSyncKey] = useState(() => post?.id ?? "new");
  const bodyEditorRef = useRef<BlogPostBodyEditorApi>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"cover" | "content">("content");
  const slashImageCtxRef = useRef<SlashInsertContext | null>(null);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugifyBlogTitle(v));
    if (!metaTitle.trim()) setMetaTitle(v);
  }

  function onWritingModeChange(next: BlogWritingMode) {
    if (next === writingMode) return;
    setWritingMode(next);
    setEditorSyncKey((k) => `${k}-${next}`);
  }

  function openGallery(target: "cover" | "content") {
    setGalleryTarget(target);
    setGalleryOpen(true);
  }

  function applyAiArticle(data: BlogAiArticleResult) {
    setTitle(data.title);
    setContent(data.content);
    setMetaTitle(data.metaTitle);
    setMetaDescription(data.metaDescription);
    if (!slugTouched) setSlug(data.slug);
    setCategory(data.category);
    setEditorSyncKey((k) => `${k}-ai-${Date.now()}`);
  }

  function applyAiSeo(data: BlogAiSeoResult) {
    setMetaTitle(data.metaTitle);
    setMetaDescription(data.metaDescription);
    if (!slugTouched) setSlug(data.slug);
  }

  function onGallerySelect(asset: MediaAssetDto) {
    const alt = asset.altText || asset.title || asset.filename.replace(/\.[^.]+$/, "") || "imagen";

    if (slashImageCtxRef.current) {
      const md = `\n\n![${alt}](${asset.url})\n\n`;
      slashImageCtxRef.current.insertMarkdown(md);
      slashImageCtxRef.current = null;
      setGalleryOpen(false);
      return;
    }

    if (galleryTarget === "cover") {
      setCoverImage(asset.url);
      return;
    }
    if (writingMode === "markdown") {
      bodyEditorRef.current?.insertImageMarkdown(asset.url, alt);
    } else {
      bodyEditorRef.current?.insertImageRich(asset.url, alt);
    }
  }

  function onSlashRequestImage(ctx: SlashInsertContext) {
    slashImageCtxRef.current = ctx;
    setGalleryTarget("content");
    setGalleryOpen(true);
  }

  function save(opts: { publish?: boolean }) {
    setError(null);
    const payload = {
      title,
      slug,
      content,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      coverImage: coverImage || null,
      category,
    };

    const existingId = articleId ?? post?.id;

    startTransition(async () => {
      try {
        if (existingId) {
          const updated = await updateBlogPost(existingId, {
            ...payload,
            publish: opts.publish === true && postStatus !== "PUBLISHED",
          });
          setArticleId(updated.id);
          setPostStatus(updated.status);
          router.refresh();
          if (opts.publish) {
            toast.success("Artículo publicado correctamente");
          } else if (updated.status === "PUBLISHED") {
            toast.success("Cambios guardados correctamente");
          } else {
            toast.success("Borrador guardado correctamente");
          }
        } else {
          const created = await createBlogPost({
            ...payload,
            publish: !!opts.publish,
          });
          setArticleId(created.id);
          setPostStatus(created.status);
          router.replace(`${ADMIN_PATH}/blog/${created.id}/editar`);
          router.refresh();
          toast.success(
            opts.publish ? "Artículo publicado correctamente" : "Borrador guardado correctamente"
          );
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error al guardar";
        setError(message);
        toast.error(message);
      }
    });
  }

  const statusLabel =
    postStatus === "PUBLISHED" ? "Publicado" : postStatus === "DRAFT" ? "Borrador" : "Nuevo";

  return (
    <>
    <MediaGalleryDialog
      open={galleryOpen}
      onOpenChange={setGalleryOpen}
      onSelect={onGallerySelect}
      title={galleryTarget === "cover" ? "Imagen destacada" : "Insertar imagen en el artículo"}
    />
    <div className="admin-blog-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)]/40 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`${ADMIN_PATH}/blog`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Artículos
          </Link>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              postStatus === "PUBLISHED"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            )}
          >
            {statusLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {postStatus === "PUBLISHED" && slug ? (
            <Link
              href={`${BLOG_PATH}/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-[#40C9A9] hover:underline"
            >
              Ver <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => save({})}>
            {pending ? "Guardando…" : "Guardar borrador"}
          </Button>
          {postStatus !== "PUBLISHED" ? (
            <Button type="button" size="sm" disabled={pending} onClick={() => save({ publish: true })}>
              {pending ? "Guardando…" : "Publicar"}
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={pending} onClick={() => save({})}>
              Guardar
            </Button>
          )}
          {postStatus === "PUBLISHED" && articleId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                const id = articleId;
                startTransition(async () => {
                  try {
                    const updated = await updateBlogPost(id, { unpublish: true });
                    setPostStatus(updated.status);
                    router.refresh();
                    toast.success("Artículo despublicado; sigue como borrador");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Error al despublicar");
                  }
                });
              }}
            >
              Despublicar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
          <BlogContentFormatToolbar
            className="z-20 border-b border-[var(--border)] bg-[var(--background)]"
            mode={writingMode}
            onModeChange={onWritingModeChange}
            onFormat={(a) => bodyEditorRef.current?.runFormat(a)}
            onInsertImage={() => openGallery("content")}
          />
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Título del artículo"
                className="w-full border-0 bg-transparent text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/50 sm:text-4xl"
              />
              <div className="mt-8 border-t border-[var(--border)] pt-8">
                <BlogPostBodyEditor
                  ref={bodyEditorRef}
                  mode={writingMode}
                  value={content}
                  onChange={setContent}
                  syncKey={editorSyncKey}
                  articleTitle={title}
                  category={category}
                  onRequestImage={onSlashRequestImage}
                  onAfterSlashInsert={() =>
                    setEditorSyncKey((k) => `${k}-slash-${Date.now()}`)
                  }
                />
              </div>
              {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </main>

        <aside className="min-h-0 w-[300px] shrink-0 overflow-y-auto overscroll-contain border-l border-[var(--border)] bg-[var(--card)]/30 p-5 sm:w-[320px]">
          <div className="space-y-8">
            <BlogAiAssistantPanel
              category={category}
              currentTitle={title}
              currentContent={content}
              onApplyArticle={applyAiArticle}
              onApplySeo={applyAiSeo}
            />

            <SidebarField label="Slug" hint="URL pública del artículo">
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <span className="shrink-0">/blog/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugifyBlogTitle(e.target.value));
                  }}
                  className={cn(inputSidebar, "min-w-0 flex-1")}
                />
              </div>
            </SidebarField>

            <BlogFeaturedImagePanel
              coverImage={coverImage}
              onOpenGallery={() => openGallery("cover")}
              onClear={() => setCoverImage("")}
            />

            <SidebarField label="Categoría" hint="Pilar de contenido">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogCategory)}
                className={inputSidebar}
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </SidebarField>

            <SidebarField label="Meta título" hint="SEO · título en Google">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || "Igual que el título"}
                className={inputSidebar}
              />
              <p className="text-right text-[10px] text-[var(--muted-foreground)]">
                {(metaTitle || title).length}/60
              </p>
            </SidebarField>

            <SidebarField label="Meta descripción" hint="SEO · resumen en buscadores y listados">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                placeholder="Breve descripción del artículo…"
                className={cn(inputSidebar, "min-h-[88px] resize-y py-2")}
              />
              <p className="text-right text-[10px] text-[var(--muted-foreground)]">
                {metaDescription.length}/160
              </p>
            </SidebarField>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
