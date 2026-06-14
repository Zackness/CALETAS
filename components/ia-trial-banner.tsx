"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AiTrialEndpoint = "ia/resumir" | "ia/fichas" | "ia/cuestionario" | "ia/chat";

type TrialStatusResponse = {
  hasSubscription?: boolean;
  trialEligible?: boolean;
  isTrial: boolean;
  status: Record<AiTrialEndpoint, { used: number; limit: number; remaining: number }>;
  referralDay?: { active: boolean; endsAt: string | null };
  wallet?: { balanceCents: number; discountPercent: number };
};

export function IATrialBanner(props: { toolLabel: string; endpoint: AiTrialEndpoint }) {
  const { toolLabel, endpoint } = props;
  const [info, setInfo] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [referralBoost, setReferralBoost] = useState<{ active: boolean; endsAt: string | null } | null>(null);
  const [hideBanner, setHideBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ia/trial/status", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as TrialStatusResponse;
        if (data?.referralDay?.active) {
          if (!cancelled) {
            setReferralBoost({
              active: true,
              endsAt: data.referralDay.endsAt ?? null,
            });
            setInfo(null);
            setHideBanner(false);
          }
          return;
        }
        if (!cancelled) {
          setReferralBoost(null);
        }
        const subscribed = data?.hasSubscription === true;
        const trialEligible =
          data?.trialEligible === true || (data?.trialEligible === undefined && data?.isTrial === true);
        if (subscribed || !trialEligible) {
          if (!cancelled) {
            setInfo(null);
            setHideBanner(true);
          }
          return;
        }
        if (!cancelled) {
          setHideBanner(false);
        }
        const row = data?.status?.[endpoint];
        if (!row || cancelled) return;
        setInfo(row);
      } catch {
        // silencioso
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const usageLabel = useMemo(() => {
    if (!info) return null;
    const noun = endpoint === "ia/chat" ? "Mensajes" : "Usos";
    return `${noun}: ${info.used} de ${info.limit} (te quedan ${info.remaining})`;
  }, [endpoint, info]);

  if (hideBanner) {
    return null;
  }

  if (referralBoost?.active) {
    return (
      <div className="rounded-lg border border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] bg-[var(--mygreen-light)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]">
                IA completa (referidos)
              </Badge>
              <div className="text-sm text-white/80">
                <span className="text-white font-medium">{toolLabel}</span> sin límite de prueba
                {referralBoost.endsAt ? (
                  <>
                    {" "}
                    hasta{" "}
                    <span className="text-[var(--accent-hex)]">
                      {new Date(referralBoost.endsAt).toLocaleString()}
                    </span>
                  </>
                ) : null}
                .
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button
              asChild
              className="bg-[#1C2D20] border border-[var(--accent-hex)]/40 text-[var(--accent-hex)] hover:bg-white/10 md:w-auto"
            >
              <Link href="/billetera">Billetera</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white/90 hover:bg-white/10 md:w-auto">
              <Link href="/suscripcion">Planes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[var(--mygreen-light)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/10 text-white hover:bg-white/20">Versión de prueba</Badge>
            <div className="text-sm text-white/80">
              Estás usando <span className="text-white font-medium">{toolLabel}</span> en modo gratis con límites.
            </div>
          </div>
          <div className="mt-1 space-y-1 text-xs text-white/60">
            {usageLabel ? (
              <span className="block text-white/70">{usageLabel}</span>
            ) : (
              <span className="block">Si llegas al límite, puedes usar saldo en billetera o suscribirte.</span>
            )}
            <span className="block">
              Sin suscripción, tras el límite gratis puedes{" "}
              <Link href="/billetera" className="text-[var(--accent-hex)] underline underline-offset-2">
                usar billetera por consumo
              </Link>{" "}
              (solo si no tienes saldo aún: con saldo no hay usos gratis de prueba).
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button
            asChild
            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white md:w-auto"
          >
            <Link href="/billetera">Billetera</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/25 text-white hover:bg-white/10 md:w-auto">
            <Link href="/suscripcion">Mejorar plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

