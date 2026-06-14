"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Shield, Clock, Crown, Banknote, ReceiptText, ExternalLink, BarChart3 } from "lucide-react";
import { PagoBsDialog } from "./components/pago-bs-dialog";
import { ReferralPanel } from "@/components/referral-panel";
import { studentToPublicPriceCents, STUDENT_DISCOUNT_FROM_GENERAL } from "@/lib/subscription-display-pricing";

type SubscriptionType = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  period: string;
  billingKind?: string;
  minWalletTopUpCents?: number;
  includedIaTokensPerPeriod?: number | null;
  iaTokenOverflowPolicy?: string | null;
};

type IaTransparencyPayload = {
  gatewayDocs?: { pricing: string; models: string };
  catalog: Array<{
    id: string;
    featureKey: string;
    displayNameEs: string;
    descriptionEs?: string | null;
    vercelPricingUrl: string;
    listInputUsdPer1M?: number | null;
    listOutputUsdPer1M?: number | null;
    freeInTrial: boolean;
    meteredAfterTrial: boolean;
  }>;
  plans: Array<{
    id: string;
    name: string;
    billingKind: string;
    minWalletTopUpCents: number;
    iaAccessRules: Array<{
      accessKind: string;
      notesEs?: string | null;
      catalog: {
        featureKey: string;
        displayNameEs: string;
        freeInTrial: boolean;
      };
    }>;
  }>;
  policy?: {
    platformMarginOnList: number;
    studentDiscountFromGeneralPercent: number;
    generalReferenceVsStudentMultiplier: number;
    recommendedStudentTopUpsUsd: number[];
    recommendedPublicTopUpsUsd: number[];
    rationaleEs: string;
  };
  gatewayModelPrices?: Array<{
    modelId: string;
    inputUsdPer1M: number | null;
    outputUsdPer1M: number | null;
    isGatewayListedFree?: boolean;
    listPriceMissing?: boolean;
    notes?: string;
  }>;
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
  const [iaTransparency, setIaTransparency] = useState<IaTransparencyPayload | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscription/ia-transparency");
        if (!res.ok) return;
        const data = (await res.json()) as IaTransparencyPayload;
        if (!cancelled) setIaTransparency(data);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Abrir diálogo de pago Bs si viene por URL (ej. desde /suscripcion/bs?plan=...)
  useEffect(() => {
    const plan = searchParams?.get("pagoBs") || searchParams?.get("plan");
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
    if (period === "consumption") return "consumo (billetera)";
    if (period === "day") return "día";
    if (period === "month") return "mes";
    if (period === "year") return "año";
    return period;
  };

  const accessKindLabel = (kind: string) => {
    if (kind === "included") return "Incluido en plan";
    if (kind === "consumption") return "Por consumo (billetera)";
    if (kind === "blocked") return "No disponible";
    return kind;
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
      if (!data?.url) throw new Error("Tarjeta no devolvió URL");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error iniciando pago con tarjeta");
    } finally {
      setCreating(null);
    }
  };

  const openStripePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo abrir el portal");
      if (!data?.url) throw new Error("Tarjeta no devolvió URL");
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
            <Shield className="w-6 h-6 text-[var(--accent-hex)]" />
            Suscripción
          </h1>
          <p className="text-white/70">
            Puedes usar la IA con un plan mensual o con el saldo{" "}
            <span className="text-white/90 font-medium">en tu billetera</span> (plan CALETA BASICS). La tarifa{" "}
            <span className="text-white/90 font-medium">estudiantil</span> (tiene aplicado un {" "}
            <span className="text-white/90 font-medium">
              {Math.round(STUDENT_DISCOUNT_FROM_GENERAL * 100)}% de descuento
            </span>{" "}
            ); el plan BASICS se recarga desde Billetera
            (mín. $1 USD).
          </p>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
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
                Administrar suscripción (Tarjeta)
              </Button>
            </CardContent>
          ) : null}
        </Card>

        <ReferralPanel />

        {/* Historial y estadísticas */}
        <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent-hex)]" />
              Historial y estadísticas
            </CardTitle>
            <CardDescription className="text-white/70">
              Pagos realizados en la aplicación (Tarjeta y Bs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyLoading ? (
              <div className="text-white/70">Cargando historial...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Pagos con tarjeta</div>
                    <div className="text-white font-semibold text-lg">{usdPaidCount}</div>
                    <div className="text-white/50 text-xs">
                      Total: ${(usdTotal / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Pagos Bs</div>
                    <div className="text-white font-semibold text-lg">{bsCount}</div>
                    <div className="text-white/50 text-xs">
                      Aprobados: {bsApproved}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-3">
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
                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-3">
                    <div className="text-white/60 text-xs">Recibos</div>
                    <div className="text-white/80 text-sm">
                      Tarjeta: {stripeInvoices.length} · Bs: {bsPayments.length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-4">
                    <div className="text-white font-semibold mb-2 flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-[var(--accent-hex)]" />
                      Tarjeta (facturas)
                    </div>
                    {stripeInvoices.length === 0 ? (
                      <div className="text-white/60 text-sm">Sin pagos registrados con tarjeta.</div>
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
                                className="text-[var(--accent-hex)] text-xs underline underline-offset-4 inline-flex items-center gap-1"
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

                  <div className="rounded-lg bg-[var(--mygreen-dark)] border border-white/10 p-4">
                    <div className="text-white font-semibold mb-2 flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-[var(--accent-hex)]" />
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
                                className="text-[var(--accent-hex)] text-xs underline underline-offset-4 inline-flex items-center gap-1"
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

        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
            <p className="font-medium text-white mb-1">Cómo se cobra la IA en los planes</p>
            <ul className="list-disc pl-5 space-y-1 text-white/75">
              <li>
                <span className="text-white/90">CALETA BASICS</span>:{" "}
                <strong className="text-white/90">misma billetera</strong> que el resto de herramientas IA; plan por{" "}
                <strong className="text-white/90">consumo</strong> (tokens reales + margen).{" "}
                <strong className="text-white/90">Recarga mínima 1 USD</strong>. No hay cobro recurrente en Stripe para
                este plan: ve a <Link href="/billetera" className="text-[var(--accent-hex)] underline">Billetera</Link>.
              </li>
              <li>
                <span className="text-white/90">CALETA IA TOOLS</span> y{" "}
                <span className="text-white/90">CALETA PRO</span>: cuota fija en Stripe cada{" "}
                <strong className="text-white/90">mes</strong>; el consumo adicional puede ir por billetera cuando
                aplica.
              </li>
            </ul>
            <p className="mt-2 text-xs text-white/55">
              Configuración en BD: script{" "}
              <code className="rounded bg-white/10 px-1">ensure-subscription-types</code> y catálogo/reglas con{" "}
              <code className="rounded bg-white/10 px-1">seed-ia-catalog-and-rules.js</code>.
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            El pago en Bs (pago móvil) es el método más lento de verificación y puede tardar hasta 24
            horas. Si necesitas validación más rápida, comunícate con soporte al 0414-5005456.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <Card className="bg-[var(--mygreen-light)] border-white/10">
              <CardContent className="p-6 text-white/70">Cargando planes...</CardContent>
            </Card>
          ) : (
            sorted.map((t) => {
              const isPro = t.name.toLowerCase().includes("pro");
              const walletOnly = t.billingKind === "wallet_consumption";
              const minCents = t.minWalletTopUpCents ?? 100;
              const displayStudentCents = walletOnly ? minCents : t.price;
              const displayPublicCents = walletOnly
                ? studentToPublicPriceCents(minCents)
                : studentToPublicPriceCents(t.price);
              return (
                <Card key={t.id} className="bg-[var(--mygreen-light)] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isPro ? (
                        <Crown className="w-5 h-5 text-[var(--accent-hex)]" />
                      ) : (
                        <Shield className="w-5 h-5 text-[var(--accent-hex)]" />
                      )}
                      {t.name}
                      {walletOnly ? (
                        <Badge className="bg-amber-500/20 text-amber-100 border border-amber-400/30">
                          Solo billetera
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {t.description || "Acceso a herramientas de IA"}
                    </CardDescription>
                    {!walletOnly ? (
                      <p className="text-xs text-white/55 -mt-1">
                        El monto de checkout es la tarifa estudiantil (columna verde): equivale a{" "}
                        <span className="text-white/75">~40% menos</span> que el precio de referencia general de la
                        columna gris (referencia ≈ tarifa estudiantil ÷ 0,6).
                      </p>
                    ) : (
                      <p className="text-xs text-white/55 -mt-1">
                        La columna gris es solo referencia sobre el mínimo de recarga; el consumo real lo pagás desde
                        la billetera.
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-emerald-400/25 bg-emerald-950/30 p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-emerald-200/90">
                          Estudiantes (UNEXPO / universidad)
                        </div>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl font-special text-white">
                            {formatPrice(displayStudentCents)}
                          </span>
                          <span className="text-white/60 text-sm">/ {periodLabel(t.period)}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/55">
                          {walletOnly
                            ? "Recarga mínima en billetera (consumo unificado)."
                            : "Tarifa aplicada al pagar con checkout estudiantil."}
                          {typeof t.includedIaTokensPerPeriod === "number" && t.includedIaTokensPerPeriod > 0 ? (
                            <>
                              {" "}
                              <span className="text-emerald-200/90">
                                Cupo IA incluido: {t.includedIaTokensPerPeriod.toLocaleString("es-VE")} tokens/mes
                                (prompt+completion).
                              </span>
                              {t.iaTokenOverflowPolicy === "block" ? (
                                <span className="block text-amber-200/90 mt-0.5">
                                  Si se agotan: no se puede seguir con IA de pago hasta la renovación (sin billetera).
                                </span>
                              ) : (
                                <span className="block text-white/50 mt-0.5">
                                  Si se agotan: puedes seguir con saldo en Billetera (mismo consumo por uso).
                                </span>
                              )}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-white/70">
                          Referencia general
                        </div>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl font-special text-white/90">
                            {formatPrice(displayPublicCents)}
                          </span>
                          <span className="text-white/50 text-sm">/ {periodLabel(t.period)}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">
                          {walletOnly
                            ? "Referencia sobre la recarga mínima (no aplica checkout Stripe)."
                            : "Solo comparación; no es lo que cobra Stripe. Pagás la tarifa estudiantil (~40% menos)."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {walletOnly ? (
                        <>
                          <Button
                            type="button"
                            asChild
                            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
                          >
                            <Link href="/billetera">Ir a billetera (mín. $1 USD)</Link>
                          </Button>
                          <p className="text-xs text-white/55">
                            El mismo saldo cuenta para chat, resúmenes, fichas, cuestionario y cronograma IA. Los pagos
                            recurrentes con tarjeta no aplican a BASICS.
                          </p>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
                            disabled={creating === t.id}
                            onClick={() => void startStripe(t.id)}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pagar con tarjeta
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 justify-between"
                            disabled={creating === t.id}
                            onClick={() => void startStripe(t.id)}
                          >
                            <span>PayPal</span>
                            <Badge className="bg-white/10 text-white/80 border border-white/10">
                              En checkout
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
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {iaTransparency?.catalog?.length && iaTransparency.plans?.length ? (
          <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Uso de IA por plan (referencia)</CardTitle>
              <CardDescription className="text-white/70">
                Precios de lista por millón de tokens son orientativos (OpenAI vía{" "}
                <a
                  href={iaTransparency.gatewayDocs?.pricing ?? "https://vercel.com/docs/ai-gateway/pricing"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-hex)] underline underline-offset-2"
                >
                  Vercel AI Gateway
                </a>
                ). El cobro real depende del modelo elegido y del uso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm text-white/90">
                <thead>
                  <tr className="border-b border-white/15 text-white/60">
                    <th className="py-2 pr-3 font-medium">Función</th>
                    <th className="py-2 pr-3 font-medium">Lista (USD/1M in · out)</th>
                    <th className="py-2 pr-3 font-medium">Gratis en prueba</th>
                    {iaTransparency.plans.map((p) => (
                      <th key={p.id} className="py-2 pr-2 font-medium whitespace-nowrap">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {iaTransparency.catalog.map((feat) => (
                    <tr key={feat.featureKey} className="border-b border-white/10">
                      <td className="py-2 pr-3 align-top">
                        <div className="font-medium text-white">{feat.displayNameEs}</div>
                        {feat.descriptionEs ? (
                          <div className="text-xs text-white/55">{feat.descriptionEs}</div>
                        ) : null}
                        <a
                          href={feat.vercelPricingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--accent-hex)] underline underline-offset-2"
                        >
                          Doc / modelos <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-2 pr-3 align-top text-white/75 whitespace-nowrap">
                        {feat.listInputUsdPer1M != null && feat.listOutputUsdPer1M != null
                          ? `${feat.listInputUsdPer1M} · ${feat.listOutputUsdPer1M}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 align-top text-white/75">
                        {feat.freeInTrial ? "Sí (límite)" : "No"}
                      </td>
                      {iaTransparency.plans.map((plan) => {
                        const r = plan.iaAccessRules.find((x) => x.catalog.featureKey === feat.featureKey);
                        return (
                          <td key={`${plan.id}-${feat.featureKey}`} className="py-2 pr-2 align-top text-white/80">
                            {r ? (
                              <>
                                <div>{accessKindLabel(r.accessKind)}</div>
                                {r.notesEs ? (
                                  <div className="text-xs text-white/50 mt-0.5">{r.notesEs}</div>
                                ) : null}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {iaTransparency.policy ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/70 space-y-2">
                  <p>
                    <span className="text-white/85 font-medium">Política recomendada:</span> margen sobre precio de
                    lista ~{(iaTransparency.policy.platformMarginOnList * 100 - 100).toFixed(0)}% · la tarifa
                    estudiantil en recargas sugeridas es ~{iaTransparency.policy.studentDiscountFromGeneralPercent}%
                    menor que el precio de referencia general (referencia ≈ estudiante ÷ 0,6).
                  </p>
                  <p>
                    Recargas sugeridas (estudiantes):{" "}
                    {iaTransparency.policy.recommendedStudentTopUpsUsd.map((u) => `$${u}`).join(", ")} USD ·
                    referencia general:{" "}
                    {iaTransparency.policy.recommendedPublicTopUpsUsd.map((u) => `$${u.toFixed(2)}`).join(", ")} USD.
                  </p>
                  <p className="text-white/60">{iaTransparency.policy.rationaleEs}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {iaTransparency?.gatewayModelPrices?.length ? (
          <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Modelos (Vercel AI Gateway)</CardTitle>
              <CardDescription className="text-white/70">
                Lista sincronizada desde el JSON público{" "}
                <span className="font-mono text-white/85">ai-gateway.vercel.sh/v1/models</span> (modelos{" "}
                <span className="text-white/85">language</span>); precios input/output en USD por 1M tokens cuando el
                catálogo los publica. Los que marcan <span className="text-white/85">Gratis (listado)</span> tienen
                precio 0 en ese JSON; <span className="text-white/85">Sin tarifa listada</span> indica que el JSON no
                trae filas de precio (no es lo mismo que gratis). Referencia:{" "}
                <a
                  href={iaTransparency.gatewayDocs?.models ?? "https://vercel.com/ai-gateway/models"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-hex)] underline underline-offset-2"
                >
                  vercel.com/ai-gateway/models
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[min(70vh,520px)] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm text-white/90">
                <thead>
                  <tr className="border-b border-white/15 text-white/60">
                    <th className="py-2 pr-3 font-medium">Model</th>
                    <th className="py-2 pr-3 font-medium">Input USD/1M</th>
                    <th className="py-2 pr-3 font-medium">Output USD/1M</th>
                    <th className="py-2 pr-3 font-medium">Catálogo</th>
                  </tr>
                </thead>
                <tbody>
                  {iaTransparency.gatewayModelPrices.map((row) => (
                    <tr key={row.modelId} className="border-b border-white/10">
                      <td className="py-2 pr-3 font-mono text-white/90">{row.modelId}</td>
                      <td className="py-2 pr-3 text-white/80">
                        {row.isGatewayListedFree ? (
                          <span className="text-sky-200">0</span>
                        ) : row.inputUsdPer1M != null ? (
                          row.inputUsdPer1M
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-3 text-white/80">
                        {row.isGatewayListedFree ? (
                          <span className="text-sky-200">0</span>
                        ) : row.outputUsdPer1M != null ? (
                          row.outputUsdPer1M
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-3 text-white/80 align-top">
                        {row.isGatewayListedFree ? (
                          <Badge
                            variant="outline"
                            className="border-sky-500/45 bg-sky-950/40 text-sky-100 text-[10px] font-normal"
                          >
                            Gratis (listado)
                          </Badge>
                        ) : row.listPriceMissing ? (
                          <Badge variant="outline" className="border-white/20 bg-white/5 text-white/70 text-[10px] font-normal">
                            Sin tarifa listada
                          </Badge>
                        ) : (
                          <span className="text-white/45">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}
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

