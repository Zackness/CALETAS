"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type BlogPostItem = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  titleMeta: string | null;
};

type BlogPostEditorProps = {
  mode: "create" | "edit";
  postId?: string;
};

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

export function BlogPostEditor({ mode, postId }: BlogPostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [titleMeta, setTitleMeta] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !postId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/admin/blog", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el artículo");
        const post = (Array.isArray(data.posts) ? data.posts : []).find((p: BlogPostItem) => p.id === postId);
        if (!post) throw new Error("Artículo no encontrado");
        if (!active) return;
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setSlugTouched(Boolean(post.slug));
        setDescription(post.description || "");
        setTitleMeta(post.titleMeta || "");
        setImageUrl(post.imageUrl || "");
        setContent(post.content || "");
        setIsPublished(Boolean(post.isPublished));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error cargando artículo");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, postId]);

  const currentSlug = useMemo(() => {
    if (slugTouched) return toSlug(slug);
    return toSlug(title);
  }, [slug, slugTouched, title]);

  const publicLink = currentSlug ? `/blog/${currentSlug}` : null;

  async function save(publishOverride?: boolean) {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: (slugTouched ? slug : title).trim(),
        description: description.trim(),
        content,
        imageUrl: imageUrl.trim(),
        titleMeta: titleMeta.trim(),
        isPublished: publishOverride ?? isPublished,
      };

      const isEdit = mode === "edit" && postId;
      const res = await fetch(isEdit ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar");

      toast.success(payload.isPublished ? "Artículo guardado y publicado" : "Borrador guardado");
      if (!isEdit && data?.post?.id) {
        router.replace(`/admin/blog/${data.post.id}/editar`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error guardando artículo");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-white/80">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-white/75 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Artículos
            </Link>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/80">
              {isPublished ? "Publicado" : "Borrador"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {publicLink && isPublished ? (
              <Link href={publicLink} target="_blank" className="inline-flex items-center gap-1 text-sm text-[var(--accent-hex)] hover:underline">
                Ver <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <Button disabled={saving} variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => void save(false)}>
              {saving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button disabled={saving} className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white" onClick={() => void save(true)}>
              {saving ? "Guardando..." : "Publicar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <main className="space-y-4 rounded-2xl border border-white/10 bg-[var(--mygreen)]/70 p-4 sm:p-6">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched && !titleMeta.trim()) setTitleMeta(e.target.value);
              }}
              placeholder="Título del artículo"
              className="border-0 bg-transparent px-0 text-3xl font-bold text-white placeholder:text-white/40 shadow-none focus-visible:ring-0 sm:text-4xl"
            />

            <div className="grid gap-2">
              <Label className="text-white/80">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                placeholder="se-genera-automaticamente"
              />
              <p className="text-xs text-white/60">Vista previa: /blog/{currentSlug || "tu-slug"}</p>
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">Contenido</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[480px] bg-[var(--mygreen-dark)] border-white/10 text-white placeholder:text-white/45"
                placeholder="Escribe el artículo..."
              />
            </div>
          </main>

          <aside className="space-y-4 rounded-2xl border border-white/10 bg-[var(--mygreen)]/70 p-4">
            <div className="space-y-2">
              <Label className="text-white/80">Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-[var(--mygreen-dark)] border-white/10 text-white placeholder:text-white/45"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Meta título</Label>
              <Input
                value={titleMeta}
                onChange={(e) => setTitleMeta(e.target.value)}
                className="bg-[var(--mygreen-dark)] border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">URL imagen destacada</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="bg-[var(--mygreen-dark)] border-white/10 text-white"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[var(--mygreen-dark)] px-3 py-2">
              <Label className="text-white/80">Publicar</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
