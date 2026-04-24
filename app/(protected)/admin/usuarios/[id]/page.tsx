"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = "CLIENT" | "ADMIN";
type MateriaEstado =
  | "NO_CURSADA"
  | "EN_CURSO"
  | "APROBADA"
  | "APLAZADA"
  | "RETIRADA";

type UniversidadOption = {
  id: string;
  nombre: string;
  carreras: Array<{ id: string; nombre: string; codigo: string }>;
};

type MateriaOption = {
  id: string;
  codigo: string;
  nombre: string;
  semestre: string;
  carreraId: string;
};

type MateriaEdit = {
  materiaId: string;
  estado: MateriaEstado;
  nota: string;
};

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: Role;
  telefono?: string | null;
  universidadId?: string | null;
  carreraId?: string | null;
  semestreActual?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionName?: string | null;
  materiasEstudiante?: Array<{
    materiaId: string;
    estado: MateriaEstado;
    nota: number | null;
  }>;
};

export default function AdminUsuarioEditPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pensumUniversidades, setPensumUniversidades] = useState<UniversidadOption[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<MateriaOption[]>([]);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "CLIENT" as Role,
    telefono: "",
    universidadId: "none",
    carreraId: "none",
    semestreActual: "",
  });
  const [materiasEdit, setMateriasEdit] = useState<MateriaEdit[]>([]);

  const carrerasOptions = useMemo(() => {
    const uni = pensumUniversidades.find((u) => u.id === form.universidadId);
    return uni?.carreras ?? [];
  }, [pensumUniversidades, form.universidadId]);

  const loadPensumBase = async () => {
    const res = await fetch("/api/admin/pensums");
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error cargando universidades");
    setPensumUniversidades(Array.isArray(data?.universidades) ? data.universidades : []);
  };

  const loadMateriasForCarrera = async (carreraId: string) => {
    const res = await fetch(`/api/admin/pensums?carreraId=${encodeURIComponent(carreraId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error cargando materias");
    setMateriasOptions(Array.isArray(data?.materias) ? data.materias : []);
  };

  const loadUser = async () => {
    if (!userId) return;
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error cargando usuario");
    const u = data?.user as UserDetail;
    setUser(u);
    setForm({
      name: u?.name ?? "",
      email: u?.email ?? "",
      role: (u?.role as Role) ?? "CLIENT",
      telefono: u?.telefono ?? "",
      universidadId: u?.universidadId ?? "none",
      carreraId: u?.carreraId ?? "none",
      semestreActual: u?.semestreActual ?? "",
    });

    const materias = Array.isArray(u?.materiasEstudiante) ? u.materiasEstudiante : [];
    setMateriasEdit(
      materias.map((me) => ({
        materiaId: me.materiaId,
        estado: me.estado ?? "EN_CURSO",
        nota: me.nota != null ? String(me.nota) : "",
      })),
    );

    if (u?.carreraId) {
      await loadMateriasForCarrera(u.carreraId);
    } else {
      setMateriasOptions([]);
    }
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true);
        await loadPensumBase();
        await loadUser();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error cargando edición");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (form.carreraId && form.carreraId !== "none") {
      void loadMateriasForCarrera(form.carreraId).catch(() => {
        setMateriasOptions([]);
      });
    } else {
      setMateriasOptions([]);
      setMateriasEdit([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.carreraId]);

  const handleSave = async () => {
    if (!userId) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          telefono: form.telefono.trim() ? form.telefono.trim() : null,
          universidadId: form.universidadId === "none" ? null : form.universidadId,
          carreraId: form.carreraId === "none" ? null : form.carreraId,
          semestreActual: form.semestreActual.trim() ? form.semestreActual.trim() : null,
          materias: materiasEdit.map((m) => ({
            materiaId: m.materiaId,
            estado: m.estado,
            nota: m.nota ? Number(m.nota) : null,
          })),
          replaceMaterias: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando");
      toast.success("Usuario actualizado");
      setUser((prev) => (prev ? { ...prev, ...data.user } : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white/70">
              <Button
                type="button"
                variant="outline"
                className="h-9 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => router.push("/admin/usuarios")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <span className="hidden sm:inline">/</span>
              <span className="truncate">Editar usuario</span>
            </div>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-special text-white sm:text-3xl">
              <ShieldCheck className="h-6 w-6 text-[var(--accent-hex)]" />
              Administración de usuario
            </h1>
          </div>

          <Button
            type="button"
            className="bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
            onClick={() => void handleSave()}
            disabled={saving || loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        {loading ? (
          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardContent className="py-10 text-center text-white/70">Cargando...</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-[var(--accent-hex)]" />
                    Datos del usuario
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Información general y rol.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-white/80">Nombre</Label>
                      <Input
                        className="bg-[var(--mygreen-dark)] border-white/20 text-white"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Correo</Label>
                      <Input
                        className="bg-[var(--mygreen-dark)] border-white/20 text-white"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-white/80">Teléfono</Label>
                      <Input
                        className="bg-[var(--mygreen-dark)] border-white/20 text-white"
                        value={form.telefono}
                        onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Rol</Label>
                      <Select
                        value={form.role}
                        onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
                      >
                        <SelectTrigger className="bg-[var(--mygreen-dark)] border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--mygreen)] text-white border-white/10">
                          <SelectItem value="CLIENT">CLIENT</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Académico</CardTitle>
                  <CardDescription className="text-white/70">
                    Universidad, carrera, semestre y materias.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-white/80">Universidad</Label>
                      <Select
                        value={form.universidadId}
                        onValueChange={(v) => {
                          setForm((f) => ({ ...f, universidadId: v, carreraId: "none" }));
                          setMateriasEdit([]);
                        }}
                      >
                        <SelectTrigger className="bg-[var(--mygreen-dark)] border-white/20 text-white">
                          <SelectValue placeholder="Selecciona universidad" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--mygreen)] text-white border-white/10 max-h-72">
                          <SelectItem value="none">Sin universidad</SelectItem>
                          {pensumUniversidades.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/80">Carrera</Label>
                      <Select
                        value={form.carreraId}
                        onValueChange={(v) => setForm((f) => ({ ...f, carreraId: v }))}
                        disabled={form.universidadId === "none"}
                      >
                        <SelectTrigger className="bg-[var(--mygreen-dark)] border-white/20 text-white">
                          <SelectValue placeholder="Selecciona carrera" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--mygreen)] text-white border-white/10 max-h-72">
                          <SelectItem value="none">Sin carrera</SelectItem>
                          {carrerasOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.codigo} — {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80">Semestre actual</Label>
                    <Input
                      className="bg-[var(--mygreen-dark)] border-white/20 text-white"
                      placeholder="Ej: S4"
                      value={form.semestreActual}
                      onChange={(e) => setForm((f) => ({ ...f, semestreActual: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Materias (estado y nota)</Label>
                    <div className="rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-3 space-y-2">
                      {form.carreraId === "none" ? (
                        <div className="text-sm text-white/60">Selecciona una carrera para gestionar materias.</div>
                      ) : materiasOptions.length === 0 ? (
                        <div className="text-sm text-white/60">No hay materias para esta carrera.</div>
                      ) : (
                        <>
                          <Select
                            value="__add__"
                            onValueChange={(v) => {
                              if (v === "__add__") return;
                              setMateriasEdit((prev) => {
                                if (prev.some((x) => x.materiaId === v)) return prev;
                                return [...prev, { materiaId: v, estado: "EN_CURSO", nota: "" }];
                              });
                            }}
                          >
                            <SelectTrigger className="bg-[var(--mygreen)] border-white/10 text-white">
                              <SelectValue placeholder="Añadir materia..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--mygreen)] text-white border-white/10 max-h-72">
                              {materiasOptions.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.codigo} — {m.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {materiasEdit.length === 0 ? (
                            <div className="text-sm text-white/60">Sin materias asignadas.</div>
                          ) : (
                            <div className="space-y-2">
                              {materiasEdit.map((me) => {
                                const mat = materiasOptions.find((m) => m.id === me.materiaId);
                                return (
                                  <div
                                    key={me.materiaId}
                                    className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[var(--mygreen)] p-3 md:flex-row md:items-start"
                                  >
                                    <div className="min-w-0 flex-1 text-sm text-white/85 md:basis-[52%] md:pr-2">
                                      <div className="whitespace-normal break-words font-medium leading-snug">
                                        {mat ? `${mat.codigo} — ${mat.nombre}` : me.materiaId}
                                      </div>
                                      {mat ? (
                                        <div className="text-xs text-white/50">Semestre: {mat.semestre}</div>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-end md:basis-[48%]">
                                      <Select
                                        value={me.estado}
                                        onValueChange={(v) =>
                                          setMateriasEdit((prev) =>
                                            prev.map((x) =>
                                              x.materiaId === me.materiaId
                                                ? { ...x, estado: v as MateriaEstado }
                                                : x,
                                            ),
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-9 bg-[var(--mygreen-dark)] border-white/10 text-white md:w-44">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--mygreen)] text-white border-white/10">
                                          <SelectItem value="NO_CURSADA">No cursada</SelectItem>
                                          <SelectItem value="EN_CURSO">En curso</SelectItem>
                                          <SelectItem value="APROBADA">Aprobada</SelectItem>
                                          <SelectItem value="APLAZADA">Aplazada</SelectItem>
                                          <SelectItem value="RETIRADA">Retirada</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        className="h-9 bg-[var(--mygreen-dark)] border-white/10 text-white md:w-24"
                                        placeholder="Nota"
                                        value={me.nota}
                                        onChange={(e) =>
                                          setMateriasEdit((prev) =>
                                            prev.map((x) =>
                                              x.materiaId === me.materiaId ? { ...x, nota: e.target.value } : x,
                                            ),
                                          )
                                        }
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 md:w-auto"
                                        onClick={() =>
                                          setMateriasEdit((prev) => prev.filter((x) => x.materiaId !== me.materiaId))
                                        }
                                      >
                                        Quitar
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Estado</CardTitle>
                  <CardDescription className="text-white/70">
                    Información de cuenta y suscripción.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)]">
                      {user?.role ?? form.role}
                    </Badge>
                    {user?.subscriptionStartedAt ? (
                      <Badge className="bg-white/10 text-white/80 border-white/10">
                        Suscrito: {new Date(user.subscriptionStartedAt).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge className="bg-white/5 text-white/50 border-white/10">Sin suscripción</Badge>
                    )}
                  </div>

                  {user?.subscriptionStartedAt ? (
                    <div className="rounded-lg border border-white/10 bg-[var(--mygreen)] p-3">
                      <div className="text-xs text-white/50">Suscripción desde</div>
                      <div className="text-sm text-white/85">
                        {new Date(user.subscriptionStartedAt).toLocaleString()}
                      </div>
                      {user.subscriptionName ? (
                        <div className="text-xs text-white/50 mt-1">{user.subscriptionName}</div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="text-xs text-white/55">
                    ID: <span className="text-white/80">{user?.id ?? userId}</span>
                  </div>

                  <div className="text-xs text-white/55">
                    Volver a la lista en{" "}
                    <Link href="/admin/usuarios" className="text-[var(--accent-hex)] hover:underline">
                      /admin/usuarios
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

