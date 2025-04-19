import "@/app/globals.css";

export const metadata = {
  title: 'Registro de usuario en Global Legal',
  description: 'Registrate en Global Legal',
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
