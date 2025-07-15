import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { AppSidebar } from "./components/app-sidebar";
import { DashboardHeader } from "./components/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
      <SidebarProvider>
        <div className="flex h-screen w-screen min-w-0">
          {/* Sidebar siempre al lado, nunca encima del contenido */}
          <AppSidebar />
          {/* Contenido principal adaptativo */}
          <SidebarInset>
            <DashboardHeader session={session} />
            <main className="flex-1 min-w-0 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </SessionProvider>
    </body>
    </html>
  );
}