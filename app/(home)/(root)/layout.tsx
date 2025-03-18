import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "@/app/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from 'next-themes';
import { Header } from "@/components/landing/Header";

export const metadata: Metadata = {
  title: "Home | Global Legal",
  description: "En Global Legal simplificamos tus tramites",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function DashboardLayout ({ 
  children
 }: {
  children: React.ReactNode
 }) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <html lang="es">
        <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >         
            <main className="relative h-full w-full min-h-screen bg-background">
              <Header/>
              <div className="container mx-auto px-4">
                {children}
              </div>
            </main>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}