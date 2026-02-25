"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Shield, Clock, Crown, Banknote, ReceiptText, ExternalLink, BarChart3 } from "lucide-react";
import { PagoBsDialog } from "./components/pago-bs-dialog";

type SubscriptionType = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  period: string;
};

type StatusResponse = {
  isActive: boolean;
  subscription: null | {
    subscriptionType: null | {
      id: string;
      name: string;
      price: number;
      period: string;
    };
    currentPeriodEnd: string;
  };
};

export default function SuscripcionPage() {
  const searchParams = useSearchParams();
  const [types, setTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [stripeInvoices, setStripeInvoices] = useState<any[]>([]);
  const [bsPayments, setBsPayments] = useState<any[]>([]);
  const [pagoBsDialogOpen, setPagoBsDialogOpen] = useState(false);
  const [pagoBsPlanId, setPagoBsPlanId] = useState<string>("");

  const loadHistory = async () => {
    try {
      const historyRes = await fetch("/api/subscription/history");
      if (historyRes.ok) {
        const h = await historyRes.json();
        setStripeInvoices(Array.isArray(h?.stripe?.invoices) ? h.stripe.invoices : []);
        setBsPayments(Array.isArray(h?.bs?.payments) ? h.bs.payments : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [typesRes, statusRes, historyRes] = await Promise.all([
          fetch("/api/subscription/types"),
          fetch("/api/subscription/status"),
          fetch("/api/subscription/history"),
        ]);

        if (typesRes.ok) {
          const data = await typesRes.json();
          setTypes(Array.isArray(data.types) ? data.types : []);
        }

        if (statusRes.ok) {
          setStatus((await statusRes.json()) as StatusResponse);
        }

        if (historyRes.ok) {
          const h = await historyRes.json();
          setStripeInvoices(Array.isArray(h?.stripe?.invoices) ? h.stripe.invoices : []);
          setBsPayments(Array.isArray(h?.bs?.payments) ? h.bs.payments : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    })();
  }, []);

  // Abrir diálogo de pago Bs si viene por URL (ej. desde /suscripcion/bs?plan=...)
  useEffect(() => {
    const plan = searchParams.get("pagoBs") || searchParams.get("plan");
    if (plan) {
      setPagoBsPlanId(plan);
      setPagoBsDialogOpen(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/suscripcion");
      }
    }
  }, [searchParams]);

  const currentPlan = status?.subscription?.subscriptionType?.name || null;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const periodLabel = (period: string) => {
    if (period === "day") return "día";
    if (period === "month") return "mes";
    if (period === "year") return "año";
    return period;
  };

  const sorted = useMemo(() => [...types].sort((a, b) => a.price - b.price), [types]);

  const startStripe = async (subscriptionTypeId: string) => {
    try {
      setCreating(subscriptionTypeId);
      const res = await fetch("/api/stripe-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTypeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No se pudo iniciar el pago");
      if (!data?.url) throw new Error("Stripe no devolvió URL");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error iniciando Stripe");
    } finally {
      setCreating(null);
    }
  };

  const openStripePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo abrir el portal");
      if (!data?.url) throw new Error("Stripe no devolvió URL");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error abriendo portal");
    }
  };

  const usdPaidCount = stripeInvoices.filter((i) => i.status === "paid" || i.amountPaid > 0).length;
  const usdTotal = stripeInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const bsCount = bsPayments.length;
  const bsApproved = bsPayments.filter((p) => p.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#40C9A9]" />
            Suscripción
          </h1>
          <p className="text-white/70">
            Las herramientas de IA están disponibles solo con suscripción activa.
          </p>
        </div>

        <Card className="bg-[#354B3A] border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Estado</CardTitle>
            <CardDescription className="text-white/70">
              {status?.isActive
                ? "Tienes una suscripción activa."
                : "No tienes suscripción activa."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between flex-col md:flex-row gap-3">
            <div className="text-white/80">
              {status?.isActive && currentPlan ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 text-white border border-white/10">
                    Plan: {currentPlan}
                  </Badge>
                  <Badge className="bg-white/10 text-white/80 border border-white/10">
                    Activo
                  </Badge>
                </div>
              ) : (
                <Badge className="bg-white/10 text-white/80 border border-white/10">
                  Inactivo
                </Badge>
              )}
            </div>
            <div className="text-white/60 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {status?.subscription?.currentPeriodEnd
                ? `Vence: ${new Date(status.subscription.currentPeriodEnd).toLocaleString()}`
                : "—"}
            </div>
          </CardContent>
          {status?.isActive ? (
            <CardContent className="pt-0">
              <Button
                type="button"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => void openStripePortal()}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Administrar suscripción (Stripe)
              </Button>
            </CardContent>
          ) : null}
        </Card>

        {/* Historial y estadísticas */}
        <Card className="bg-[#354B3A] border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#40C9A9]" />
              Historial y estadísticas
            </CardTitle>
            <CardDescription className="text-white/70">
              Pagos realizados en la aplicación (Stripe y Bs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyLoading ? (
              <div className="text-white/70">Cargando historial...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Pagos Stripe</div>
                    <div className="text-white font-semibold text-lg">{usdPaidCount}</div>
                    <div className="text-white/50 text-xs">
                      Total: ${(usdTotal / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Pagos Bs</div>
                    <div className="text-white font-semibold text-lg">{bsCount}</div>
                    <div className="text-white/50 text-xs">
                      Aprobados: {bsApproved}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Último pago</div>
                    <div className="text-white/80 text-sm">
                      {(() => {
                        const lastStripe = stripeInvoices[0]?.created ? new Date(stripeInvoices[0].created * 1000) : null;
                        const lastBs = bsPayments[0]?.createdAt ? new Date(bsPayments[0].createdAt) : null;
                        const last =
                          lastStripe && lastBs
                            ? (lastStripe > lastBs ? lastStripe : lastBs)
                            : lastStripe || lastBs;
                        return last ? last.toLocaleString() : "—";
                      })()}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Recibos</div>
                    <div className="text-white/80 text-sm">
                      Stripe: {stripeInvoices.length} · Bs: {bsPayments.length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-4">
                    <div className="text-white font-semibold mb-2 flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-[#40C9A9]" />
                      Stripe (facturas)
                    </div>
                    {stripeInvoices.length === 0 ? (
                      <div className="text-white/60 text-sm">Sin pagos registrados en Stripe.</div>
                    ) : (
                      <div className="space-y-2">
                        {stripeInvoices.slice(0, 8).map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-start justify-between gap-3 border border-white/10 rounded-lg p-3"
                          >
                            <div className="min-w-0">
                              <div className="text-white/80 text-sm">
                                {new Date(inv.created * 1000).toLocaleString()}
                              </div>
                              <div className="text-white/60 text-xs">
                                Estado: {inv.status || "—"} · ${(inv.amountPaid / 100).toFixed(2)} {String(inv.currency || "usd").toUpperCase()}
                              </div>
                            </div>
                            {inv.hostedInvoiceUrl ? (
                              <a
                                href={inv.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#40C9A9] text-xs underline underline-offset-4 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Ver
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-[#1C2D20] border border-white/10 p-4">
                    <div className="text-white font-semibold mb-2 flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-[#40C9A9]" />
                      Bs (verificación)
                    </div>
                    {bsPayments.length === 0 ? (
                      <div className="text-white/60 text-sm">Sin comprobantes enviados.</div>
                    ) : (
                      <div className="space-y-2">
                        {bsPayments.slice(0, 8).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-start justify-between gap-3 border border-white/10 rounded-lg p-3"
                          >
                            <div className="min-w-0">
                              <div className="text-white/80 text-sm">
                                {new Date(p.createdAt).toLocaleString()}
                              </div>
                              <div className="text-white/60 text-xs">
                                {p.plan?.name || "Plan"} · Bs {p.amountBs} · {p.status}
                              </div>
                              <div className="text-white/50 text-xs">Ref: {p.reference}</div>
                            </div>
                            {p.proofUrl ? (
                              <a
                                href={p.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#40C9A9] text-xs underline underline-offset-4 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Ver
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <Card className="bg-[#354B3A] border-white/10">
              <CardContent className="p-6 text-white/70">Cargando planes...</CardContent>
            </Card>
          ) : (
            sorted.map((t) => {
              const isPro = t.name.toLowerCase().includes("pro");
              return (
                <Card key={t.id} className="bg-[#354B3A] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isPro ? (
                        <Crown className="w-5 h-5 text-[#40C9A9]" />
                      ) : (
                        <Shield className="w-5 h-5 text-[#40C9A9]" />
                      )}
                      {t.name}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {t.description || "Acceso a herramientas de IA"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-special text-white">
                        {formatPrice(t.price)}
                      </div>
                      <div className="text-white/60">/ {periodLabel(t.period)}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        type="button"
                        className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                        disabled={creating === t.id}
                        onClick={() => void startStripe(t.id)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar con Stripe (tarjeta)
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 justify-between"
                        onClick={() => toast.info("PayPal estará disponible próximamente")}
                      >
                        <span>PayPal</span>
                        <Badge className="bg-white/10 text-white/80 border border-white/10">
                          Próximamente
                        </Badge>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 justify-between"
                        onClick={() => toast.info("USDT estará disponible próximamente")}
                      >
                        <span>USDT</span>
                        <Badge className="bg-white/10 text-white/80 border border-white/10">
                          Próximamente
                        </Badge>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => {
                          setPagoBsPlanId(t.id);
                          setPagoBsDialogOpen(true);
                        }}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Pagar en Bs (pago móvil)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <PagoBsDialog
        open={pagoBsDialogOpen}
        onOpenChange={setPagoBsDialogOpen}
        initialPlanId={pagoBsPlanId}
        types={types}
        onSuccess={loadHistory}
      />
    </div>
  );
}

