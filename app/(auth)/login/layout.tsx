import "@/app/globals.css";

export const metadata = {
  title: 'Login en Global Legal',
  description: 'Inicia sesión en tu cuenta de Global Legal',
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
