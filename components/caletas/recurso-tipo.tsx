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
import { tipoBadgeClassName, tipoEtiquetaCorta, tipoNombreLargo } from "./recurso-tipo-utils";

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

export { tipoEtiquetaCorta, tipoNombreLargo, tipoBadgeClassName };
