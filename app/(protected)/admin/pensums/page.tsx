"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Pencil, PlusCircle, Trash2 } from "lucide-react";
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

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
const ORDER_STORAGE_KEY_PREFIX = "caletas:pensum-order:";

export default function AdminPensumsPage() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [selectedUniversidad, setSelectedUniversidad] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false);
  const [careerDialogOpen, setCareerDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [savingCareer, setSavingCareer] = useState(false);
  const [activeOrderSemester, setActiveOrderSemester] = useState("S1");
  const [orderBySemester, setOrderBySemester] = useState<Record<string, string[]>>({});
  const [institutionForm, setInstitutionForm] = useState({
    nombre: "",
    siglas: "",
    tipo: "UNIVERSIDAD",
    estado: "",
    ciudad: "",
    direccion: "",
    telefono: "",
    email: "",
    website: "",
  });
  const [careerForm, setCareerForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    duracion: 10,
    creditos: 0,
  });
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

  useEffect(() => {
    void loadPensumData();
  }, []);

  useEffect(() => {
    if (!selectedCarrera) {
      setOrderBySemester({});
      return;
    }
    const key = `${ORDER_STORAGE_KEY_PREFIX}${selectedCarrera}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setOrderBySemester({});
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      setOrderBySemester(parsed || {});
    } catch {
      setOrderBySemester({});
    }
  }, [selectedCarrera]);

  useEffect(() => {
    if (!selectedCarrera) return;
    const key = `${ORDER_STORAGE_KEY_PREFIX}${selectedCarrera}`;
    window.localStorage.setItem(key, JSON.stringify(orderBySemester));
  }, [orderBySemester, selectedCarrera]);

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

  const createInstitution = async () => {
    if (!institutionForm.nombre.trim() || !institutionForm.siglas.trim()) {
      toast.error("Nombre y siglas son obligatorios");
      return;
    }
    setSavingInstitution(true);
    try {
      const res = await fetch("/api/admin/pensums/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institutionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la institución");
      toast.success("Institución creada");
      setInstitutionDialogOpen(false);
      setInstitutionForm({
        nombre: "",
        siglas: "",
        tipo: "UNIVERSIDAD",
        estado: "",
        ciudad: "",
        direccion: "",
        telefono: "",
        email: "",
        website: "",
      });
      await loadPensumData(selectedCarrera || undefined);
      if (data?.universidad?.id) setSelectedUniversidad(data.universidad.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error creando institución");
    } finally {
      setSavingInstitution(false);
    }
  };

  const createCareer = async () => {
    if (!selectedUniversidad) {
      toast.error("Selecciona primero una institución");
      return;
    }
    if (!careerForm.nombre.trim() || !careerForm.codigo.trim()) {
      toast.error("Nombre y código son obligatorios");
      return;
    }
    setSavingCareer(true);
    try {
      const res = await fetch("/api/admin/pensums/carreras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...careerForm,
          universidadId: selectedUniversidad,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la carrera");
      toast.success("Carrera creada");
      setCareerDialogOpen(false);
      setCareerForm({
        nombre: "",
        codigo: "",
        descripcion: "",
        duracion: 10,
        creditos: 0,
      });
      await loadPensumData();
      if (data?.carrera?.id) setSelectedCarrera(data.carrera.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error creando carrera");
    } finally {
      setSavingCareer(false);
    }
  };

  const getOrderedCodesForSemester = (semester: string) => {
    const base = materias
      .filter((m) => m.semestre === semester)
      .map((m) => m.codigo);
    const current = orderBySemester[semester] || [];
    const merged = [...current.filter((c) => base.includes(c)), ...base.filter((c) => !current.includes(c))];
    return merged;
  };

  const moveOrderItem = (semester: string, index: number, dir: "up" | "down") => {
    const current = getOrderedCodesForSemester(semester);
    const nextIndex = dir === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= current.length) return;
    const next = [...current];
    const tmp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = tmp;
    setOrderBySemester((prev) => ({ ...prev, [semester]: next }));
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
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Instituciones y carreras</CardTitle>
            <CardDescription className="text-white/70">
              Crea universidades/institutos y carreras para construir nuevos pensums.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
              onClick={() => setInstitutionDialogOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Nueva institución
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#40C9A9]/40 bg-[#1C2D20] text-[#40C9A9] hover:bg-[#203324]"
              onClick={() => setCareerDialogOpen(true)}
              disabled={!selectedUniversidad}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Nueva carrera
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Materias del pensum</CardTitle>
              <CardDescription className="text-white/70">
                Agrega/edita materias y ve el flujo en tiempo real.
              </CardDescription>
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
                        <td className="px-3 py-2 align-middle">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7 border-[#40C9A9]/40 bg-[#1C2D20] text-[#40C9A9] hover:bg-[#203324]" onClick={() => openEdit(m)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-7 w-7 border-red-500/30 bg-[#1C2D20] text-red-300 hover:bg-red-500/10" onClick={() => void removeMateria(m)}>
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
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Orden visual del flujo</CardTitle>
              <CardDescription className="text-white/70">
                Ajusta el orden por semestre para acercarlo al diagrama oficial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCarrera ? (
                <p className="text-white/70">Selecciona una carrera para editar el orden.</p>
              ) : (
                <>
                  <Select value={activeOrderSemester} onValueChange={setActiveOrderSemester}>
                    <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#203324] border-white/10 text-white">
                      {SEMESTRES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-2 max-h-[55vh] overflow-auto space-y-1">
                    {getOrderedCodesForSemester(activeOrderSemester).map((code, idx) => (
                      <div key={`${activeOrderSemester}-${code}`} className="flex items-center justify-between rounded-md bg-[#203324] px-2 py-1.5">
                        <span className="text-xs text-white/90">{idx + 1}. {code}</span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 border-white/20 bg-[#1C2D20] text-white hover:bg-white/10"
                            onClick={() => moveOrderItem(activeOrderSemester, idx, "up")}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 border-white/20 bg-[#1C2D20] text-white hover:bg-white/10"
                            onClick={() => moveOrderItem(activeOrderSemester, idx, "down")}
                            disabled={idx === getOrderedCodesForSemester(activeOrderSemester).length - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getOrderedCodesForSemester(activeOrderSemester).length === 0 ? (
                      <p className="text-xs text-white/60">No hay materias en este semestre.</p>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#354B3A] border-white/10 xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Organigrama del pensum</CardTitle>
              <CardDescription className="text-white/70">
                Vista en vivo según las materias actuales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCarrera ? (
                <p className="text-white/70">Selecciona una carrera para ver el organigrama.</p>
              ) : !materias.length ? (
                <p className="text-white/70">Aún no hay materias para mostrar el flujo.</p>
              ) : (
                <div className="h-[70vh] rounded-lg border border-white/10 bg-[#203324] overflow-hidden">
                  <PensumFlowchart
                    materias={materias as any}
                    materiasEstudiante={[]}
                    customOrderBySemester={orderBySemester}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

      <Dialog open={institutionDialogOpen} onOpenChange={setInstitutionDialogOpen}>
        <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva institución</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-white/80">Nombre</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.nombre} onChange={(e) => setInstitutionForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Siglas</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.siglas} onChange={(e) => setInstitutionForm((f) => ({ ...f, siglas: e.target.value.toUpperCase() }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Tipo</Label>
              <Select value={institutionForm.tipo} onValueChange={(value) => setInstitutionForm((f) => ({ ...f, tipo: value }))}>
                <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] border-white/10 text-white">
                  <SelectItem value="UNIVERSIDAD">Universidad</SelectItem>
                  <SelectItem value="INSTITUTO">Instituto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Estado</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.estado} onChange={(e) => setInstitutionForm((f) => ({ ...f, estado: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Ciudad</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.ciudad} onChange={(e) => setInstitutionForm((f) => ({ ...f, ciudad: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Teléfono</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.telefono} onChange={(e) => setInstitutionForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <Label className="text-white/80">Dirección</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.direccion} onChange={(e) => setInstitutionForm((f) => ({ ...f, direccion: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Email</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.email} onChange={(e) => setInstitutionForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Website</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={institutionForm.website} onChange={(e) => setInstitutionForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setInstitutionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={() => void createInstitution()} disabled={savingInstitution}>
              {savingInstitution ? "Guardando..." : "Crear institución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={careerDialogOpen} onOpenChange={setCareerDialogOpen}>
        <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>Nueva carrera</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label className="text-white/80">Nombre</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={careerForm.nombre} onChange={(e) => setCareerForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Código</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={careerForm.codigo} onChange={(e) => setCareerForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-white/80">Duración (semestres)</Label>
                <Input type="number" className="bg-[#1C2D20] border-white/10 text-white" value={careerForm.duracion} onChange={(e) => setCareerForm((f) => ({ ...f, duracion: Number(e.target.value) || 1 }))} />
              </div>
              <div className="grid gap-1">
                <Label className="text-white/80">Créditos</Label>
                <Input type="number" className="bg-[#1C2D20] border-white/10 text-white" value={careerForm.creditos} onChange={(e) => setCareerForm((f) => ({ ...f, creditos: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/80">Descripción</Label>
              <Input className="bg-[#1C2D20] border-white/10 text-white" value={careerForm.descripcion} onChange={(e) => setCareerForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setCareerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={() => void createCareer()} disabled={savingCareer}>
              {savingCareer ? "Guardando..." : "Crear carrera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
