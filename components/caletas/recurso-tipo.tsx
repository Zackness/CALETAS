"use client";

import {
  Award,
  BookOpen,
  FileText,
  Lightbulb,
  Link as LinkIcon,
  TrendingUp,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconBase = "shrink-0 text-[var(--accent-hex)]";

export function TipoRecursoIcon({
  tipo,
  className,
}: {
  tipo: string;
  className?: string;
}) {
  const c = cn(iconBase, className);
  switch (tipo) {
    case "ANOTACION":
      return <FileText className={c} />;
    case "RESUMEN":
      return <BookOpen className={c} />;
    case "GUIA_ESTUDIO":
      return <Award className={c} />;
    case "EJERCICIOS":
      return <TrendingUp className={c} />;
    case "PRESENTACION":
      return <Video className={c} />;
    case "VIDEO":
      return <Video className={c} />;
    case "AUDIO":
      return <Video className={c} />;
    case "DOCUMENTO":
      return <FileText className={c} />;
    case "ENLACE":
      return <LinkIcon className={c} />;
    case "TIP":
      return <Lightbulb className={c} />;
    default:
      return <FileText className={c} />;
  }
}

/** Etiqueta corta (chip en grid / home). */
export function tipoEtiquetaCorta(tipo: string) {
  switch (tipo) {
    case "ANOTACION":
      return "Anotación";
    case "RESUMEN":
      return "Resumen";
    case "GUIA_ESTUDIO":
      return "Guía";
    case "EJERCICIOS":
      return "Ejercicios";
    case "PRESENTACION":
      return "Presentación";
    case "VIDEO":
      return "Video";
    case "AUDIO":
      return "Audio";
    case "DOCUMENTO":
      return "Documento";
    case "ENLACE":
      return "Enlace";
    case "TIP":
      return "Tip";
    default:
      return "Caleta";
  }
}

export function tipoNombreLargo(tipo: string) {
  switch (tipo) {
    case "ANOTACION":
      return "Anotación";
    case "RESUMEN":
      return "Resumen";
    case "GUIA_ESTUDIO":
      return "Guía de estudio";
    case "EJERCICIOS":
      return "Ejercicios";
    case "PRESENTACION":
      return "Presentación";
    case "VIDEO":
      return "Video";
    case "AUDIO":
      return "Audio";
    case "DOCUMENTO":
      return "Documento";
    case "ENLACE":
      return "Enlace";
    case "TIP":
      return "Tip";
    default:
      return tipo;
  }
}

export function tipoBadgeClassName(tipo: string) {
  const base =
    "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium bg-[var(--mygreen-dark)]";
  switch (tipo) {
    case "ANOTACION":
      return cn(base, "border-[color-mix(in_oklab,var(--accent-hex)_50%,transparent)] text-[var(--accent-hex)]");
    case "RESUMEN":
      return cn(base, "border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] text-emerald-200/95");
    case "GUIA_ESTUDIO":
      return cn(base, "border-white/20 text-[color-mix(in_oklab,var(--accent-hex)_90%,transparent)]");
    case "EJERCICIOS":
      return cn(base, "border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)] text-white/90");
    case "PRESENTACION":
      return cn(base, "border-emerald-400/35 text-emerald-100/90");
    case "VIDEO":
      return cn(base, "border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] text-[var(--accent-hex)]");
    case "AUDIO":
      return cn(base, "border-white/15 text-white/85");
    case "DOCUMENTO":
      return cn(base, "border-white/20 text-white/80");
    case "ENLACE":
      return cn(
        base,
        "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] text-[color-mix(in_oklab,var(--accent-hex)_95%,transparent)]",
      );
    case "TIP":
      return cn(base, "border-amber-400/25 text-amber-100/90");
    default:
      return cn(base, "border-white/15 text-white/75");
  }
}
