"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminStats = {
  users: number;
  universidades: number;
  carreras: number;
  materias: number;
  recursos: number;
  subscriptions: number;
  manualPaymentsTotal: number;
  manualPaymentsPending: number;
};

export default function AdminEstadisticasPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No autorizado");
        setStats(data.counts as AdminStats);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    };
    void loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[var(--accent-hex)]" />
            Panel Admin - Estadísticas
          </h1>
          <p className="text-white/70">Resumen global de actividad de Caletas.</p>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent-hex)]" />
              Estadísticas globales
            </CardTitle>
            <CardDescription className="text-white/70">
              Métricas principales de usuarios, contenido, suscripciones y pagos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !stats ? (
              <div className="text-white/70">Cargando estadísticas...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ["Usuarios registrados", stats.users],
                  ["Universidades", stats.universidades],
                  ["Carreras", stats.carreras],
                  ["Materias", stats.materias],
                  ["Recursos compartidos", stats.recursos],
                  ["Suscripciones activas", stats.subscriptions],
                  ["Pagos manuales totales", stats.manualPaymentsTotal],
                  ["Pagos manuales pendientes", stats.manualPaymentsPending],
                ].map(([label, value]) => (
                  <Card key={String(label)} className="bg-[var(--mygreen-dark)] border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-white/70">{label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-white">{Number(value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
