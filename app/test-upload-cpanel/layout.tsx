import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { DashboardHeader } from "../(protected)/components/app-header";
import { IASidebar } from "../(protected)/components/ia-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Dashboard - Caletas",
  description: "Tu dashboard personal para gestionar y explorar caletas universitarias.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/login");
  }

  return (
    <html lang="es">
      <body>
        <SessionProvider session={session}>
          <div className="flex min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
            <IASidebar />
            <div className="flex-1 flex flex-col">
              <DashboardHeader session={session} />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
