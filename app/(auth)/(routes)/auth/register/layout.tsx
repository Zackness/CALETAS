import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: 'Registro en Franky',
  description: 'Registrate en la plataforma de Franky',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
          {children}
      </body>
    </html>
  )
}
