import Cards from "@/app/(public)/(root)/components/Cards";
import { HeartHandshake } from "lucide-react";

const CARDS_INFO = [
  {
    id: 1,
    titulo: "Comparte tu caleta",
    contenido:
      "Sube tu apunte, exámenes resueltos y material de estudio para ayudar a otros estudiantes",
    picture: "/Cards1.webp",
    alt: "Compartir recursos académicos",
  },
  {
    id: 2,
    titulo: "Aprende más rápido",
    contenido:
      "Accede a material ordenado por temas y materias que te ayudará a entender conceptos complejos",
    picture: "/Cards2.webp",
    alt: "Aprender con material organizado",
  },
  {
    id: 3,
    titulo: "Comunidad activa",
    contenido:
      "Forma parte de una comunidad de estudiantes que se ayudan mutuamente a alcanzar el éxito",
    picture: "/Cards3.webp",
    alt: "Comunidad estudiantil activa",
  },
  {
    id: 4,
    titulo: "Visualiza tu progreso",
    contenido:
      "Mapa interactivo de tu pensum para visualizar tu avance y planificar tus próximos pasos",
    picture: "/Cards4.webp",
    alt: "Progreso académico visual",
  },
] as const;

export function Whyus() {
  return (
    <section className="chalk-container min-w-0 py-14 sm:py-16 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="chalk-section-label justify-center">
          <HeartHandshake className="h-4 w-4" />
          Hecho por estudiantes
        </span>
        <h2 className="chalk-title mt-4 font-special text-balance text-[1.65rem] sm:text-[2.15rem] md:text-[2.5rem] lg:text-[2.75rem]">
          ¿POR QUÉ CALETA?
        </h2>
        <p className="mt-4 text-base font-semibold leading-relaxed text-white/78 sm:text-lg md:text-xl">
          Una plataforma diseñada por estudiantes para estudiantes, centrada en la colaboración,
          el aprendizaje colectivo y los{" "}
          <span className="text-[var(--caleta-accent)]">apuntes compartidos</span>.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {CARDS_INFO.map((card, index) => (
          <Cards
            key={card.id}
            index={index}
            titulo={card.titulo}
            contenido={card.contenido}
            picture={card.picture}
            alt={card.alt}
          />
        ))}
      </div>
    </section>
  );
}
