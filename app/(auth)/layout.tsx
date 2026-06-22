import type { Metadata } from "next";
import "@fontsource-variable/montserrat";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Acceso | CALETAS",
    template: "%s | CALETAS",
  },
  description: "Inicia sesión o regístrate en CALETAS.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function AuthRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
