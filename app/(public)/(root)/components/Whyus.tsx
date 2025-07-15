import Cards from "@/app/(public)/(root)/components/Cards";

export function Whyus() {
  const CardsInfo = [
    {
        id: 1,
        titulo: "Comparte tu caleta",
        contenido: "Sube tu apunte, exámenes resueltos y material de estudio para ayudar a otros estudiantes",
        picture: "/Cards1.webp",
        alt: "Cards1",
    },
    {
        id: 2,
        titulo: "Aprende más rápido",
        contenido: "Accede a material ordenado por temas y materias que te ayudará a entender conceptos complejos",
        picture: "/Cards2.webp",
        alt: "Cards2",
    },
    {
        id: 3,
        titulo: "Comunidad activa",
        contenido: "Forma parte de una comunidad de estudiantes que se ayudan mutuamente a alcanzar el éxito",
        picture: "/Cards3.webp",
        alt: "Cards3",
    },
    {
        id: 4,
        titulo: "Visualiza tu progreso",
        contenido: "Mapa interactivo de tu pensum para visualizar tu avance y planificar tus próximos pasos",
        picture: "/Cards4.webp",
        alt: "Cards4",
    },
];

  return (
    <section className="content-center items-center px-4 sm:px-6 md:px-12 pt-12 sm:pt-16 md:pt-[65px]">
        <div className="flex flex-col text-center">
            <p className="font-semibold text-sm sm:text-base">
                Esta es una iniciativa de Zackness
            </p>
            <h2 className="text-[1.75rem] sm:text-[2rem] md:text-[3rem] lg:text-[40px] font-special pt-3 sm:pt-[15px]">
                ¿POR QUE CALETA?
            </h2>
            <p className="font-semibold text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed sm:leading-relaxed md:leading-relaxed lg:leading-[36px] pt-4 sm:pt-6 md:pt-[27px] px-2 sm:px-4 md:px-12 lg:px-42">
                Una plataforma diseñada por estudiantes para estudiantes, centrada en la
                colaboración y el aprendizaje colectivo
            </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-center mx-2 sm:mx-4 md:mx-5 gap-4 sm:gap-6 pt-8 sm:pt-12 md:pt-14">
            {CardsInfo.map(card => (
                <Cards
                    key={card.id}
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