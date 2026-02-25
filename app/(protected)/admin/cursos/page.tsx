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
              <Library className="w-8 h-8 text-[#40C9A9]" />
              Cursos y tutoriales
            </h1>
            <p className="text-white/70 mt-1">
              Gestiona los cursos y tutoriales que ven los estudiantes. Solo admin puede crear o editar.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo curso
          </Button>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
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
          <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Ej: Introducción a Python"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Tema / categoría</Label>
                <Input
                  value={form.tema}
                  onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Ej: Programación"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Descripción</Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Breve resumen"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">URL de video (YouTube, etc.)</Label>
                <Input
                  value={form.urlVideo}
                  onChange={(e) => setForm((f) => ({ ...f, urlVideo: e.target.value }))}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">URL de imagen (opcional)</Label>
                <Input
                  value={form.imagenUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Orden (número para ordenar en la lista)</Label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm((f) => ({ ...f, orden: parseInt(e.target.value, 10) || 0 }))}
                  className="bg-[#1C2D20] border-white/10 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/80">Contenido (texto o HTML)</Label>
                <textarea
                  value={form.contenido}
                  onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                  className="min-h-[120px] w-full rounded-lg bg-[#1C2D20] border border-white/10 text-white px-3 py-2 placeholder:text-white/50"
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
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
