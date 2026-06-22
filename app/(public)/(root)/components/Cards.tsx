interface CardsProps {
  titulo: string;
  contenido: string;
  picture: string;
  alt: string;
  index?: number;
}

export default function Cards({ titulo, contenido, picture, alt, index = 0 }: CardsProps) {
  return (
    <article className="chalk-card group flex h-full flex-col p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-[color-mix(in_srgb,var(--surface-elevated)_90%,black_10%)] p-2 transition-transform duration-300 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
          <img src={picture} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
        <span className="text-2xl font-bold leading-none text-white/12 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h4 className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">{titulo}</h4>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/72 sm:text-base">{contenido}</p>
    </article>
  );
}
