"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

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

export default function AdminPage() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bs-payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/bs-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      toast.success(action === "approve" ? "Aprobado" : "Rechazado");
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
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
          <p className="text-white/70">Revisión de pagos en Bs (pendientes)</p>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Pagos pendientes</CardTitle>
            <CardDescription className="text-white/70">
              Aprueba o rechaza. Al aprobar se activa la suscripción.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-white/70">Cargando...</div>
            ) : payments.length === 0 ? (
              <div className="text-white/60">No hay pagos pendientes.</div>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-[#1C2D20] border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-white font-semibold">
                      {p.subscriptionType.name} · Bs {p.amountBs}
                    </div>
                    <div className="text-white/70 text-sm">
                      {p.user.name} · {p.user.email}
                    </div>
                    <div className="text-white/60 text-sm">Ref: {p.reference}</div>
                    <div className="text-white/50 text-xs">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                    {p.proofUrl ? (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[#40C9A9] text-xs underline underline-offset-4 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver comprobante
                      </a>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                      PENDIENTE
                    </Badge>
                    <Button
                      type="button"
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                      disabled={busyId === p.id}
                      onClick={() => void act(p.id, "approve")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                      disabled={busyId === p.id}
                      onClick={() => void act(p.id, "reject")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

