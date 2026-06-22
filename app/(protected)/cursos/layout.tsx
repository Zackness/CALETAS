import { Suspense } from "react";

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="aprende-zone aprende-zone-layout">
      <div className="relative z-[1]">
        <Suspense fallback={<div className="aprende-card p-8 text-white/70">Cargando Aprende…</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
