import { ArrowUpRight, Cpu, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { CursoWebShowcasePreview } from "@/components/cursos/curso-web-showcase-preview";

const LEARN_PROJECTS = [
  {
    id: "pic18",
    badge: "Microcontroladores",
    title: "Aprende PIC18",
    description:
      "Curso interactivo de PIC18F4550 con lecciones, quizzes, prácticas de laboratorio y tutor IA conectado a tu cuenta CALETAS.",
    href: "https://pic18.caleta.top",
    accent: "Timer · UART · ADC",
    codeLeft: "TMR0",
    codeRight: "ISR",
  },
  {
    id: "cpp",
    badge: "Programación",
    title: "Aprende C++ POO",
    description:
      "Domina clases, herencia, polimorfismo y patrones con retos guiados. Tu progreso se sincroniza con CALETAS al iniciar sesión.",
    href: "https://cpp.caleta.top",
    accent: "POO · STL · Proyectos",
    codeLeft: "class",
    codeRight: "virtual",
  },
] as const;

export function AprendeHub() {
  return (
    <section className="aprende-zone relative py-14 sm:py-16 md:py-20">
      <div className="chalk-container relative z-[1] min-w-0">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="aprende-section-label">
              <Sparkles className="h-4 w-4" />
              Sub-marca Aprende
            </span>
            <h2 className="chalk-title mt-4 font-special text-balance text-[1.65rem] sm:text-[2.15rem] md:text-[2.5rem] lg:text-[2.75rem]">
              CURSOS CONECTADOS A CALETAS
            </h2>
            <p className="mt-4 text-base font-semibold leading-relaxed text-white/78 sm:text-lg">
              Experiencias técnicas con identidad propia: progreso real, laboratorios guiados y
              acceso con la misma cuenta de campus.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--aprende-accent-bright)] transition-colors hover:text-white"
          >
            Entrar para ver tu avance
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {LEARN_PROJECTS.map((project) => (
            <article key={project.id} className="aprende-card group overflow-hidden">
              <div className="relative p-3 pb-0 sm:p-4 sm:pb-0">
                <CursoWebShowcasePreview
                  title={project.title}
                  url={project.href}
                  className="border-[var(--aprende-border)] shadow-[0_0_24px_-12px_var(--aprende-glow)]"
                />
                <div className="pointer-events-none absolute left-5 top-10 z-10 sm:left-6 sm:top-11">
                  <span className="aprende-badge !py-1 !text-[0.62rem]">{project.badge}</span>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{project.title}</h3>
                <p className="text-sm leading-relaxed text-white/72 sm:text-base">{project.description}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="aprende-chip">
                    <Cpu className="mr-1.5 inline h-3.5 w-3.5 text-[var(--aprende-accent)]" />
                    {project.accent}
                  </span>
                  <span className="aprende-chip">Progreso sincronizado</span>
                </div>

                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block pt-1"
                >
                  <span className="aprende-btn">
                    Ir al curso
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
