"use client";

import { useEffect, useState } from "react";
import { FileText, Pencil, PlusCircle, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  titleMeta: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
  author: { id: string; name: string; email: string };
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    imageUrl: "",
    categoryName: "",
    titleMeta: "",
    isPublished: false,
  });
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<
    { name: string; url: string; type: string; size: number; lastModified: string }[]
  >([]);
  const [mediaSubfolder, setMediaSubfolder] = useState("media");

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando artículos");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando artículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const loadMediaFiles = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/admin/media?subfolder=${encodeURIComponent(mediaSubfolder)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar la biblioteca");
      setMediaFiles(Array.isArray(data.files) ? data.files : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando biblioteca");
    } finally {
      setMediaLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      content: "",
      imageUrl: "",
      categoryName: "",
      titleMeta: "",
      isPublished: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      description: post.description || "",
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      categoryName: post.category?.name || "",
      titleMeta: post.titleMeta || "",
      isPublished: post.isPublished,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          content: form.content,
          imageUrl: form.imageUrl,
          categoryName: form.categoryName,
          titleMeta: form.titleMeta,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando artículo");
      toast.success(editing ? "Artículo actualizado" : "Artículo creado");
      setDialogOpen(false);
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando artículo");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: BlogPost) => {
    if (!confirm(`¿Eliminar el artículo "${post.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando artículo");
      toast.success("Artículo eliminado");
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando artículo");
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error actualizando estado");
      toast.success(!post.isPublished ? "Artículo publicado" : "Artículo enviado a borrador");
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error actualizando estado");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[var(--accent-hex)]" />
              Panel Admin - Blog
            </h1>
            <p className="text-white/70">Crea y gestiona artículos públicos del blog.</p>
            <p className="text-xs text-white/60 mt-1">
              Sube portadas en <span className="text-[var(--accent-hex)]">Admin &gt; Biblioteca de medios</span> para reutilizarlas.
            </p>
          </div>
          <Button className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white" onClick={openCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo artículo
          </Button>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-hex)]" />
              Artículos
            </CardTitle>
            <CardDescription className="text-white/70">
              Tabla de gestión para crear, editar, publicar y eliminar entradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/70">Cargando artículos...</p>
            ) : posts.length === 0 ? (
              <p className="text-white/70">Aún no hay artículos. Crea el primero con el botón superior.</p>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--mygreen-dark)] text-white/70">
                    <tr>
                      <th className="px-3 py-2">Título</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Autor</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="bg-[var(--mygreen)] border-t border-white/5">
                        <td className="px-3 py-2">
                          <div className="text-white font-medium">{post.title}</div>
                          <div className="text-xs text-white/60">/{post.slug || "sin-slug"}</div>
                        </td>
                        <td className="px-3 py-2 text-white/80">{post.category?.name || "Sin categoría"}</td>
                        <td className="px-3 py-2">
                          <Badge className={post.isPublished ? "bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]" : "bg-white/10 text-white/80 border-white/20"}>
                            {post.isPublished ? "Publicado" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-white/80">{post.author?.name || "Admin"}</td>
                        <td className="px-3 py-2 text-white/70">{new Date(post.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => void togglePublished(post)}
                            >
                              {post.isPublished ? "Borrador" : "Publicar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => openEdit(post)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                              onClick={() => void remove(post)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--mygreen-light)] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label className="text-white/80">Título *</Label>
              <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Slug (opcional)</Label>
              <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="se-genera-del-titulo-si-lo-dejas-vacio" />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Categoría</Label>
              <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.categoryName} onChange={(e) => setForm((f) => ({ ...f, categoryName: e.target.value }))} placeholder="Ej: Productividad" />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Descripción</Label>
              <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Meta título</Label>
              <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.titleMeta} onChange={(e) => setForm((f) => ({ ...f, titleMeta: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">URL de portada</Label>
              <div className="flex gap-2">
                <Input className="bg-[var(--mygreen-dark)] border-white/10 text-white" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setMediaDialogOpen(true);
                    void loadMediaFiles();
                  }}
                >
                  Biblioteca
                </Button>
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Contenido</Label>
              <textarea
                className="min-h-[200px] w-full rounded-lg bg-[var(--mygreen-dark)] border border-white/10 text-white px-3 py-2 placeholder:text-white/50"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Escribe aquí el artículo..."
              />
            </div>
            <label className="flex items-center gap-2 text-white/80 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Publicar inmediatamente
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white" onClick={() => void save()} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="bg-[var(--mygreen-light)] border-white/10 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar portada desde biblioteca</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={mediaSubfolder}
                onChange={(e) => setMediaSubfolder(e.target.value)}
                className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                placeholder="Subcarpeta (ej: blog)"
              />
              <Button
                type="button"
                className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
                onClick={() => void loadMediaFiles()}
              >
                Cargar
              </Button>
            </div>
            {mediaLoading ? (
              <p className="text-white/70">Cargando archivos...</p>
            ) : mediaFiles.length === 0 ? (
              <p className="text-white/70">No hay archivos en esa carpeta.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mediaFiles.map((file) => (
                  <button
                    key={file.url}
                    type="button"
                    className="text-left rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-3 hover:bg-[var(--mygreen)]"
                    onClick={() => {
                      setForm((f) => ({ ...f, imageUrl: file.url }));
                      setMediaDialogOpen(false);
                      toast.success("Portada seleccionada");
                    }}
                  >
                    <p className="text-white text-sm truncate">{file.name}</p>
                    <p className="text-white/60 text-xs truncate">{file.url}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
