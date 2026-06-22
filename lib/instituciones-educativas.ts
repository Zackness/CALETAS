export type CategoriaInstitucion =
  | "UNIVERSIDAD"
  | "INSTITUTO"
  | "COLEGIO"
  | "LICEO"
  | "ESCUELA_TECNICA"
  | "OTRO";

export type CaracterInstitucion = "PUBLICA" | "PRIVADA" | "OTRA";

export const CATEGORIAS_INSTITUCION: {
  value: CategoriaInstitucion;
  label: string;
  descripcion: string;
}[] = [
  {
    value: "UNIVERSIDAD",
    label: "Universidad",
    descripcion: "Educación universitaria de pregrado o postgrado",
  },
  {
    value: "INSTITUTO",
    label: "Instituto universitario",
    descripcion: "Instituto o politécnico con carreras técnicas o universitarias",
  },
  {
    value: "COLEGIO",
    label: "Colegio",
    descripcion: "Educación básica, media general o diversificada",
  },
  {
    value: "LICEO",
    label: "Liceo",
    descripcion: "Bachillerato o formación de nivel medio",
  },
  {
    value: "ESCUELA_TECNICA",
    label: "Escuela técnica",
    descripcion: "Formación técnica media o programas técnicos",
  },
  {
    value: "OTRO",
    label: "Otra unidad educativa",
    descripcion: "Academia, centro de formación u otra institución",
  },
];

export const CARACTERES_INSTITUCION: { value: CaracterInstitucion; label: string }[] = [
  { value: "PUBLICA", label: "Pública" },
  { value: "PRIVADA", label: "Privada" },
  { value: "OTRA", label: "Otra" },
];

export function getCategoriaInstitucion(value: string): CategoriaInstitucion {
  const found = CATEGORIAS_INSTITUCION.find((c) => c.value === value);
  return found?.value ?? "UNIVERSIDAD";
}

export function getEtiquetasInstitucion(categoria: CategoriaInstitucion) {
  switch (categoria) {
    case "COLEGIO":
    case "LICEO":
      return {
        institucion: "Nombre del colegio o liceo",
        institucionPlaceholder: "Ej: U.E. Colegio San José",
        siglas: "Siglas o código corto",
        siglasPlaceholder: "Ej: CSJ",
        programa: "Mención, año o programa",
        programaPlaceholder: "Ej: Quinto año Ciencias · Bachillerato",
        programaDescripcion: "Describe el programa, mención o nivel que quieres agregar",
        documento: "Programa de estudios o pensum (PDF)",
        estudiantesHint:
          "Estudiantes o representantes interesados en agregar esta unidad educativa",
        submit: "Integrar institución",
        entidad: "institución educativa",
      };
    case "ESCUELA_TECNICA":
      return {
        institucion: "Nombre de la escuela técnica",
        institucionPlaceholder: "Ej: Escuela Técnica Industrial",
        siglas: "Siglas",
        siglasPlaceholder: "Ej: ETI",
        programa: "Programa técnico",
        programaPlaceholder: "Ej: TSU en Mecánica Industrial",
        programaDescripcion: "Información sobre el programa técnico",
        documento: "Pensum o programa técnico (PDF)",
        estudiantesHint: "Estudiantes interesados en agregar esta escuela técnica",
        submit: "Integrar institución",
        entidad: "institución educativa",
      };
    case "INSTITUTO":
      return {
        institucion: "Nombre del instituto",
        institucionPlaceholder: "Ej: Instituto Universitario de Tecnología",
        siglas: "Siglas",
        siglasPlaceholder: "Ej: IUT",
        programa: "Nombre de la carrera o programa",
        programaPlaceholder: "Ej: TSU en Informática",
        programaDescripcion: "Información adicional sobre la carrera o programa",
        documento: "Pensum de la carrera (PDF)",
        estudiantesHint: "Estudiantes interesados en agregar este instituto",
        submit: "Integrar institución",
        entidad: "institución educativa",
      };
    case "OTRO":
      return {
        institucion: "Nombre de la unidad educativa",
        institucionPlaceholder: "Ej: Academia de Formación Profesional",
        siglas: "Siglas o abreviatura",
        siglasPlaceholder: "Ej: AFP",
        programa: "Programa o especialidad",
        programaPlaceholder: "Ej: Curso intensivo de programación",
        programaDescripcion: "Describe el programa que quieres agregar",
        documento: "Programa de estudios (PDF)",
        estudiantesHint: "Personas interesadas en agregar esta unidad educativa",
        submit: "Integrar institución",
        entidad: "unidad educativa",
      };
    case "UNIVERSIDAD":
    default:
      return {
        institucion: "Nombre de la universidad",
        institucionPlaceholder: "Ej: Universidad Central de Venezuela",
        siglas: "Siglas de la universidad",
        siglasPlaceholder: "Ej: UCV",
        programa: "Nombre de la carrera",
        programaPlaceholder: "Ej: Ingeniería Informática",
        programaDescripcion: "Información adicional sobre la carrera, especializaciones, etc.",
        documento: "Pensum de la carrera (PDF)",
        estudiantesHint: "Estudiantes interesados en agregar su universidad",
        submit: "Integrar universidad",
        entidad: "universidad",
      };
  }
}

/** Persistencia en campo `tipo` de Universidad (sin migración de schema). */
export function formatTipoInstitucionDb(
  categoria: CategoriaInstitucion,
  caracter: CaracterInstitucion,
): string {
  return `${categoria}|${caracter}`;
}

export function parseTipoInstitucionDb(tipo: string | null | undefined): {
  categoria: CategoriaInstitucion;
  caracter: CaracterInstitucion;
} {
  if (!tipo) {
    return { categoria: "UNIVERSIDAD", caracter: "PUBLICA" };
  }

  if (tipo.includes("|")) {
    const [rawCategoria, rawCaracter] = tipo.split("|");
    return {
      categoria: getCategoriaInstitucion(rawCategoria),
      caracter:
        rawCaracter === "PRIVADA" || rawCaracter === "OTRA"
          ? rawCaracter
          : "PUBLICA",
    };
  }

  if (tipo === "PUBLICA" || tipo === "PRIVADA" || tipo === "OTRA") {
    return { categoria: "UNIVERSIDAD", caracter: tipo };
  }

  if (CATEGORIAS_INSTITUCION.some((c) => c.value === tipo)) {
    return { categoria: getCategoriaInstitucion(tipo), caracter: "PUBLICA" };
  }

  return { categoria: "UNIVERSIDAD", caracter: "PUBLICA" };
}

export function labelCategoriaInstitucion(categoria: CategoriaInstitucion): string {
  return CATEGORIAS_INSTITUCION.find((c) => c.value === categoria)?.label ?? "Institución";
}
