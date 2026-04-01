"use client";

import { useEffect, useState } from "react";
import { Edit, PlusCircle, Search as SearchIcon, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const ROLES = ["CLIENT", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<Role | "ALL">("ALL");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "CLIENT" as Role,
    password: "",
    telefono: "",
  });

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

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) return toast.error("Nombre y correo son obligatorios");
    setSavingUser(true);
    try {
      const method = editingUser ? "PATCH" : "POST";
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const body: Record<string, string | null> = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        telefono: userForm.telefono || null,
      };
      if (userForm.password) body.password = userForm.password;
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

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#40C9A9]" />
            Panel Admin - Usuarios
          </h1>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#40C9A9]" />
                Usuarios
              </CardTitle>
              <CardDescription className="text-white/70">Administra usuarios de la plataforma.</CardDescription>
            </div>
            <Button
              type="button"
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
              onClick={() => {
                setEditingUser(null);
                setUserForm({ name: "", email: "", role: "CLIENT", password: "", telefono: "" });
                setUserDialogOpen(true);
              }}
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
                <Select value={userRoleFilter} onValueChange={(v) => setUserRoleFilter(v as Role | "ALL")}>
                  <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#203324] text-white border-white/10">
                    <SelectItem value="ALL">Todos</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                onClick={() => void loadUsers({ search: userSearch, role: userRoleFilter })}
              >
                Aplicar filtros
              </Button>
            </div>

            <div className="rounded-lg border border-white/10 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1C2D20] text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Correo</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-white/70">Cargando usuarios...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-white/70">No se encontraron usuarios.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-t border-white/5 bg-[#203324]">
                        <td className="px-3 py-2 text-white">{u.name || "-"}</td>
                        <td className="px-3 py-2 text-white/80">{u.email}</td>
                        <td className="px-3 py-2"><Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">{u.role}</Badge></td>
                        <td className="px-3 py-2 text-xs text-white/70">
                          {u.isEmailVerified ? "Email verificado" : "Email no verificado"} - 2FA: {u.isTwoFactorEnabled ? "activo" : "desactivado"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 border-white/20 bg-transparent text-white hover:bg-white/10"
                              onClick={() => {
                                setEditingUser(u);
                                setUserForm({
                                  name: u.name || "",
                                  email: u.email,
                                  role: (u.role as Role) || "CLIENT",
                                  password: "",
                                  telefono: u.telefono || "",
                                });
                                setUserDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10"
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="bg-[#203324] text-white border-white/10">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/80">Nombre</Label><Input className="bg-[#1C2D20] border-white/20 text-white" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-white/80">Correo</Label><Input className="bg-[#1C2D20] border-white/20 text-white" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-white/80">Teléfono</Label><Input className="bg-[#1C2D20] border-white/20 text-white" value={userForm.telefono} onChange={(e) => setUserForm((f) => ({ ...f, telefono: e.target.value }))} /></div>
            <div>
              <Label className="text-white/80">Rol</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm((f) => ({ ...f, role: v as Role }))}>
                <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#203324] text-white border-white/10">
                  {ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/80">{editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}</Label><Input type="password" className="bg-[#1C2D20] border-white/20 text-white" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button type="button" className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" disabled={savingUser} onClick={() => void handleSaveUser()}>
              {savingUser ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
