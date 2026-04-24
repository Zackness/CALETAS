"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Debe listar TODOS los valores que `setTheme()` escribe en <html>.
 * Si falta alguno, next-themes no lo quita del classList y al volver al primer tema
 * se “pega” la clase anterior (p. ej. theme-neon). */
const CALETAS_THEMES = [
  "theme-default",
  "theme-claro",
  "theme-oscuro",
  "theme-pastel",
  "theme-neon",
] as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="theme-default"
      themes={[...CALETAS_THEMES]}
      enableSystem={false}
      storageKey="caletas-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

