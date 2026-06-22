import Link from "next/link";
import { ArrowUpRight, Building2, PlusCircle } from "lucide-react";

const UNIVERSITIES = [
  {
    id: "unexpo",
    name: "UNEXPO",
    logo: "/universities/unexpo.webp",
    careers: ["Ing. Mecatrónica", "Ing. Rural", "TSU. Electricidad", "TSU. Mecánica", "Ing. Química"],
    featured: true,
  },
  {
    id: "ucv",
    name: "UCV",
    logo: "/universities/ucv.webp",
    careers: ["Lic. Música", "Lic. Psicología"],
    featured: false,
  },
  {
    id: "ucla",
    name: "UCLA",
    logo: "/universities/ucla.webp",
    careers: ["Lic. Música", "Lic. Psicología"],
    featured: false,
  },
] as const;

export function Universities() {
  return (
    <section className="chalk-container min-w-0 py-14 sm:py-16 md:py-20">
      <div className="chalk-divider mb-12" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chalk-section-label">
            <Building2 className="h-4 w-4" />
            Comunidades
          </span>
          <h2 className="chalk-title mt-4 font-special text-balance text-[1.65rem] sm:text-[2.15rem] md:text-[2.5rem] lg:text-[2.75rem]">
            UNIVERSIDADES
          </h2>
        </div>
        <Link
          href="/agregar-universidad"
          className="inline-flex items-center gap-2 self-start text-sm font-bold text-[var(--caleta-accent)] transition-colors hover:text-white md:self-end"
        >
          Ver más instituciones
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* UNEXPO destacada */}
        <article className="chalk-card chalk-card-featured lg:col-span-5 lg:row-span-2 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-28 w-full max-w-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_92%,black)] p-4 sm:h-36">
              <img src={UNIVERSITIES[0].logo} alt="Logo UNEXPO" className="max-h-full max-w-full object-contain" />
            </div>
            <h3 className="mt-6 font-special text-balance text-2xl text-white sm:text-3xl lg:text-[2.75rem]">
              {UNIVERSITIES[0].name}
            </h3>
            <ul className="mt-4 space-y-2 text-left text-sm font-semibold text-white/78 sm:text-base md:text-lg">
              {UNIVERSITIES[0].careers.map((career) => (
                <li key={career} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--caleta-accent)]" />
                  {career}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* UCV y UCLA */}
        {UNIVERSITIES.slice(1).map((uni) => (
          <article
            key={uni.id}
            className="chalk-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 lg:col-span-7"
          >
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_92%,black)] p-3 sm:h-28 sm:w-28">
              <img src={uni.logo} alt={`Logo ${uni.name}`} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-special text-balance text-xl text-white sm:text-2xl md:text-3xl">{uni.name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold text-white/75 sm:text-base">
                {uni.careers.map((career) => (
                  <li key={career}>- {career}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}

        {/* Agrega tu uni */}
        <article className="chalk-card chalk-card-featured lg:col-span-12 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <span className="chalk-badge mb-4">
                <PlusCircle className="h-3.5 w-3.5" />
                Expande la pizarra
              </span>
              <h3 className="font-special text-balance text-xl text-white sm:text-2xl md:text-3xl">
                AGREGA TU INSTITUCIÓN
              </h3>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-white/78 sm:text-base md:text-lg">
                ¿No aparece tu universidad, colegio, liceo o instituto? Puedes solicitarlo en el
                formulario. Solo necesitas que al menos 10 personas de tu programa certifiquen
                la autenticidad con carnet o documento estudiantil.
              </p>
            </div>
            <Link href="/agregar-universidad" className="shrink-0">
              <span className="chalk-hero-btn chalk-hero-btn-secondary inline-flex sm:min-w-[240px]">
                Solicitar institución
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
