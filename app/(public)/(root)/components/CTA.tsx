import { ArrowRight, PenLine } from "lucide-react";

export function CTA() {
  return (
    <section className="chalk-container min-w-0 py-14 sm:py-16 md:py-20">
      <div className="chalk-divider mb-12" />

      <div className="chalk-card chalk-card-featured relative overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-14 md:px-14">
        <span className="chalk-formula chalk-formula-float left-[6%] top-[12%] hidden opacity-60 md:block" aria-hidden>
          suma()
        </span>
        <span
          className="chalk-formula right-[8%] bottom-[14%] hidden !rotate-[6deg] opacity-60 md:block"
          aria-hidden
        >
          share()
        </span>

        <span className="chalk-section-label mx-auto justify-center">
          <PenLine className="h-4 w-4" />
          Tu turno en la pizarra
        </span>

        <h3 className="chalk-title mx-auto mt-5 max-w-3xl font-special text-balance text-[1.55rem] leading-[1.1] sm:text-[2rem] md:text-[2.5rem]">
          ¿LISTO PARA COMPARTIR TU CONOCIMIENTO?
        </h3>

        <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/78 sm:text-lg md:text-xl">
          Únete a tu comunidad estudiantil o crea la tuya junto a tus compañeros y comienza a
          compartir tus CALETAS. Es momento de aprovechar el conocimiento colectivo.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/register" className="chalk-hero-btn chalk-hero-btn-secondary sm:min-w-[320px]">
            <span>Comienza a caletear</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
          <a href="/caracteristicas" className="chalk-hero-btn chalk-hero-btn-primary sm:min-w-[260px]">
            <span>Ver características</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
