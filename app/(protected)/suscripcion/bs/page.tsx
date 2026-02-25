"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Redirige a la página de suscripción con el diálogo de pago en Bs abierto.
 * Así los enlaces antiguos (/suscripcion/bs?plan=xxx) siguen funcionando.
 */
export default function SuscripcionBsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const plan = searchParams.get("plan");
    const url = plan ? `/suscripcion?pagoBs=${encodeURIComponent(plan)}` : "/suscripcion";
    router.replace(url);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
      <p className="text-white/70">Redirigiendo...</p>
    </div>
  );
}
