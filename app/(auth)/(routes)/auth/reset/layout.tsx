import "@/app/globals.css";

export const metadata = {
  title: 'Resetear contraseña en Franky',
  description: 'Resetea tu contraseña en la plataforma de Franky',
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
