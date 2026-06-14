"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Banknote, Loader2 } from "lucide-react";
import Link from "next/link";
import { studentToPublicPriceCents } from "@/lib/subscription-display-pricing";

type SubscriptionType = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  period: string;
  billingKind?: string;
  minWalletTopUpCents?: number;
};

type PagoBsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlanId?: string;
  types: SubscriptionType[];
  onSuccess?: () => void;
};

export function PagoBsDialog({
  open,
  onOpenChange,
  initialPlanId = "",
  types,
  onSuccess,
}: PagoBsDialogProps) {
  const [referenceLast4, setReferenceLast4] = useState("");
  const [bank, setBank] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [bcvLoading, setBcvLoading] = useState(false);
  const [bcvError, setBcvError] = useState(false);

  const selectedPlan = types.find((t) => t.id === initialPlanId) ?? null;
  const walletOnly = selectedPlan?.billingKind === "wallet_consumption";
  const studentCents = walletOnly
    ? selectedPlan?.minWalletTopUpCents ?? 100
    : selectedPlan?.price ?? 0;

  // Precio estudiantil en USD: en BD está en centavos
  const priceUsd = selectedPlan ? studentCents / 100 : 0;
  const publicUsd = selectedPlan != null ? studentToPublicPriceCents(studentCents) / 100 : 0;
  const montoBs = !walletOnly && bcvRate != null && selectedPlan ? Math.round(priceUsd * bcvRate) : null;

  useEffect(() => {
    if (open && initialPlanId) {
      setReferenceLast4("");
      setBank("");
      setBcvError(false);
      setBcvRate(null);
      setBcvLoading(true);
      fetch("/api/bcv/rate")
        .then((res) => res.json())
        .then((data) => {
          if (data.rate != null && Number.isFinite(data.rate)) {
            setBcvRate(Number(data.rate));
          } else {
            setBcvError(true);
          }
        })
        .catch(() => setBcvError(true))
        .finally(() => setBcvLoading(false));
    }
  }, [open, initialPlanId]);

  const submit = async () => {
    if (walletOnly) {
      toast.error("CALETA BASICS es solo billetera. Recarga en Billetera (mín. $1 USD) o por soporte.");
      return;
    }
    const last4 = referenceLast4.trim().replace(/\D/g, "").slice(-4);
    if (last4.length !== 4) {
      toast.error("Indica los últimos 4 dígitos de la referencia");
      return;
    }
    if (!bank.trim()) {
      toast.error("Indica el banco");
      return;
    }
    if (montoBs == null || montoBs <= 0) {
      toast.error("No se pudo calcular el monto. Revisa la tasa BCV.");
      return;
    }

    const reference = `${last4} - ${bank.trim()}`;

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments/bs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTypeId: initialPlanId,
          amountBs: montoBs,
          reference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar");

      toast.success("Comprobante enviado. Queda pendiente de aprobación.");
      setReferenceLast4("");
      setBank("");
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--mygreen-light)] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Banknote className="w-5 h-5 text-[var(--accent-hex)]" />
            Pago en Bs (pago móvil)
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Envía los datos del pago. Un administrador lo revisará y activará tu suscripción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Este método es el más lento y puede tardar hasta 24h en verificarse.
            Si necesitas validación más rápida, comunícate con soporte al 0414-5005456.
          </div>

          {walletOnly && selectedPlan ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-950/40 px-3 py-3 text-sm text-amber-100">
              Este plan no se paga por pago móvil como suscripción mensual: usa la{" "}
              <Link href="/billetera" className="font-medium text-[var(--accent-hex)] underline underline-offset-2">
                billetera IA
              </Link>{" "}
              (recarga mínima ${((selectedPlan.minWalletTopUpCents ?? 100) / 100).toFixed(2)} USD).
            </div>
          ) : null}

          {!walletOnly ? (
            <>
          <div className="space-y-2">
            <Label className="text-white/80">Plan</Label>
            <Input
              value={selectedPlan ? selectedPlan.name : "—"}
              readOnly
              disabled
              className="bg-[var(--mygreen-dark)] border-white/10 text-white/90 cursor-not-allowed"
            />
          </div>

          {selectedPlan ? (
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              <div>
                Tarifa estudiantil:{" "}
                <span className="text-white/90 font-medium">
                  ${priceUsd.toFixed(2)} USD
                </span>{" "}
                / {selectedPlan.period === "day" ? "día" : selectedPlan.period === "month" ? "mes" : selectedPlan.period === "consumption" ? "consumo" : selectedPlan.period}
              </div>
              <div className="mt-1 text-white/55">
                Precio de referencia general (la tarifa estudiantil es ~40% menor; referencia ≈ estudiante ÷ 0,6): $
                {publicUsd.toFixed(2)} USD — el monto en Bs abajo corresponde a la tarifa estudiantil.
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-white/80">Monto en Bs</Label>
            {bcvLoading ? (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--mygreen-dark)] border border-white/10 px-3 py-2 text-white/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                Obteniendo tasa BCV...
              </div>
            ) : bcvError ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-red-300 text-sm">
                No se pudo obtener la tasa del dólar. Configura BCV_RATE_FALLBACK en el servidor o intenta más tarde.
              </div>
            ) : (
              <Input
                value={montoBs != null ? `Bs ${montoBs.toLocaleString()}` : "—"}
                readOnly
                disabled
                className="bg-[var(--mygreen-dark)] border-white/10 text-white/90 cursor-not-allowed"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Últimos 4 dígitos de la referencia</Label>
            <Input
              value={referenceLast4}
              onChange={(e) => setReferenceLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="bg-[var(--mygreen-dark)] border-white/10 text-white placeholder:text-white/50"
              placeholder="Ej: 1234"
              maxLength={4}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Banco</Label>
            <Input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="bg-[var(--mygreen-dark)] border-white/10 text-white placeholder:text-white/50"
              placeholder="Ej: Banco de Venezuela"
              disabled={submitting}
            />
          </div>

          <Button
            type="button"
            className="w-full bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
            disabled={
              submitting ||
              walletOnly ||
              !selectedPlan ||
              montoBs == null ||
              montoBs <= 0 ||
              bcvLoading ||
              bcvError
            }
            onClick={() => void submit()}
          >
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
