import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Verificación de Correo - Caletas",
  description: "Verifica tu correo electrónico para acceder a Caletas",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
          {children}
      </body>
    </html>
  )
}
