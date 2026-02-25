"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Por ahora la sección Cursos es "Próximamente". Redirigir al listado (landing).
 */
export default function CursoDetailPage() {
  const router = useRouter();
  const _params = useParams();

  useEffect(() => {
    router.replace("/cursos");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
      <p className="text-white/70">Redirigiendo...</p>
    </div>
  );
}
