import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "@/app/globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Onboarding - Caletas",
  description: "Completa tu perfil en Caletas para acceder a toda la plataforma",
  icons: {
    icon: '/favicon.svg',
  },
};

type Props = {
  children: React.ReactNode;
};

export default async function OnboardingLayout ({ 
  children
 }: {
  children: React.ReactNode
 }) {
    const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="es">
        <body className="flex flex-col h-full bg-gradient-to-br from-mygreen-dark via-mygreen to-mygreen-light text-white">
            <main className="flex flex-col h-full w-full">
              {children}
            </main>
          </body>
      </html>
    </SessionProvider>
  );
}