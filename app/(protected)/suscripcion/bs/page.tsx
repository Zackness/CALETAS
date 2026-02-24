"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Clock, XCircle } from "lucide-react";

type SubscriptionType = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  period: string;
};

type ManualPayment = {
  id: string;
  amountBs: number;
  reference: string;
  proofUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  subscriptionType: SubscriptionType;
};

export default function SuscripcionBsPage() {
  const searchParams = useSearchParams();
  const [types, setTypes] = useState<SubscriptionType[]>([]);
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [planId, setPlanId] = useState("");
  const [amountBs, setAmountBs] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan) setPlanId(plan);
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [typesRes, payRes] = await Promise.all([
          fetch("/api/subscription/types"),
          fetch("/api/payments/bs"),
        ]);

        if (typesRes.ok) {
          const data = await typesRes.json();
          setTypes(Array.isArray(data.types) ? data.types : []);
        }

        if (payRes.ok) {
          const data = await payRes.json();
          setPayments(Array.isArray(data.payments) ? data.payments : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedPlan = useMemo(
    () => types.find((t) => t.id === planId) || null,
    [types, planId],
  );

  const badgeFor = (status: ManualPayment["status"]) => {
    if (status === "APPROVED") return { text: "Aprobado", cls: "text-green-400 bg-green-500/10 border-green-500/20", icon: <CheckCircle2 className="w-4 h-4" /> };
    if (status === "REJECTED") return { text: "Rechazado", cls: "text-red-400 bg-red-500/10 border-red-500/20", icon: <XCircle className="w-4 h-4" /> };
    return { text: "Pendiente", cls: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20", icon: <Clock className="w-4 h-4" /> };
  };

  const submit = async () => {
    if (!planId || !amountBs || !reference.trim()) {
      toast.error("Completa plan, monto en Bs y referencia");
      return;
    }

    const amount = Number(amountBs);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Monto inválido");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments/bs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTypeId: planId,
          amountBs: amount,
          reference: reference.trim(),
          proofUrl: proofUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar");

      toast.success("Comprobante enviado. Queda pendiente de aprobación.");
      setPayments((prev) => [data.payment, ...prev]);
      setReference("");
      setProofUrl("");
      setAmountBs("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#40C9A9]" />
            Pago en Bs (verificación)
          </h1>
          <p className="text-white/70">
            Envía tu comprobante. Un administrador lo revisará y activará tu suscripción.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Enviar comprobante</CardTitle>
              <CardDescription className="text-white/70">
                Plan seleccionado:{" "}
                {selectedPlan ? (
                  <span className="text-[#40C9A9] font-semibold">{selectedPlan.name}</span>
                ) : (
                  <span className="text-white/60">elige un plan</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Plan</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-lg bg-[#1C2D20] border border-white/10 text-white px-3 py-2"
                  disabled={loading || submitting}
                >
                  <option value="">Selecciona un plan</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Monto en Bs</label>
                <Input
                  value={amountBs}
                  onChange={(e) => setAmountBs(e.target.value)}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Ej: 200"
                  disabled={loading || submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Referencia / ID de pago</label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Ej: 123456789"
                  disabled={loading || submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">URL del comprobante (opcional)</label>
                <Input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="bg-[#1C2D20] border-white/10 text-white"
                  placeholder="Link a imagen/pdf (Drive, etc.)"
                  disabled={loading || submitting}
                />
              </div>

              <Button
                type="button"
                className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                disabled={loading || submitting}
                onClick={() => void submit()}
              >
                Enviar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Mis comprobantes</CardTitle>
              <CardDescription className="text-white/70">
                Estado de tus solicitudes de verificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-white/60 text-sm">Aún no has enviado comprobantes.</div>
              ) : (
                payments.map((p) => {
                  const b = badgeFor(p.status);
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg bg-[#1C2D20] border border-white/10 p-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{p.subscriptionType.name}</div>
                        <div className="text-white/70 text-sm">
                          Bs {p.amountBs} · Ref: {p.reference}
                        </div>
                        <div className="text-white/50 text-xs">
                          {new Date(p.createdAt).toLocaleString()}
                        </div>
                        {p.proofUrl ? (
                          <a
                            href={p.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#40C9A9] text-xs underline underline-offset-4"
                          >
                            Ver comprobante
                          </a>
                        ) : null}
                      </div>
                      <Badge className={`border ${b.cls} flex items-center gap-1`}>
                        {b.icon}
                        {b.text}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

