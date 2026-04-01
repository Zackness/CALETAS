"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Eye, Pencil, PlusCircle, Rocket, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PensumFlowchart } from "@/components/pensum-flowchart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Carrera = { id: string; nombre: string; codigo: string };
type Universidad = { id: string; nombre: string; carreras: Carrera[] };
type Materia = {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: string;
  horasTeoria: number;
  horasPractica: number;
  prerrequisitos: { prerrequisito: { id: string; codigo: string; nombre: string } }[];
};

type PensumVersion = {
  id: string;
  versionNumber: number;
  name: string;
  notes: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  publishedAt: string | null;
  createdBy: { id: string; name: string; email: string };
};

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];

export default function AdminPensumsPage() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [selectedUniversidad, setSelectedUniversidad] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [versions, setVersions] = useState<PensumVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    creditos: 0,
    semestre: "S1",
    horasTeoria: 0,
    horasPractica: 0,
    prerrequisitoIds: [] as string[],
  });

  const carrerasDisponibles = useMemo(
    () => universidades.find((u) => u.id === selectedUniversidad)?.carreras || [],
    [universidades, selectedUniversidad],
  );

  const loadPensumData = async (carreraId?: string) => {
    setLoading(true);
    try {
      const qs = carreraId ? `?carreraId=${carreraId}` : "";
      const res = await fetch(`/api/admin/pensums${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando pensum");
      setUniversidades(Array.isArray(data.universidades) ? data.universidades : []);
      setMaterias(Array.isArray(data.materias) ? data.materias : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando pensum");
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (carreraId: string) => {
    try {
      const res = await fetch(`/api/admin/pensums/versions?carreraId=${carreraId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando versiones");
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando versiones");
    }
  };

  useEffect(() => {
    void loadPensumData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      codigo: "",
      nombre: "",
      creditos: 0,
      semestre: "S1",
      horasTeoria: 0,
      horasPractica: 0,
      prerrequisitoIds: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (m: Materia) => {
    setEditing(m);
    setForm({
      codigo: m.codigo,
      nombre: m.nombre,
      creditos: m.creditos,
      semestre: m.semestre,
      horasTeoria: m.horasTeoria,
      horasPractica: m.horasPractica,
      prerrequisitoIds: m.prerrequisitos.map((p) => p.prerrequisito.id),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!selectedCarrera) return toast.error("Selecciona una carrera");
    if (!form.codigo.trim() || !form.nombre.trim()) return toast.error("Código y nombre son obligatorios");

    setSaving(true);
    try {
      const url = editing ? `/api/admin/pensums/${editing.id}` : "/api/admin/pensums";
      const method = editing ? "PATCH" : "POST";
      const payload = {
        ...(editing ? {} : { carreraId: selectedCarrera }),
        codigo: form.codigo,
        nombre: form.nombre,
        creditos: form.creditos,
        semestre: form.semestre,
        horasTeoria: form.horasTeoria,
        horasPractica: form.horasPractica,
        prerrequisitoIds: form.prerrequisitoIds,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando materia");
      toast.success(editing ? "Materia actualizada" : "Materia creada");
      setDialogOpen(false);
      await loadPensumData(selectedCarrera);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando materia");
    } finally {
      setSaving(false);
    }
  };

  const removeMateria = async (m: Materia) => {
    if (!confirm(`¿Eliminar "${m.nombre}" del pensum?`)) return;
    try {
      const res = await fetch(`/api/admin/pensums/${m.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando");
      toast.success("Materia eliminada");
      await loadPensumData(selectedCarrera);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#40C9A9]" />
            Panel Admin - Pensums
          </h1>
          <p className="text-white/70">Crea, edita y previsualiza pensums por universidad y carrera.</p>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Contexto del pensum</CardTitle>
            <CardDescription className="text-white/70">Selecciona universidad y carrera.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              value={selectedUniversidad}
              onValueChange={(value) => {
                setSelectedUniversidad(value);
                setSelectedCarrera("");
                setMaterias([]);
                setVersions([]);
              }}
            >
              <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                <SelectValue placeholder="Universidad" />
              </SelectTrigger>
              <SelectContent className="bg-[#203324] border-white/10 text-white">
                {universidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCarrera}
              onValueChange={(value) => {
                setSelectedCarrera(value);
                void loadPensumData(value);
                void loadVersions(value);
              }}
              disabled={!selectedUniversidad}
            >
              <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent className="bg-[#203324] border-white/10 text-white">
                {carrerasDisponibles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white flex-1" onClick={openCreate} disabled={!selectedCarrera}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nueva materia
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setPreviewOpen(true)} disabled={!materias.length}>
                <Eye className="w-4 h-4 mr-2" />
                Flujo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Versiones del pensum</CardTitle>
            <CardDescription className="text-white/70">
              Gestiona borradores, publicados y duplicados para esta carrera.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                disabled={!selectedCarrera || !selectedUniversidad}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/pensums/versions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        carreraId: selectedCarrera,
                        universidadId: selectedUniversidad,
                        name: "Borrador nuevo",
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "No se pudo crear versión");
                    toast.success("Versión borrador creada");
                    await loadVersions(selectedCarrera);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Error creando versión");
                  }
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Nuevo borrador
              </Button>
            </div>

            {!selectedCarrera ? (
              <p className="text-white/70">Selecciona una carrera para gestionar versiones.</p>
            ) : versions.length === 0 ? (
              <p className="text-white/70">Sin versiones todavía.</p>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1C2D20] text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Versión</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-left">Creada</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.id} className="border-t border-white/5 bg-[#203324]">
                        <td className="px-3 py-2 text-white">v{v.versionNumber}</td>
                        <td className="px-3 py-2 text-white/85">{v.name}</td>
                        <td className="px-3 py-2">
                          <Badge className={
                            v.status === "PUBLISHED"
                              ? "bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30"
                              : v.status === "DRAFT"
                                ? "bg-white/10 text-white/80 border-white/20"
                                : "bg-yellow-500/20 text-yellow-200 border-yellow-500/30"
                          }>
                            {v.status === "PUBLISHED" ? "Publicada" : v.status === "DRAFT" ? "Borrador" : "Archivada"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-white/70">{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            {v.status !== "PUBLISHED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/pensums/versions/${v.id}/publish`, {
                                      method: "POST",
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data?.error || "No se pudo publicar");
                                    toast.success("Versión publicada");
                                    await loadPensumData(selectedCarrera);
                                    await loadVersions(selectedCarrera);
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "Error publicando versión");
                                  }
                                }}
                              >
                                <Rocket className="w-4 h-4 mr-1" />
                                Publicar
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/admin/pensums/versions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      carreraId: selectedCarrera,
                                      universidadId: selectedUniversidad,
                                      sourceVersionId: v.id,
                                      name: `Copia de v${v.versionNumber}`,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data?.error || "No se pudo duplicar");
                                  toast.success("Versión duplicada");
                                  await loadVersions(selectedCarrera);
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Error duplicando versión");
                                }
                              }}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Duplicar
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

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Materias del pensum</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/70">Cargando...</p>
            ) : !selectedCarrera ? (
              <p className="text-white/70">Selecciona una carrera para empezar.</p>
            ) : materias.length === 0 ? (
              <p className="text-white/70">No hay materias en esta carrera.</p>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1C2D20] text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Materia</th>
                      <th className="px-3 py-2 text-left">Semestre</th>
                      <th className="px-3 py-2 text-left">Créditos</th>
                      <th className="px-3 py-2 text-left">Prerrequisitos</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materias.map((m) => (
                      <tr key={m.id} className="border-t border-white/5 bg-[#203324]">
                        <td className="px-3 py-2 text-white">{m.codigo}</td>
                        <td className="px-3 py-2 text-white">{m.nombre}</td>
                        <td className="px-3 py-2 text-white/80">{m.semestre}</td>
                        <td className="px-3 py-2 text-white/80">{m.creditos}</td>
                        <td className="px-3 py-2 text-white/80">
                          {m.prerrequisitos.length ? m.prerrequisitos.map((p) => p.prerrequisito.codigo).join(", ") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => openEdit(m)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10" onClick={() => void removeMateria(m)}>
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
        <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label className="text-white/80">Código</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Nombre</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label className="text-white/80">Semestre</Label>
                <Select value={form.semestre} onValueChange={(v) => setForm((f) => ({ ...f, semestre: v }))}>
                  <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#203324] border-white/10 text-white">
                    {SEMESTRES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/80">Créditos</Label>
                <Input type="number" className="bg-[#1C2D20] border-white/10 text-white" value={form.creditos} onChange={(e) => setForm((f) => ({ ...f, creditos: Number(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-1">
                <Label className="text-white/80">Horas T/P</Label>
                <div className="flex gap-2">
                  <Input type="number" className="bg-[#1C2D20] border-white/10 text-white" value={form.horasTeoria} onChange={(e) => setForm((f) => ({ ...f, horasTeoria: Number(e.target.value) || 0 }))} />
                  <Input type="number" className="bg-[#1C2D20] border-white/10 text-white" value={form.horasPractica} onChange={(e) => setForm((f) => ({ ...f, horasPractica: Number(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Prerrequisitos</Label>
              <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-[#1C2D20] p-2 space-y-1">
                {materias
                  .filter((m) => !editing || m.id !== editing.id)
                  .map((m) => {
                    const checked = form.prerrequisitoIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-sm text-white/85">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              prerrequisitoIds: e.target.checked
                                ? [...f.prerrequisitoIds, m.id]
                                : f.prerrequisitoIds.filter((id) => id !== m.id),
                            }))
                          }
                        />
                        <span>{m.codigo} - {m.nombre}</span>
                        <Badge className="bg-white/10 text-white/70 border-white/20">{m.semestre}</Badge>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={() => void save()} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-[#203324] border-white/10 text-white max-w-[95vw] w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista de flujo del pensum</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(90vh-90px)]">
            <PensumFlowchart materias={materias as any} materiasEstudiante={[]} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
