import { ArrowRight, GraduationCap, BookOpen, Sparkles, Users } from "lucide-react";

const STATS: Array<{
  icon: typeof GraduationCap;
  label: string;
  value: string;
  accent?: boolean;
  aprende?: boolean;
  compact?: boolean;
}> = [
  { icon: GraduationCap, label: "Universidades", value: "3+", accent: true },
  { icon: BookOpen, label: "Recursos", value: "Caletas" },
  { icon: Users, label: "Comunidad", value: "Activa" },
  { icon: Sparkles, label: "Aprende", value: "PIC · C++", aprende: true, compact: true },
];

export function Hero() {
  return (
    <section className="chalk-container min-w-0 pb-6 pt-4 sm:pb-10 sm:pt-8 lg:pb-14">
      <div className="grid min-w-0 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <div className="chalk-animate-in order-2 min-w-0 lg:order-1">
          <span className="chalk-badge mb-5">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Plataforma académica colaborativa
          </span>

          <h1 className="chalk-title font-special text-balance text-[1.85rem] leading-[1.08] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.35rem] xl:text-[3.65rem]">
            <span className="text-[var(--caleta-accent)]">COMPARTE</span> Y{" "}
            <span className="chalk-underline">APRENDE</span>
            <br />
            CON TU COMUNIDAD
          </h1>

          <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-white/82 sm:text-lg md:text-xl">
            Accede a material universitario creado por estudiantes para estudiantes.
            Tu &quot;CALETA&quot; ahora es nuestra caleta. Juntos somos más.
          </p>

          <div className="mt-7 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="/login" className="chalk-hero-btn chalk-hero-btn-primary">
              <span>Iniciar sesión</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
            <a href="/register" className="chalk-hero-btn chalk-hero-btn-secondary">
              <span>Registrarme ahora</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </div>

          <div className="mt-8 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, label, value, accent, aprende, compact }) => (
              <div
                key={label}
                className={`chalk-stat min-w-0${aprende ? " chalk-stat-aprende" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0${aprende ? " text-[var(--aprende-accent)]" : " text-[var(--caleta-accent)]"}`}
                />
                <p
                  className={
                    accent
                      ? "chalk-stat-value-accent"
                      : aprende
                        ? "chalk-stat-value text-sm text-[var(--aprende-accent-bright)] sm:text-base"
                        : compact
                          ? "chalk-stat-value text-sm sm:text-base"
                          : "chalk-stat-value"
                  }
                >
                  {value}
                </p>
                <p className="chalk-stat-label">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="chalk-animate-in chalk-animate-in-delay-1 order-1 min-w-0 lg:order-2">
          <div className="chalk-hero-visual mx-auto w-full max-w-md lg:max-w-none">
            <img
              className="mx-auto w-full max-w-full object-contain"
              src="/Group-209.webp"
              alt="Ilustración de estudiantes colaborando en distintas carreras universitarias"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
