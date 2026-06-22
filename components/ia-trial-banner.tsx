"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Crown, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AiTrialEndpoint } from "@/lib/ai-trial";

type FreeTierStatus = {
  active: boolean;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  requestsUsed: number;
  requestsLimit: number;
  requestsRemaining: number;
  resetsAt: string;
  resetsAtLabel: string;
  message: string;
};

type TrialStatusResponse = {
  hasSubscription?: boolean;
  trialEligible?: boolean;
  isTrial: boolean;
  status: Record<AiTrialEndpoint, { used: number; limit: number; remaining: number; resetsAt?: string; resetsAtLabel?: string }>;
  freeTier?: FreeTierStatus;
  referralDay?: { active: boolean; endsAt: string | null };
  wallet?: { balanceCents: number; discountPercent: number };
};

const bannerBtnPrimary =
  "h-9 shrink-0 gap-1.5 rounded-lg bg-[var(--accent-hex)] px-4 text-sm font-semibold text-[#1C2D20] shadow-sm hover:opacity-90";
const bannerBtnSecondary =
  "h-9 shrink-0 gap-1.5 rounded-lg border border-[var(--accent-hex)]/50 bg-[#1C2D20] px-4 text-sm font-medium text-[var(--accent-hex)] hover:bg-white/10";

export function IATrialBanner(props: { toolLabel: string; endpoint: AiTrialEndpoint }) {
  const { toolLabel, endpoint } = props;
  const [freeTier, setFreeTier] = useState<FreeTierStatus | null>(null);
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
            setFreeTier(null);
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
            setFreeTier(null);
            setHideBanner(true);
          }
          return;
        }
        if (!cancelled) {
          setHideBanner(false);
        }
        const ft = data?.freeTier;
        if (!ft || cancelled) return;
        setFreeTier(ft);
      } catch {
        // silencioso
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const usageLabel = useMemo(() => {
    if (!freeTier) return null;
    if (!freeTier.active) {
      return `Límite alcanzado. Se renueva ${freeTier.resetsAtLabel}.`;
    }
    return `${freeTier.tokensRemaining.toLocaleString("es-VE")} tokens · ${freeTier.requestsRemaining} consultas restantes hoy`;
  }, [freeTier]);

  if (hideBanner) {
    return null;
  }

  if (referralBoost?.active) {
    return (
      <div className="rounded-xl border border-[var(--accent-hex)]/30 bg-[#354B3A] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <Badge className="border-[var(--accent-hex)]/40 bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] text-[var(--accent-hex)]">
              <Sparkles className="mr-1 h-3 w-3" />
              IA completa (referidos)
            </Badge>
            <p className="text-sm text-white/85">
              <span className="font-medium text-white">{toolLabel}</span> sin límite de prueba
              {referralBoost.endsAt ? (
                <>
                  {" "}
                  hasta{" "}
                  <span className="font-medium text-[var(--accent-hex)]">
                    {new Date(referralBoost.endsAt).toLocaleString("es-VE")}
                  </span>
                </>
              ) : null}
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <Button asChild className={bannerBtnSecondary}>
              <Link href="/billetera">
                <Wallet className="h-4 w-4" />
                Billetera
              </Link>
            </Button>
            <Button asChild className={bannerBtnPrimary}>
              <Link href="/suscripcion">
                <Crown className="h-4 w-4" />
                Planes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#354B3A] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-sky-500/40 bg-sky-950/50 text-sky-100">
              IA gratuita diaria
            </Badge>
            {freeTier?.active === false ? (
              <Badge className="border-amber-500/40 bg-amber-950/40 text-amber-100">Cupo agotado</Badge>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-white/85">
            Usas <span className="font-medium text-white">{toolLabel}</span> con modelos gratis del Gateway
            (Gemini Flash, Llama, etc.).
          </p>
          <div className="space-y-1 text-xs leading-relaxed text-white/60">
            {usageLabel ? (
              <p className="text-sm font-medium text-[var(--accent-hex)]">{usageLabel}</p>
            ) : (
              <p>Cupo compartido entre chat, resumir, fichas, cuestionario y cronograma.</p>
            )}
            {freeTier?.active ? (
              <p>Se renueva {freeTier.resetsAtLabel}.</p>
            ) : freeTier ? (
              <p className="text-white/75">
                Vuelve a usar IA gratuita {freeTier.resetsAtLabel}. Mientras tanto puedes recargar billetera o
                suscribirte.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[11rem] lg:shrink-0">
          <Button asChild className={cnFullWidth(bannerBtnSecondary)}>
            <Link href="/billetera">
              <Wallet className="h-4 w-4" />
              Billetera
            </Link>
          </Button>
          <Button asChild className={cnFullWidth(bannerBtnPrimary)}>
            <Link href="/suscripcion">
              <Crown className="h-4 w-4" />
              Mejorar plan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function cnFullWidth(classes: string) {
  return `${classes} w-full sm:w-auto justify-center`;
}
