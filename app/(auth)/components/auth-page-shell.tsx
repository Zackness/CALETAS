import type { ReactNode } from "react";
import { Suspense } from "react";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";

type AuthPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  fallback = <div className="py-12 text-center text-white/70">Cargando...</div>,
}: AuthPageShellProps) {
  return (
    <PublicPageShell>
      <span className="chalk-doodle left-2 top-32 hidden opacity-20 lg:block" aria-hidden />
      <span
        className="chalk-formula chalk-formula-float top-[20rem] left-[2%] hidden opacity-15 xl:block"
        aria-hidden
      >
        x² + y²
      </span>
      <span className="chalk-formula top-[36rem] right-[2%] hidden opacity-15 xl:block" aria-hidden>
        sin(θ)
      </span>

      <PublicPageHero title={title} description={description} />

      <section className="chalk-container flex justify-center px-3 pb-16 sm:px-4 sm:pb-20">
        <Suspense fallback={fallback}>{children}</Suspense>
      </section>
    </PublicPageShell>
  );
}
