import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: 'Registrarse - Caletas',
  description: 'Regístrate en la plataforma de Caletas',
}

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
