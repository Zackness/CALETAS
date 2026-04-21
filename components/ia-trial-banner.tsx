 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AiTrialEndpoint = "ia/resumir" | "ia/fichas" | "ia/cuestionario" | "ia/chat";

type TrialStatusResponse = {
  isTrial: boolean;
  status: Record<AiTrialEndpoint, { used: number; limit: number; remaining: number }>;
};

export function IATrialBanner(props: { toolLabel: string; endpoint: AiTrialEndpoint }) {
  const { toolLabel, endpoint } = props;
  const [info, setInfo] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ia/trial/status", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as TrialStatusResponse;
        if (!data?.isTrial) return;
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

  return (
    <div className="rounded-lg border border-white/10 bg-[#354B3A] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/10 text-white hover:bg-white/20">Versión de prueba</Badge>
            <div className="text-sm text-white/80">
              Estás usando <span className="text-white font-medium">{toolLabel}</span> en modo gratis con límites.
            </div>
          </div>
          <div className="mt-1 text-xs text-white/60">
            {usageLabel ? (
              <span className="text-white/70">{usageLabel}</span>
            ) : (
              <span>Si llegas al límite, tendrás que mejorar tu plan para seguir usando IA.</span>
            )}
          </div>
        </div>
        <Button asChild className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white md:w-auto">
          <Link href="/suscripcion">Mejorar plan</Link>
        </Button>
      </div>
    </div>
  );
}

