/** Presets de color para columnas del tablero (paleta chalk / oscura). */
export const CALETA_BOARD_COLOR_KEYS = [
  "violet",
  "blue",
  "amber",
  "fuchsia",
  "emerald",
  "red",
  "teal",
  "orange",
  "slate",
] as const;

export type CaletaBoardColorKey = (typeof CALETA_BOARD_COLOR_KEYS)[number];

export const CALETA_BOARD_COLOR_PRESETS: Record<
  CaletaBoardColorKey,
  { label: string; pillClass: string; dotClass: string }
> = {
  violet: {
    label: "Violeta",
    pillClass: "bg-violet-500/15 text-violet-200",
    dotClass: "bg-violet-400",
  },
  blue: {
    label: "Azul",
    pillClass: "bg-sky-500/15 text-sky-200",
    dotClass: "bg-sky-400",
  },
  amber: {
    label: "Ámbar",
    pillClass: "bg-amber-500/15 text-amber-100",
    dotClass: "bg-amber-400",
  },
  fuchsia: {
    label: "Fucsia",
    pillClass: "bg-fuchsia-500/15 text-fuchsia-200",
    dotClass: "bg-fuchsia-400",
  },
  emerald: {
    label: "Esmeralda",
    pillClass: "bg-emerald-500/15 text-emerald-200",
    dotClass: "bg-emerald-400",
  },
  red: {
    label: "Rojo",
    pillClass: "bg-red-500/15 text-red-200",
    dotClass: "bg-red-400",
  },
  teal: {
    label: "Turquesa",
    pillClass: "bg-teal-500/15 text-teal-200",
    dotClass: "bg-teal-400",
  },
  orange: {
    label: "Naranja",
    pillClass: "bg-orange-500/15 text-orange-200",
    dotClass: "bg-orange-400",
  },
  slate: {
    label: "Gris",
    pillClass: "bg-white/10 text-white/65",
    dotClass: "bg-white/40",
  },
};

export function isCaletaBoardColorKey(v: string): v is CaletaBoardColorKey {
  return (CALETA_BOARD_COLOR_KEYS as readonly string[]).includes(v);
}
