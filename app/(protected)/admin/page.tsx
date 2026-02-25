"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Search as SearchIcon,
  Trash2,
  Edit,
  PlusCircle,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

type ManualPayment = {
  id: string;
  amountBs: number;
  reference: string;
  proofUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  subscriptionType: { id: string; name: string; period: string; price: number };
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  telefono?: string | null;
};

type AdminStats = {
  users: number;
  universidades: number;
  carreras: number;
  materias: number;
  recursos: number;
  subscriptions: number;
  manualPaymentsTotal: number;
  manualPaymentsPending: number;
};

type AdminCharts = {
  usersByMonth: { mes: string; usuarios: number }[];
  recursosByTipo: { tipo: string; count: number }[];
  recursosByMonth: { mes: string; recursos: number }[];
  paymentsByStatus: { PENDING: number; APPROVED: number; REJECTED: number };
};

type AiUsage = {
  totalRequests: number;
  totalTokens: number;
  byMonth: { mes: string; peticiones: number; tokens: number }[];
};

type StorageStats = {
  totalBytes: number;
  recursosConArchivo: number;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

type Subscription = {
  id: string;
  user: { id: string; name: string; email: string };
  subscriptionType: { id: string; name: string; price: number; period: string };
  stripeCurrentPeriodEnd: string | null;
  createdAt: string;
  stripePriceId: string | null;
};

const ROLES = ["CLIENT", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

const CHART_COLORS = ["#40C9A9", "#354B3A", "#5dd4b8", "#2d3d2e", "#6ee0c4"];
const formatMes = (mes: string) => {
  const [y, m] = mes.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
};

export default function AdminPage() {
  // Usuarios
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<Role | "ALL">("ALL");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    role: Role;
    password: string;
    telefono: string;
  }>({
    name: "",
    email: "",
    role: "CLIENT",
    password: "",
    telefono: "",
  });
  const [savingUser, setSavingUser] = useState(false);

  // Pagos manuales
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  // Suscripciones (Stripe / manual consolidadas)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);

  // Estadísticas y gráficas
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [charts, setCharts] = useState<AdminCharts | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadUsers = async (opts?: { search?: string; role?: string }) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts?.search) params.set("search", opts.search);
      if (opts?.role && opts.role !== "ALL") params.set("role", opts.role);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando usuarios");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch("/api/admin/bs-payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando pagos");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando suscripciones");
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setStats(data.counts as AdminStats);
      setCharts((data.charts as AdminCharts) ?? null);
      setAiUsage((data.aiUsage as AiUsage) ?? null);
      setStorage((data.storage as StorageStats) ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando estadísticas");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadPayments();
    void loadSubscriptions();
    void loadStats();
  }, []);

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      role: "CLIENT",
      password: "",
      telefono: "",
    });
    setUserDialogOpen(true);
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: (user.role as Role) || "CLIENT",
      password: "",
      telefono: user.telefono || "",
    });
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    setSavingUser(true);
    try {
      const method = editingUser ? "PATCH" : "POST";
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";

      const body: any = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        telefono: userForm.telefono || null,
      };

      if (userForm.password) {
        body.password = userForm.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando usuario");

      toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
      setUserDialogOpen(false);
      await loadUsers({ search: userSearch, role: userRoleFilter });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando usuario");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`¿Eliminar al usuario ${user.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando usuario");
      toast.success("Usuario eliminado");
      await loadUsers({ search: userSearch, role: userRoleFilter });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando usuario");
    }
  };

  const handlePaymentAction = async (id: string, action: "approve" | "reject") => {
    setBusyPaymentId(id);
    try {
      const res = await fetch(`/api/admin/bs-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      toast.success(action === "approve" ? "Pago aprobado" : "Pago rechazado");
      setPayments((prev) => prev.filter((p) => p.id !== id));
      await loadStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error procesando pago");
    } finally {
      setBusyPaymentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#40C9A9]" />
            Panel Admin
          </h1>
          <p className="text-white/70">
            Gestiona usuarios, pagos y estadísticas globales de Caletas.
          </p>
        </div>

        <Tabs defaultValue="estadisticas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-lg bg-[#354B3A] border border-white/10 p-1">
            <TabsTrigger
              value="estadisticas"
              className="rounded-md text-white data-[state=inactive]:text-white/70 data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white"
            >
              Estadísticas
            </TabsTrigger>
            <TabsTrigger
              value="usuarios"
              className="rounded-md text-white data-[state=inactive]:text-white/70 data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white"
            >
              Usuarios
            </TabsTrigger>
            <TabsTrigger
              value="pagos"
              className="rounded-md text-white data-[state=inactive]:text-white/70 data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white"
            >
              Pagos
            </TabsTrigger>
          </TabsList>

          {/* Usuarios */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#40C9A9]" />
                    Usuarios
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Administra los usuarios de la plataforma.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  onClick={handleOpenCreateUser}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nuevo usuario
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                  <div className="flex-1">
                    <Label className="text-white/80 mb-1 block">Buscar</Label>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                      <Input
                        className="pl-9 bg-[#1C2D20] border-white/20 text-white placeholder:text-white/60"
                        placeholder="Nombre o correo..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label className="text-white/80 mb-1 block">Rol</Label>
                    <Select
                      value={userRoleFilter}
                      onValueChange={(v) =>
                        setUserRoleFilter(v as Role | "ALL")
                      }
                    >
                      <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#203324] text-white border-white/10">
                        <SelectItem value="ALL">Todos</SelectItem>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white w-full md:w-auto"
                    onClick={() =>
                      void loadUsers({
                        search: userSearch,
                        role: userRoleFilter,
                      })
                    }
                  >
                    Aplicar filtros
                  </Button>
                </div>

                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="max-h-[480px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#1C2D20] text-white/70">
                        <tr>
                          <th className="px-3 py-2 text-left">Nombre</th>
                          <th className="px-3 py-2 text-left">Correo</th>
                          <th className="px-3 py-2 text-left">Rol</th>
                          <th className="px-3 py-2 text-left">Estado</th>
                          <th className="px-3 py-2 text-left">Creado</th>
                          <th className="px-3 py-2 text-right pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-4 text-center text-white/70"
                            >
                              Cargando usuarios...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-4 text-center text-white/70"
                            >
                              No se encontraron usuarios.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr
                              key={u.id}
                              className="border-t border-white/5 bg-[#203324]"
                            >
                              <td className="px-3 py-2 text-white">
                                {u.name || "-"}
                              </td>
                              <td className="px-3 py-2 text-white/80">
                                {u.email}
                              </td>
                              <td className="px-3 py-2">
                                <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-white/70">
                                    {u.isEmailVerified
                                      ? "Email verificado"
                                      : "Email no verificado"}
                                  </span>
                                  <span className="text-xs text-white/70">
                                    2FA:{" "}
                                    {u.isTwoFactorEnabled ? "activo" : "desactivado"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-white/60">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 text-right pr-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => handleOpenEditUser(u)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-300"
                                    onClick={() => void handleDeleteUser(u)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="bg-[#203324] text-white border-white/10">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar usuario" : "Nuevo usuario"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label className="text-white/80">Nombre</Label>
                    <Input
                      className="bg-[#1C2D20] border-white/20 text-white placeholder:text-white/60"
                      value={userForm.name}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/80">Correo</Label>
                    <Input
                      type="email"
                      className="bg-[#1C2D20] border-white/20 text-white placeholder:text-white/60"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/80">Teléfono (opcional)</Label>
                    <Input
                      className="bg-[#1C2D20] border-white/20 text-white placeholder:text-white/60"
                      value={userForm.telefono}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, telefono: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/80">Rol</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(v) =>
                        setUserForm((f) => ({ ...f, role: v as Role }))
                      }
                    >
                      <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#203324] text-white border-white/10">
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/80">
                      {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                    </Label>
                    <Input
                      type="password"
                      className="bg-[#1C2D20] border-white/20 text-white placeholder:text-white/60"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, password: e.target.value }))
                      }
                    />
                    {editingUser && (
                      <p className="text-xs text-white/60">
                        Si lo dejas vacío, se mantendrá la contraseña actual.
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 text-white bg-transparent hover:bg-white/10"
                    onClick={() => setUserDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    disabled={savingUser}
                    onClick={() => void handleSaveUser()}
                  >
                    {savingUser ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Pagos: un solo listado unificado */}
          <TabsContent value="pagos" className="space-y-6">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#40C9A9]" />
                  Pagos y suscripciones
                </CardTitle>
                <CardDescription className="text-white/70">
                  Listado único: usuario, tipo de suscripción, fecha de renovación, tipo de pago y monto. Los pendientes de pago móvil se pueden aprobar o rechazar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading || subscriptionsLoading ? (
                  <div className="text-white/70">Cargando...</div>
                ) : (() => {
                  const pendingRows = payments.map((p) => ({
                    kind: "pending" as const,
                    id: p.id,
                    usuario: p.user.name || "-",
                    usuarioEmail: p.user.email,
                    tipoSuscripcion: p.subscriptionType.name,
                    fechaRenovacion: null as string | null,
                    tipoPago: "Pago móvil",
                    monto: p.amountBs,
                    proofUrl: p.proofUrl,
                    reference: p.reference,
                  }));
                  const subscriptionRows = subscriptions.map((s) => ({
                    kind: "subscription" as const,
                    id: s.id,
                    usuario: s.user.name || "-",
                    usuarioEmail: s.user.email,
                    tipoSuscripcion: s.subscriptionType.name,
                    fechaRenovacion: s.stripeCurrentPeriodEnd,
                    tipoPago: s.stripePriceId === "manual" ? "Pago móvil" : "Stripe",
                    monto: s.subscriptionType.price,
                    proofUrl: null,
                    reference: null,
                  }));
                  const allRows = [...pendingRows, ...subscriptionRows];
                  if (allRows.length === 0) {
                    return (
                      <div className="text-white/60 py-8 text-center">
                        No hay pagos ni suscripciones.
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-lg border border-white/10 max-h-[520px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#1C2D20] text-white/70 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Usuario</th>
                            <th className="px-3 py-2 text-left">Tipo de suscripción</th>
                            <th className="px-3 py-2 text-left">Fecha de renovación</th>
                            <th className="px-3 py-2 text-left">Tipo de pago</th>
                            <th className="px-3 py-2 text-left">Monto</th>
                            <th className="px-3 py-2 text-right pr-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allRows.map((row) => (
                            <tr
                              key={row.kind === "pending" ? `p-${row.id}` : `s-${row.id}`}
                              className="border-t border-white/5 bg-[#203324]"
                            >
                              <td className="px-3 py-2">
                                <div className="text-white font-medium">{row.usuario}</div>
                                <div className="text-xs text-white/60">{row.usuarioEmail}</div>
                              </td>
                              <td className="px-3 py-2 text-white/80">{row.tipoSuscripcion}</td>
                              <td className="px-3 py-2 text-white/80">
                                {row.fechaRenovacion
                                  ? new Date(row.fechaRenovacion).toLocaleDateString("es", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : row.kind === "pending"
                                    ? "Pendiente"
                                    : "—"}
                              </td>
                              <td className="px-3 py-2 text-white/80">{row.tipoPago}</td>
                              <td className="px-3 py-2 text-white font-medium">Bs {row.monto}</td>
                              <td className="px-3 py-2 text-right pr-4">
                                {row.kind === "pending" ? (
                                  <div className="flex items-center justify-end gap-2">
                                    {row.proofUrl ? (
                                      <a
                                        href={row.proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#40C9A9] hover:underline text-xs inline-flex items-center gap-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Comprobante
                                      </a>
                                    ) : null}
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white h-8"
                                      disabled={busyPaymentId === row.id}
                                      onClick={() => void handlePaymentAction(row.id, "approve")}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Aprobar
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500/40 text-red-300 hover:bg-red-500/10 h-8"
                                      disabled={busyPaymentId === row.id}
                                      onClick={() => void handlePaymentAction(row.id, "reject")}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Rechazar
                                    </Button>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="estadisticas">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#40C9A9]" />
                  Estadísticas globales
                </CardTitle>
                <CardDescription className="text-white/70">
                  Resumen de la actividad y volumen de datos de la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading || !stats ? (
                  <div className="text-white/70">Cargando estadísticas...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Usuarios registrados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.users}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Universidades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.universidades}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Carreras
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.carreras}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Materias
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.materias}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Recursos compartidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.recursos}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Suscripciones activas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.subscriptions}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Pagos manuales totales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.manualPaymentsTotal}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#1C2D20] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/70">
                          Pagos manuales pendientes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">
                          {stats.manualPaymentsPending}
                        </p>
                      </CardContent>
                    </Card>

                    {aiUsage && (
                      <>
                        <Card className="bg-[#1C2D20] border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-white/70">
                              Uso de IA (peticiones)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-white">
                              {aiUsage.totalRequests.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-[#1C2D20] border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-white/70">
                              Uso de IA (tokens totales)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-white">
                              {aiUsage.totalTokens.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {storage && (
                      <>
                        <Card className="bg-[#1C2D20] border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-white/70">
                              Almacenamiento (archivos)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-white">
                              {formatBytes(storage.totalBytes)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-[#1C2D20] border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-white/70">
                              Recursos con archivo
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-white">
                              {storage.recursosConArchivo}
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {/* Gráficas */}
                {charts && (
                  <div className="mt-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-[#1C2D20] border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-base">Usuarios registrados (últimos 12 meses)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={charts.usersByMonth.map((d) => ({ ...d, mesLabel: formatMes(d.mes) }))}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="mesLabel" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#203324", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                  labelStyle={{ color: "#40C9A9" }}
                                  formatter={(value: number | undefined) => [value ?? 0, "Usuarios"]}
                                  labelFormatter={(label) => label}
                                />
                                <Bar dataKey="usuarios" fill="#40C9A9" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#1C2D20] border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-base">Recursos compartidos (últimos 12 meses)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={charts.recursosByMonth.map((d) => ({ ...d, mesLabel: formatMes(d.mes) }))}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="mesLabel" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#203324", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                  formatter={(value: number | undefined) => [value ?? 0, "Recursos"]}
                                />
                                <Line type="monotone" dataKey="recursos" stroke="#40C9A9" strokeWidth={2} dot={{ fill: "#40C9A9" }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-[#1C2D20] border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-base">Recursos por tipo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={charts.recursosByTipo}
                                layout="vertical"
                                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <YAxis type="category" dataKey="tipo" width={100} tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#203324", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                  formatter={(value: number | undefined) => [value ?? 0, "Recursos"]}
                                />
                                <Bar dataKey="count" fill="#40C9A9" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#1C2D20] border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-base">Pagos manuales por estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "Pendientes", value: charts.paymentsByStatus.PENDING, color: CHART_COLORS[1] },
                                    { name: "Aprobados", value: charts.paymentsByStatus.APPROVED, color: CHART_COLORS[0] },
                                    { name: "Rechazados", value: charts.paymentsByStatus.REJECTED, color: "#7f1d1d" },
                                  ].filter((d) => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={90}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : null)}
                                  labelLine={{ stroke: "rgba(255,255,255,0.5)" }}
                                >
                                  {[
                                    { name: "Pendientes", value: charts.paymentsByStatus.PENDING, color: CHART_COLORS[1] },
                                    { name: "Aprobados", value: charts.paymentsByStatus.APPROVED, color: CHART_COLORS[0] },
                                    { name: "Rechazados", value: charts.paymentsByStatus.REJECTED, color: "#7f1d1d" },
                                  ]
                                    .filter((d) => d.value > 0)
                                    .map((entry) => (
                                      <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#203324", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                  formatter={(value: number | undefined) => [value ?? 0, "Pagos"]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {aiUsage && aiUsage.byMonth?.length > 0 && (
                      <Card className="bg-[#1C2D20] border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-base">Consumo de IA (últimos 12 meses)</CardTitle>
                          <CardDescription className="text-white/70">
                            Peticiones y tokens por mes — referencia para administración
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={aiUsage.byMonth.map((d) => ({ ...d, mesLabel: formatMes(d.mes) }))}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="mesLabel" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#203324", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                  formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "Peticiones"]}
                                  labelFormatter={(label) => label}
                                />
                                <Bar dataKey="peticiones" fill="#40C9A9" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

