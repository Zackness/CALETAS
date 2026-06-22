type Section = { title: string; body: string };

function parseCursoContenido(contenido: string): Section[] {
  const lines = contenido.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (current?.body.trim()) sections.push(current);
      current = { title: heading[1].trim(), body: "" };
      continue;
    }
    if (!current) {
      if (!line.trim()) continue;
      current = { title: "Acerca del curso", body: line };
      continue;
    }
    current.body += `${current.body ? "\n" : ""}${line}`;
  }

  if (current?.body.trim()) sections.push(current);
  return sections;
}

function renderBody(body: string) {
  const items = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = items.filter((l) => l.startsWith("- "));
  if (bullets.length > 0 && bullets.length === items.length) {
    return (
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
        {bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--aprende-accent)]" />
            <span>{item.replace(/^-\s+/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{body.trim()}</p>;
}

export function CursoInfoSections({
  descripcion,
  contenido,
  tema,
  autorName,
}: {
  descripcion: string;
  contenido: string;
  tema?: string | null;
  autorName?: string | null;
}) {
  const sections = parseCursoContenido(contenido);

  return (
    <div className="space-y-4">
      <section className="aprende-card p-5">
        <p className="aprende-section-label text-xs">Resumen</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{descripcion}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tema ? <span className="aprende-chip">{tema}</span> : null}
          {autorName ? <span className="aprende-chip">Por {autorName}</span> : null}
          <span className="aprende-chip">Progreso sincronizado con CALETAS</span>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="aprende-card p-5">
          <h2 className="font-special text-lg text-white">{section.title}</h2>
          {renderBody(section.body)}
        </section>
      ))}
    </div>
  );
}
