import Link from "next/link";

const FOOTER_LINKS = {
  plataforma: [
    { href: "/caracteristicas", label: "Características" },
    { href: "/testimonios", label: "Testimonios" },
    { href: "/blog", label: "Blog" },
    { href: "/login", label: "Iniciar sesión" },
  ],
  comunidad: [
    { href: "/agregar-universidad", label: "Agregar institución" },
    { href: "/aliados", label: "Aliados" },
    { href: "/terminos-y-condiciones", label: "Términos" },
  ],
  aprende: [
    { href: "https://pic18.caleta.top", label: "Aprende PIC18", external: true },
    { href: "https://cpp.caleta.top", label: "Aprende C++ POO", external: true },
  ],
  social: [
    { href: "https://instagram.com", label: "Instagram" },
    { href: "https://github.com", label: "GitHub" },
    { href: "https://tiktok.com", label: "TikTok" },
    { href: "https://youtube.com", label: "YouTube" },
  ],
} as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="font-special text-sm tracking-wide text-[var(--caleta-accent)]">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white/72 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm font-semibold text-white/72 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-4 w-full overflow-hidden border-t border-white/8 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--mygreen-dark)_86%,black),color-mix(in_srgb,var(--mygreen-dark)_96%,black))]">
      <span className="chalk-doodle -left-10 top-8 hidden md:block" aria-hidden />
      <span className="chalk-doodle -right-12 bottom-6 hidden md:block" aria-hidden />
      <span className="chalk-formula left-[10%] bottom-8 hidden lg:block" aria-hidden>
        dx/dt
      </span>
      <span className="chalk-formula right-[12%] top-10 hidden lg:block" aria-hidden>
        f(x)
      </span>

      <div className="chalk-container py-12 sm:py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h3 className="chalk-title font-special text-3xl sm:text-4xl">CALETA</h3>
            <p className="mt-4 max-w-sm text-sm font-semibold leading-relaxed text-white/72 sm:text-base">
              Plataforma académica colaborativa. Comparte apuntes, organiza tu progreso y aprende
              con cursos conectados a tu cuenta.
            </p>
            <p className="mt-4 text-sm font-semibold text-white/55">Iniciativa de Zackness</p>
          </div>

          <FooterColumn title="Plataforma" links={FOOTER_LINKS.plataforma} />
          <FooterColumn title="Comunidad" links={FOOTER_LINKS.comunidad} />
          <FooterColumn title="Aprende algo" links={FOOTER_LINKS.aprende} />
        </div>

        <div className="chalk-divider my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-white/50 sm:text-sm">
            © {new Date().getFullYear()} CALETA · De estudiantes para estudiantes
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.social.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-white/70 transition-colors hover:text-[var(--caleta-accent)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
