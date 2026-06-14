"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReferralInfo = {
  referralCode: string | null;
  referredByName: string | null;
  referralDayActive: boolean;
  referralDayEndsAt: string | null;
  pendingReferrerRewards: number;
  role: string;
};

export function ReferralPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralInfo | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/referral");
      const json = (await res.json()) as ReferralInfo & { error?: string };
      if (!res.ok) throw new Error(json?.error || "No se pudo cargar referidos");
      setData(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando referidos");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyCode = async () => {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  const redeem = async () => {
    setRedeeming(true);
    try {
      const res = await fetch("/api/user/referral/redeem", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No se pudo canjear");
      toast.success("¡Listo! Tienes 24 horas de IA completa.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al canjear");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
        <CardContent className="py-10 flex justify-center text-white/70">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.role !== "CLIENT" && data.role !== "ADMIN")) {
    return null;
  }

  const isAdmin = data.role === "ADMIN";

  return (
    <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-[var(--accent-hex)]" />
          {isAdmin ? "Código de referido (campaña)" : "Invita y gana IA completa"}
        </CardTitle>
        <CardDescription className="text-white/70">
          {isAdmin ? (
            <>
              Comparte tu código con estudiantes en el onboarding. Según la configuración del sistema, quienes se
              registren con tu código pueden obtener beneficios de referidos y descuento en consumo de IA por
              billetera.
            </>
          ) : (
            <>
              Comparte tu código con otro estudiante. Cuando complete el registro con tu código, ambos reciben
              beneficios: tu amigo activa 24 h de IA completa al terminar el onboarding; tú podrás canjear 24 h de IA
              completa por cada referido.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-4">
          <div className="text-xs text-white/50 mb-1">Tu código</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <code className="text-lg font-mono tracking-wider text-[var(--accent-hex)]">
              {data.referralCode || "—"}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[var(--accent-hex)]/40 bg-[#1C2D20] text-[var(--accent-hex)] hover:bg-white/10"
              onClick={() => void copyCode()}
              disabled={!data.referralCode}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
          </div>
        </div>

        {data.referredByName ? (
          <p className="text-sm text-white/70">
            Te invitó: <span className="text-white/90">{data.referredByName}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 items-center">
          {data.referralDayActive ? (
            <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]">
              IA completa activa
            </Badge>
          ) : null}
          {data.referralDayEndsAt && data.referralDayActive ? (
            <span className="text-xs text-white/60">
              hasta {new Date(data.referralDayEndsAt).toLocaleString()}
            </span>
          ) : null}
        </div>

        {!isAdmin && data.pendingReferrerRewards > 0 && !data.referralDayActive ? (
          <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-4 space-y-3">
            <p className="text-sm text-white/85">
              Tienes{" "}
              <strong className="text-[var(--accent-hex)]">{data.pendingReferrerRewards}</strong>{" "}
              día(s) de IA completa por canjear (por referidos).
            </p>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
              disabled={redeeming}
              onClick={() => void redeem()}
            >
              {redeeming ? "Canjeando..." : "Canjear 24 h de IA completa"}
            </Button>
          </div>
        ) : null}

        {!isAdmin && data.pendingReferrerRewards > 0 && data.referralDayActive ? (
          <p className="text-xs text-white/55">
            Cuando termine tu día de IA completa actual, podrás canjear las recompensas pendientes.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
