"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Library, PlusCircle, Pencil, Trash2, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

type Curso = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: "video" | "web";
  descripcion: string;
  contenido: string;
  urlVideo: string | null;
  externalUrl: string | null;
  imagenUrl: string | null;
  tema: string | null;
  orden: number;
  createdAt: string;
  autor: { name: string };
};

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    tipo: "video" as "video" | "web",
    descripcion: "",
    contenido: "",
    urlVideo: "",
    externalUrl: "",
    imagenUrl: "",
    tema: "",
    orden: 0,
  });
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<
    { name: string; url: string; type: string; size: number; lastModified: string }[]
  >([]);
  const [mediaSubfolder, setMediaSubfolder] = useState("media");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "web">("all");

  const filteredCursos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cursos.filter((curso) => {
      const matchesType = typeFilter === "all" || curso.tipo === typeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return [curso.titulo, curso.slug, curso.tema, curso.descripcion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [cursos, search, typeFilter]);

  const loadCursos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cursos");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      setCursos(Array.isArray(data.cursos) ? data.cursos : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando cursos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCursos();
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
        titulo: "",
        tipo: "video",
        descripcion: "",
        contenido: "",
        urlVideo: "",
        externalUrl: "",
        imagenUrl: "",
      tema: "",
      orden: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Curso) => {
    setEditing(c);
    setForm({
      titulo: c.titulo,
      tipo: c.tipo,
      descripcion: c.descripcion || "",
      contenido: c.contenido || "",
      urlVideo: c.urlVideo || "",
      externalUrl: c.externalUrl || "",
      imagenUrl: c.imagenUrl || "",
      tema: c.tema || "",
      orden: c.orden ?? 0,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/cursos/${editing.id}` : "/api/admin/cursos";
      const method = editing ? "PATCH" : "POST";
      const body = {
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        contenido: form.contenido.trim(),
        urlVideo: form.tipo === "video" ? form.urlVideo.trim() || undefined : undefined,
        externalUrl: form.tipo === "web" ? form.externalUrl.trim() || undefined : undefined,
        imagenUrl: form.imagenUrl.trim() || undefined,
        tema: form.tema.trim() || undefined,
        orden: form.orden,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando");
      toast.success(editing ? "Curso actualizado" : "Curso creado");
      setDialogOpen(false);
      loadCursos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Curso) => {
    if (!confirm(`¿Eliminar el curso "${c.titulo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cursos/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      toast.success("Curso eliminado");
      loadCursos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" className="text-white/80 hover:text-white mb-2 -ml-2" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al panel
              </Link>
            </Button>
            <h1 className="text-3xl font-special text-white flex items-center gap-2">
              <Library className="w-8 h-8 text-[var(--accent-hex)]" />
              Cursos y tutoriales
            </h1>
            <p className="text-white/70 mt-1">
              Gestiona los cursos y tutoriales que ven los estudiantes. Solo admin puede crear o editar.
            </p>
            <p className="text-xs text-white/60 mt-1">
              Para imágenes usa la Biblioteca de medios en <span className="text-[var(--accent-hex)]">Admin &gt; Biblioteca de medios</span> (Bunny `caletas/`).
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo curso
          </Button>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Listado de cursos</CardTitle>
            <CardDescription className="text-white/70">
              Los estudiantes ven estos cursos en la sección Cursos del menú.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, slug o tema..."
                  className="border-white/10 bg-[#1C2D20] pl-9 text-white placeholder:text-white/40"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "video" | "web")}
                className="h-10 rounded-md border border-white/10 bg-[#1C2D20] px-3 text-sm text-white outline-none md:w-[11rem]"
              >
                <option value="all">Todos los tipos</option>
                <option value="video">Solo video</option>
                <option value="web">Solo web</option>
              </select>
            </div>
            {loading ? (
              <p className="text-white/70">Cargando...</p>
            ) : cursos.length === 0 ? (
              <p className="text-white/70">Aún no hay cursos. Crea uno con el botón superior.</p>
            ) : filteredCursos.length === 0 ? (
              <p className="text-white/70">No hay cursos que coincidan con ese filtro.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#2C4032]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/10">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Curso</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Tema</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Tipo</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Orden</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Creado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCursos.map((c) => (
                      <tr key={c.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <div className="min-w-[14rem]">
                            <div className="font-medium text-white">{c.titulo}</div>
                            {c.slug ? <div className="mt-1 text-xs text-white/45">/{c.slug}</div> : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-white/80">{c.tema || "—"}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full border border-white/10 bg-black/15 px-2 py-1 text-xs capitalize text-white/80">
                            {c.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-white/70">#{c.orden}</td>
                        <td className="px-3 py-3 text-sm text-white/55">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                              onClick={() => openEdit(c)}
                              title="Editar curso"
                              aria-label={`Editar ${c.titulo}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-red-500/25 bg-red-500/5 text-red-300 hover:bg-red-500/10"
                              onClick={() => remove(c)}
                              title="Eliminar curso"
                              aria-label={`Eliminar ${c.titulo}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[var(--mygreen-light)] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar curso" : "Nuevo curso"}</DialogTitle>
              <CardDescription className="text-white/70">
                Título, descripción, contenido (texto o HTML) y opcionalmente video o imagen.
              </CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-white/80">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="Ej: Introducción a Python"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Tema / categoría</Label>
                <Input
                  value={form.tema}
                  onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="Ej: Programación"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Tipo de curso</Label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as "video" | "web" }))}
                  className="h-10 rounded-md border border-white/10 bg-[var(--mygreen-dark)] px-3 text-white outline-none"
                >
                  <option value="video">Curso en video</option>
                  <option value="web">Curso tipo web</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Descripción</Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="Breve resumen"
                />
              </div>
              {form.tipo === "video" ? (
                <div className="grid gap-2">
                  <Label className="text-white/80">URL de video (YouTube, etc.)</Label>
                  <Input
                    value={form.urlVideo}
                    onChange={(e) => setForm((f) => ({ ...f, urlVideo: e.target.value }))}
                    className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label className="text-white/80">URL del curso web</Label>
                  <Input
                    value={form.externalUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                    className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                    placeholder="https://pic18.caleta.top"
                  />
                </div>
              )}
              {form.tipo === "video" ? (
                <div className="grid gap-2">
                  <Label className="text-white/80">URL de imagen (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.imagenUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
                      className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                      placeholder="https://..."
                    />
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
              ) : form.externalUrl.trim() ? (
                <div className="grid gap-2">
                  <Label className="text-white/80">Vista previa del sitio</Label>
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#1C2D20]">
                    <iframe
                      src={form.externalUrl.trim()}
                      className="h-56 w-full scale-[1.03] pointer-events-none select-none"
                      title="Preview del curso web"
                      tabIndex={-1}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                    <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                      Preview no interactivo
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label className="text-white/80">Orden (número para ordenar en la lista)</Label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm((f) => ({ ...f, orden: parseInt(e.target.value, 10) || 0 }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Contenido (texto o HTML)</Label>
                <textarea
                  value={form.contenido}
                  onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                  className="min-h-[120px] w-full rounded-lg bg-[var(--mygreen-dark)] border border-white/10 text-white px-3 py-2 placeholder:text-white/50"
                  placeholder="Contenido del curso o tutorial..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
          <DialogContent className="bg-[var(--mygreen-light)] border-white/10 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar imagen desde biblioteca</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={mediaSubfolder}
                  onChange={(e) => setMediaSubfolder(e.target.value)}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="Subcarpeta (ej: cursos)"
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
                        setForm((f) => ({ ...f, imagenUrl: file.url }));
                        setMediaDialogOpen(false);
                        toast.success("Imagen seleccionada");
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
    </div>
  );
}
