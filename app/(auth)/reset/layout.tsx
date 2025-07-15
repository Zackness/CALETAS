import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: 'Resetear Contraseña - Caletas',
  description: 'Resetea tu contraseña en la plataforma de Caletas',
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
