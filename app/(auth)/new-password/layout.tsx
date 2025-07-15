import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Verificar Email - Caletas',
  description: 'Verifica tu dirección de email en Caletas',
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
