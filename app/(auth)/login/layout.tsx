import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: 'Iniciar Sesión - Caletas',
  description: 'Inicia sesión en tu cuenta de Caletas',
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
