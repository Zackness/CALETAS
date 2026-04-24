"use client";

import { useEffect, useState } from "react";
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
import { Library, PlusCircle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Curso = {
  id: string;
  titulo: string;
  slug: string | null;
  descripcion: string;
  contenido: string;
  urlVideo: string | null;
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
    descripcion: "",
    contenido: "",
    urlVideo: "",
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
      descripcion: "",
      contenido: "",
      urlVideo: "",
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
      descripcion: c.descripcion || "",
      contenido: c.contenido || "",
      urlVideo: c.urlVideo || "",
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
        descripcion: form.descripcion.trim(),
        contenido: form.contenido.trim(),
        urlVideo: form.urlVideo.trim() || undefined,
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
            {loading ? (
              <p className="text-white/70">Cargando...</p>
            ) : cursos.length === 0 ? (
              <p className="text-white/70">Aún no hay cursos. Crea uno con el botón superior.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-2 text-white/70 font-medium">Título</th>
                      <th className="px-3 py-2 text-white/70 font-medium">Tema</th>
                      <th className="px-3 py-2 text-white/70 font-medium">Orden</th>
                      <th className="px-3 py-2 text-white/70 font-medium">Creado</th>
                      <th className="px-3 py-2 text-white/70 font-medium w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursos.map((c) => (
                      <tr key={c.id} className="border-b border-white/10">
                        <td className="px-3 py-2 text-white">{c.titulo}</td>
                        <td className="px-3 py-2 text-white/80">{c.tema || "—"}</td>
                        <td className="px-3 py-2 text-white/80">{c.orden}</td>
                        <td className="px-3 py-2 text-white/60 text-sm">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                              onClick={() => remove(c)}
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
                <Label className="text-white/80">Descripción</Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="Breve resumen"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">URL de video (YouTube, etc.)</Label>
                <Input
                  value={form.urlVideo}
                  onChange={(e) => setForm((f) => ({ ...f, urlVideo: e.target.value }))}
                  className="bg-[var(--mygreen-dark)] border-white/10 text-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
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
