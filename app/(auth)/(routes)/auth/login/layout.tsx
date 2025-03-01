import "@/app/globals.css";

export const metadata = {
  title: 'Login en Franky',
  description: 'Inicia sesión en tu cuenta de Franky',
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
