"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, MoreHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ManualPayment = {
  id: string;
  source: "MOBILE_BS" | "CARD";
  amountBs: number | null;
  amountUsdCents: number | null;
  reference: string | null;
  operationCode: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  paidAt: string | null;
  periodEnd: string | null;
  rejectionReason: string | null;
  proofUrl?: string | null;
  user: { name: string; email: string };
  subscriptionType: { name: string; price?: number };
};

export default function AdminPagosPage() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");

  const loadData = async (opts?: { search?: string; reference?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts?.search?.trim()) params.set("search", opts.search.trim());
      if (opts?.reference?.trim()) params.set("reference", opts.reference.trim());
      const paymentsRes = await fetch(`/api/admin/bs-payments?${params.toString()}`);
      const paymentsData = await paymentsRes.json();
      if (!paymentsRes.ok) throw new Error(paymentsData?.error || "No autorizado");
      setPayments(Array.isArray(paymentsData.payments) ? paymentsData.payments : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handlePaymentAction = async (
    id: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ) => {
    setBusyPaymentId(id);
    try {
      const res = await fetch(`/api/admin/bs-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error procesando pago");
      toast.success(action === "approve" ? "Pago aprobado" : "Pago rechazado");
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: action === "approve" ? "APPROVED" : "REJECTED" } : p,
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error procesando pago");
    } finally {
      setBusyPaymentId(null);
    }
  };

  const rows = payments.map((p) => ({
    id: p.id,
    usuario: p.user.name || "-",
    email: p.user.email,
    plan: p.subscriptionType.name,
    fecha: new Date(p.createdAt).toLocaleDateString(),
    tipoPago: p.source === "CARD" ? "Tarjeta" : "Pago móvil",
    montoBs: p.amountBs ?? 0,
    montoUsd: ((p.amountUsdCents ?? p.subscriptionType.price ?? 0) / 100).toFixed(2),
    status: p.status,
    proofUrl: p.proofUrl || null,
    referencia: p.reference || "—",
    operacion: p.operationCode || "—",
    reason: p.rejectionReason || null,
  }));

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro de pago?")) return;
    setBusyPaymentId(id);
    try {
      const res = await fetch(`/api/admin/bs-payments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando pago");
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("Pago eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando pago");
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleRejectWithReason = async (id: string) => {
    const reason = window.prompt("Indica el motivo del rechazo para notificar al usuario:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Debes escribir un motivo de rechazo");
      return;
    }
    await handlePaymentAction(id, "reject", reason.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#40C9A9]" />
            Panel Admin - Pagos
          </h1>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#40C9A9]" />
              Pagos y suscripciones
            </CardTitle>
            <CardDescription className="text-white/70">
              Control de pagos móviles con historial completo y acciones administrativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario o correo..."
                className="rounded-lg bg-[#1C2D20] border border-white/10 text-white px-3 py-2 placeholder:text-white/50"
              />
              <input
                value={referenceSearch}
                onChange={(e) => setReferenceSearch(e.target.value)}
                placeholder="Referencia bancaria o código operación..."
                className="rounded-lg bg-[#1C2D20] border border-white/10 text-white px-3 py-2 placeholder:text-white/50"
              />
              <Button
                type="button"
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                onClick={() => void loadData({ search, reference: referenceSearch })}
              >
                Buscar
              </Button>
            </div>

            {loading ? (
              <div className="text-white/70">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="text-white/60 py-8 text-center">No hay pagos registrados.</div>
            ) : (
              <div className="rounded-lg border border-white/10 max-h-[560px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1C2D20] text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Plan</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Monto</th>
                      <th className="px-3 py-2 text-left">Referencia / Operación</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-white/5 bg-[#203324]">
                        <td className="px-3 py-2">
                          <div className="text-white">{row.usuario}</div>
                          <div className="text-xs text-white/60">{row.email}</div>
                        </td>
                        <td className="px-3 py-2 text-white/80">{row.plan}</td>
                        <td className="px-3 py-2 text-white/80">{row.fecha}</td>
                        <td className="px-3 py-2 text-white/80">{row.tipoPago}</td>
                        <td className="px-3 py-2 text-white">{`Bs ${row.montoBs.toLocaleString()} / $${row.montoUsd}`}</td>
                        <td className="px-3 py-2 text-white/80 text-xs">
                          <div>Ref: {row.referencia}</div>
                          <div>Op: {row.operacion}</div>
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "PENDING" ? (
                            <Badge className="bg-white/10 text-white/80 border-white/20">Pendiente</Badge>
                          ) : row.status === "APPROVED" ? (
                            <Badge className="bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30">Aprobado</Badge>
                          ) : row.status === "REJECTED" ? (
                            <div className="space-y-1">
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Rechazado</Badge>
                              {row.reason ? <p className="text-[11px] text-red-200/80 max-w-[180px]">{row.reason}</p> : null}
                            </div>
                          ) : row.status === "EXPIRED" ? (
                            <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">Vencido</Badge>
                          ) : (
                            <span className="text-white/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10"
                                disabled={busyPaymentId === row.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#203324] border-white/10 text-white">
                              {row.proofUrl ? (
                                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                                  <a href={row.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-[#40C9A9]" />
                                    Ver comprobante
                                  </a>
                                </DropdownMenuItem>
                              ) : null}
                              {row.status === "PENDING" && row.tipoPago === "Pago móvil" ? (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer hover:bg-white/10"
                                    onClick={() => void handlePaymentAction(row.id, "approve")}
                                  >
                                    Aprobar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-300 hover:bg-red-500/10"
                                    onClick={() => void handleRejectWithReason(row.id)}
                                  >
                                    Rechazar (con motivo)
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              <DropdownMenuItem
                                className="cursor-pointer text-red-300 hover:bg-red-500/10"
                                onClick={() => void handleDelete(row.id)}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}
