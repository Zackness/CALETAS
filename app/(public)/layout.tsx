import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const publicAppUrl = configuredAppUrl && !/localhost|127\.0\.0\.1/i.test(configuredAppUrl)
  ? configuredAppUrl
  : "https://caleta.top";

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: {
    default: "CALETAS - Plataforma académica para estudiantes",
    template: "%s | CALETAS",
  },
  description: "Comparte caletas, estudia con IA, organiza tu progreso académico y accede a cursos como Aprende PIC18 desde una plataforma hecha para estudiantes.",
  openGraph: {
    title: "CALETAS",
    description: "Plataforma académica para estudiantes: recursos, IA, cursos, comunidad y progreso.",
    url: "/",
    siteName: "CALETAS",
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CALETAS",
    description: "Recursos, IA, cursos y comunidad académica para estudiantes.",
  },
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
          <section className="chalkboard-shell min-h-screen w-full m-0 relative text-white">
            {children}
          </section>
        </ThemeProvider>
      </body>
    </html>
  );
}
