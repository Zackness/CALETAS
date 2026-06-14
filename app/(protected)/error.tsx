"use client";

import { useEffect } from "react";

function looksLikeDatabaseError(message: string, name: string) {
  if (name === "PrismaClientKnownRequestError" || name === "PrismaClientInitializationError") {
    return true;
  }
  return /database|prisma|neon|p1001|can't reach|connection pool|timed out fetching/i.test(
    message,
  );
}

export default function ProtectedSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[protected] error boundary:", error);
  }, [error]);

  const msg = error.message ?? "";
  const isDb = looksLikeDatabaseError(msg, error.name);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-12 text-white">
      <div className="max-w-md rounded-xl border border-white/15 bg-black/25 p-6 text-center shadow-lg backdrop-blur">
        <h1 className="text-lg font-semibold tracking-tight">Algo salió mal</h1>
        <p className="mt-3 text-sm text-white/85">
          {isDb
            ? "No pudimos conectar con la base de datos. Si usas Neon, despierta el proyecto en el panel, comprueba DATABASE_URL (SSL/pooler) y que tu red no bloquee el puerto 5432."
            : "Ocurrió un error al cargar esta sección. Puedes reintentar o volver más tarde."}
        </p>
        {process.env.NODE_ENV === "development" && msg ? (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-black/40 p-3 text-left text-xs text-amber-100/90">
            {msg}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-mygreen shadow hover:bg-white/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
