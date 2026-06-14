"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeft, Sparkles } from "lucide-react";
import { MIN_WALLET_TOP_UP_CENTS } from "@/lib/wallet-policy";

type LedgerRow = {
  id: string;
  deltaCents: number;
  balanceAfterCents: number;
  reason: string;
  createdAt: string;
};

type WalletResponse = {
  balanceCents: number;
  discountPercent: number;
  holdByEndpoint: Record<string, number>;
  modelByEndpoint: Record<string, string>;
  platformMarginOnListPrice: number;
  billingNote?: string;
  ledger: LedgerRow[];
};

const endpointLabels: Record<string, string> = {
  "ia/chat": "Chat IA (por mensaje)",
  "ia/resumir": "Resumir / PDF",
  "ia/fichas": "Fichas de estudio",
  "ia/cuestionario": "Cuestionario",
  "academico/cronograma/ai": "Cronograma IA (texto o audio)",
};

function formatUsd(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  return `${sign}$${abs.toFixed(2)} USD`;
}

export default function BilleteraPage() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/user/wallet", { method: "GET" });
      if (!res.ok) {
        setError("No se pudo cargar la billetera.");
        return;
      }
      setData((await res.json()) as WalletResponse);
    } catch {
      setError("No se pudo cargar la billetera.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-16 text-white md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
          <Link href="/home" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="font-special text-2xl font-semibold tracking-tight">Billetera IA</h1>
      </div>

      <p className="text-sm text-white/70">
        Sin suscripción activa puedes seguir usando el chat IA, resúmenes, fichas, cuestionarios y el asistente del
        calendario (texto y transcripción) descontando saldo según el uso real de tokens (Vercel AI Gateway: precio de
        lista del proveedor) más un margen fijo de la plataforma. La columna «reserva» es el mínimo de saldo que debe
        haber antes de cada tipo de llamada (estimación conservadora). Las recargas acreditadas por el equipo cumplen
        un mínimo de ${(MIN_WALLET_TOP_UP_CENTS / 100).toFixed(2)} USD (plan CALETA BASICS / consumo unificado).
      </p>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <Card className="border-white/10 bg-[var(--mygreen-light)] text-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[var(--accent-hex)]" />
            <CardTitle>Saldo</CardTitle>
          </div>
          <CardDescription className="text-white/65">
            Saldo en dólares (USD interno). Para recargar, contacta al equipo o usa los canales de pago que indiquen
            desde soporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data ? (
            <p className="text-sm text-white/60">Cargando…</p>
          ) : (
            <>
              <div className="text-3xl font-semibold tabular-nums text-[var(--accent-hex)]">
                {formatUsd(data.balanceCents)}
              </div>
              {data.discountPercent > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-[var(--accent-hex)]/40 bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] text-[var(--accent-hex)]">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {data.discountPercent}% descuento en consumo IA
                  </Badge>
                  <span className="text-xs text-white/60">
                    Por ejemplo si usaste el código de referido del administrador.
                  </span>
                </div>
              ) : null}

              <div>
                <h3 className="mb-2 text-sm font-medium text-white/90">Modelo actual y reserva de saldo</h3>
                {data.billingNote ? <p className="mb-3 text-xs text-white/55">{data.billingNote}</p> : null}
                <p className="mb-2 text-xs text-white/50">
                  Margen sobre precio de lista del proveedor: ×{data.platformMarginOnListPrice?.toFixed(2) ?? "1.10"}{" "}
                  (aprox. +{Math.round(((data.platformMarginOnListPrice ?? 1.1) - 1) * 100)}%)
                </p>
                <ul className="space-y-2 text-sm text-white/75">
                  {Object.entries(data.holdByEndpoint || {}).map(([ep, cents]) => (
                    <li key={ep} className="flex flex-col gap-0.5 border-b border-white/5 py-2 sm:flex-row sm:justify-between">
                      <div>
                        <div className="text-white/90">{endpointLabels[ep] ?? ep}</div>
                        <div className="text-xs font-mono text-white/45">{data.modelByEndpoint?.[ep] ?? "—"}</div>
                      </div>
                      <div className="text-right tabular-nums text-[var(--accent-hex)]">Reserva: {formatUsd(cents)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[var(--mygreen-light)] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Movimientos recientes</CardTitle>
          <CardDescription className="text-white/65">Cargos por uso de IA y créditos aplicados.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.ledger?.length ? (
            <p className="text-sm text-white/60">Aún no hay movimientos.</p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
              {data.ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-white/10 bg-black/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className={row.deltaCents < 0 ? "text-rose-300" : "text-emerald-300"}>
                      {formatUsd(row.deltaCents)}
                    </span>
                    <span className="ml-2 text-white/50">{row.reason}</span>
                  </div>
                  <div className="text-xs text-white/55">
                    Saldo después: {formatUsd(row.balanceAfterCents)} ·{" "}
                    {new Date(row.createdAt).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_82%,transparent)]">
          <Link href="/suscripcion">Ver planes de suscripción</Link>
        </Button>
        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Link href="/ajustes">Ajustes</Link>
        </Button>
      </div>
    </div>
  );
}
