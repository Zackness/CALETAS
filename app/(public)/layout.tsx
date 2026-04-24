import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Caletas - Encuentra tu Universidad Ideal",
  description: "Descubre las mejores universidades, compara programas y toma la decisión más importante de tu vida académica con confianza.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <section className="bg-gradient-to-t from-mygreen to-mygreen-light min-h-screen w-full m-0 relative text-white">
            {children}
          </section>
        </ThemeProvider>
      </body>
    </html>
  );
}
