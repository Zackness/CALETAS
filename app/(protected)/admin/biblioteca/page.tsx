"use client";

import { useEffect, useState } from "react";
import { BookMarked, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Obra = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  cuerpo: string;
  orden: number;
  isPublished: boolean;
};

export default function AdminBibliotecaPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    slug: "",
    descripcion: "",
    cuerpo: "",
    orden: 0,
    isPublished: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/biblioteca");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando obras");
      setObras(Array.isArray(data.obras) ? data.obras : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      titulo: "",
      slug: "",
      descripcion: "",
      cuerpo: "",
      orden: 0,
      isPublished: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (o: Obra) => {
    setEditing(o);
    setForm({
      titulo: o.titulo,
      slug: o.slug,
      descripcion: o.descripcion || "",
      cuerpo: o.cuerpo,
      orden: o.orden,
      isPublished: o.isPublished,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.cuerpo.trim()) {
      toast.error("Título y cuerpo son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/biblioteca/${editing.id}` : "/api/admin/biblioteca";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando");
      toast.success(editing ? "Actualizado" : "Creado");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (o: Obra) => {
    if (!confirm(`¿Eliminar "${o.titulo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/biblioteca/${o.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Error");
      }
      toast.success("Eliminado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-special text-white mb-1 flex items-center gap-2">
              <BookMarked className="w-7 h-7 text-[#40C9A9]" />
              Biblioteca (admin)
            </h1>
            <p className="text-white/70 text-sm">Obras en Markdown. Los usuarios leen en la app; no hay descarga.</p>
          </div>
          <Button className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={openCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nueva obra
          </Button>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Obras</CardTitle>
            <CardDescription className="text-white/70">Solo publicadas las ve el usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/70">Cargando…</p>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1C2D20] text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Título</th>
                      <th className="px-3 py-2 text-left">Slug</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obras.map((o) => (
                      <tr key={o.id} className="border-t border-white/5 bg-[#203324]">
                        <td className="px-3 py-2 text-white">{o.titulo}</td>
                        <td className="px-3 py-2 text-white/80">{o.slug}</td>
                        <td className="px-3 py-2">
                          <Badge
                            className={
                              o.isPublished
                                ? "bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30"
                                : "bg-white/10 text-white/80 border-white/20"
                            }
                          >
                            {o.isPublished ? "Publicada" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 border-[#40C9A9]/40 bg-[#1C2D20] text-[#40C9A9] hover:bg-[#203324]"
                              onClick={() => openEdit(o)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 border-red-500/30 bg-[#1C2D20] text-red-300 hover:bg-red-500/10"
                              onClick={() => void remove(o)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar obra" : "Nueva obra"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label className="text-white/80">Título</Label>
              <Input
                className="bg-[#1C2D20] border-white/10 text-white"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Slug (opcional)</Label>
              <Input
                className="bg-[#1C2D20] border-white/10 text-white"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto desde título"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Descripción corta</Label>
              <Input
                className="bg-[#1C2D20] border-white/10 text-white"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Orden</Label>
              <Input
                type="number"
                className="bg-[#1C2D20] border-white/10 text-white"
                value={form.orden}
                onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pub"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              <Label htmlFor="pub" className="text-white/80 cursor-pointer">
                Publicada
              </Label>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Cuerpo (Markdown)</Label>
              <Textarea
                className="bg-[#1C2D20] border-white/10 text-white min-h-[200px] font-mono text-sm"
                value={form.cuerpo}
                onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-[#40C9A9]/40 bg-[#1C2D20] text-[#40C9A9] hover:bg-[#203324]"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={() => void save()} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
